const db =
  require(
    "../models"
  );

const {
  Op,
} =
  require(
    "sequelize"
  );

const {
  getAccessToken,
} =
  require(
    "./zohoAuth.service"
  );

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const ZOHO_PAGE_SIZE =
  200;

const UPDATE_BATCH_SIZE =
  50;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const normalizeSku =
  (
    value
  ) =>
    String(
      value ||
      ""
    )
      .trim()
      .toUpperCase();

const normalizeValue =
  (
    value
  ) =>
    String(
      value ||
      ""
    ).trim();

/*
|--------------------------------------------------------------------------
| Zoho Configuration
|--------------------------------------------------------------------------
*/

const getZohoConfig =
  () => {
    const organizationId =
      String(
        process.env
          .ZOHO_ORGANIZATION_ID ||
        ""
      ).trim();

    if (
      !organizationId
    ) {
      throw new Error(
        "ZOHO_ORGANIZATION_ID is not configured."
      );
    }

    const apiBaseUrl =
      String(
        process.env
          .ZOHO_API_BASE_URL ||
        "https://www.zohoapis.com"
      ).replace(
        /\/+$/,
        ""
      );

    return {
      organizationId,
      apiBaseUrl,
    };
  };

/*
|--------------------------------------------------------------------------
| Fetch One Zoho Page
|--------------------------------------------------------------------------
*/

const fetchZohoItemsPage =
  async ({
    page,
    perPage =
      ZOHO_PAGE_SIZE,
  }) => {
    const {
      organizationId,
      apiBaseUrl,
    } =
      getZohoConfig();

    const accessToken =
      await getAccessToken();

    const params =
      new URLSearchParams({
        organization_id:
          organizationId,

        page:
          String(
            page
          ),

        per_page:
          String(
            perPage
          ),
      });

    const response =
      await fetch(
        `${apiBaseUrl}/inventory/v1/items?${params.toString()}`,
        {
          method:
            "GET",

          headers: {
            Accept:
              "application/json",

            Authorization:
              `Zoho-oauthtoken ${accessToken}`,
          },

          cache:
            "no-store",
        }
      );

    const payload =
      await response
        .json()
        .catch(
          () => null
        );

    if (
      !response.ok ||
      !payload ||
      Number(
        payload.code
      ) !==
        0
    ) {
      throw new Error(
        payload
          ?.message ||
        `Unable to fetch Zoho items page ${page}.`
      );
    }

    return {
      items:
        Array.isArray(
          payload.items
        )
          ? payload.items
          : [],

      pageContext:
        payload.page_context ||
        {},
    };
  };

/*
|--------------------------------------------------------------------------
| Fetch All Zoho Items
|--------------------------------------------------------------------------
*/

const fetchAllZohoItems =
  async () => {
    const items =
      [];

    let page =
      1;

    while (
      true
    ) {
      const {
        items:
          pageItems,

        pageContext,
      } =
        await fetchZohoItemsPage({
          page,

          perPage:
            ZOHO_PAGE_SIZE,
        });

      items.push(
        ...pageItems
      );

      const hasMore =
        pageContext
          ?.has_more_page ===
          true;

      if (
        !hasMore
      ) {
        break;
      }

      page +=
        1;
    }

    return items;
  };

/*
|--------------------------------------------------------------------------
| Execute Update Batch
|--------------------------------------------------------------------------
|
| Do not launch hundreds or thousands of Sequelize UPDATE operations at once.
|
| Each batch contains at most UPDATE_BATCH_SIZE records.
|--------------------------------------------------------------------------
*/

const executeUpdateBatch =
  async (
    batch
  ) => {
    if (
      !Array.isArray(
        batch
      ) ||
      !batch.length
    ) {
      return 0;
    }

    await Promise.all(
      batch.map(
        (
          update
        ) =>
          update.variant
            .update(
              update.values
            )
      )
    );

    return batch.length;
  };

/*
|--------------------------------------------------------------------------
| Execute Updates In Controlled Batches
|--------------------------------------------------------------------------
*/

const executeUpdatesInBatches =
  async (
    updates
  ) => {
    if (
      !Array.isArray(
        updates
      ) ||
      !updates.length
    ) {
      return 0;
    }

    let updated =
      0;

    for (
      let index =
        0;
      index <
        updates.length;
      index +=
        UPDATE_BATCH_SIZE
    ) {
      const batch =
        updates.slice(
          index,
          index +
            UPDATE_BATCH_SIZE
        );

      updated +=
        await executeUpdateBatch(
          batch
        );
    }

    return updated;
  };

/*
|--------------------------------------------------------------------------
| Sync Zoho Items
|--------------------------------------------------------------------------
|
| Matching rule:
|
| ProductVariant.sku
|        =
| Zoho item.sku
|
| Matching remains exact after:
|
| - trim()
| - uppercase()
|
| No barcode/EAN fallback is used.
|--------------------------------------------------------------------------
*/

const syncItems =
  async ({
    companyId,
    dryRun =
      false,
  }) => {
    if (
      !companyId
    ) {
      throw new Error(
        "companyId is required."
      );
    }

    const syncStartedAt =
      new Date();
    
      const linkStatusRows =
      [];

    /*
    |--------------------------------------------------------------------------
    | Fetch Zoho Items
    |--------------------------------------------------------------------------
    */

    const zohoItems =
      await fetchAllZohoItems();

    /*
     * Only Zoho items containing a usable SKU can participate in matching.
     */
    const usableZohoItems =
      zohoItems.filter(
        (
          item
        ) =>
          normalizeSku(
            item.sku
          )
      );

    /*
    |--------------------------------------------------------------------------
    | Build Zoho SKU Map
    |--------------------------------------------------------------------------
    */

    const zohoBySku =
      new Map();

    const duplicateZohoSkus =
      [];

    for (
      const item of
      usableZohoItems
    ) {
      const sku =
        normalizeSku(
          item.sku
        );

      if (
        zohoBySku.has(
          sku
        )
      ) {
        duplicateZohoSkus.push(
          sku
        );

        /*
         * Keep the first Zoho item for this SKU.
         *
         * More importantly, the duplicate is reported in the result so the
         * data can be corrected in Zoho.
         */
        continue;
      }

      zohoBySku.set(
        sku,
        item
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Load Local Variants
    |--------------------------------------------------------------------------
    */

    const variants =
      await db.ProductVariant
        .findAll({
          where: {
            companyId,

            sku: {
              [Op.ne]:
                null,
            },
          },

          attributes: [
            "id",
            "productId",
            "sku",
            "name",
            "status",
            "zohoItemId",
            "zohoItemCode",
            "zohoLastSyncedAt",
          ],
        });

    /*
    |--------------------------------------------------------------------------
    | Result Collections
    |--------------------------------------------------------------------------
    */

    const matched =
      [];

    const alreadyLinked =
      [];

    const needsUpdate =
      [];

    const unmatchedLocal =
      [];

    const zohoItemsWithoutItemId =
      [];

    /*
    |--------------------------------------------------------------------------
    | Match Local Variants → Zoho
    |--------------------------------------------------------------------------
    */

    for (
      const variant of
      variants
    ) {
      const sku =
        normalizeSku(
          variant.sku
        );

      /*
       * Defensive check.
       *
       * The database query excludes NULL SKU, but it could theoretically
       * contain an empty/whitespace-only SKU.
       */
      if (
        !sku
      ) {
          unmatchedLocal.push({
            productVariantId:
              variant.id,
      
            sku:
              variant.sku ||
              null,
      
            name:
              variant.name ||
              null,
      
            reason:
              "LOCAL_SKU_EMPTY",
          });
      
          continue;
        }

      const zohoItem =
        zohoBySku.get(
          sku
        );

        if (
          !zohoItem
        ) {
          unmatchedLocal.push({
            productVariantId:
              variant.id,
        
            sku:
              variant.sku,
        
            name:
              variant.name,
        
            reason:
              "SKU_NOT_FOUND_IN_ZOHO",
          });
        
          linkStatusRows.push({
            companyId,
        
            productVariantId:
              variant.id,
        
            sku:
              variant.sku,
        
            status:
              "SKU_NOT_FOUND_IN_ZOHO",
        
            zohoItemId:
              null,
        
            message:
              "Exact SKU was not found in Zoho Inventory.",
        
            lastCheckedAt:
              syncStartedAt,
          });
        
          continue;
        }

      const zohoItemId =
        normalizeValue(
          zohoItem.item_id
        );

        if (
          !zohoItemId
        ) {
          zohoItemsWithoutItemId.push({
            productVariantId:
              variant.id,
        
            sku:
              variant.sku,
        
            name:
              variant.name,
        
            zohoName:
              zohoItem.name ||
              null,
          });
        
          linkStatusRows.push({
            companyId,
        
            productVariantId:
              variant.id,
        
            sku:
              variant.sku,
        
            status:
              "ZOHO_ITEM_MISSING_ID",
        
            zohoItemId:
              null,
        
            message:
              "Matching Zoho SKU was found but the Zoho item ID was missing.",
        
            lastCheckedAt:
              syncStartedAt,
          });
        
          continue;
        }

      const zohoItemCode =
        normalizeValue(
          zohoItem.sku ||
          variant.sku
        );

      matched.push({
        productVariantId:
          variant.id,

        sku:
          variant.sku,

        zohoItemId,

        zohoName:
          zohoItem.name ||
          null,
      });

      linkStatusRows.push({
        companyId,
      
        productVariantId:
          variant.id,
      
        sku:
          variant.sku,
      
        status:
          "LINKED",
      
        zohoItemId,
      
        message:
          "Exact SKU matched successfully with Zoho Inventory.",
      
        lastCheckedAt:
          syncStartedAt,
      });

      /*
      |--------------------------------------------------------------------------
      | Skip Already Correct Links
      |--------------------------------------------------------------------------
      |
      | Do not rewrite a variant if:
      |
      | - zohoItemId already matches
      | - zohoItemCode already matches
      |
      | This makes repeated dashboard syncs inexpensive.
      |--------------------------------------------------------------------------
      */

      const existingZohoItemId =
        normalizeValue(
          variant.zohoItemId
        );

      const existingZohoItemCode =
        normalizeSku(
          variant.zohoItemCode
        );

      const normalizedZohoItemCode =
        normalizeSku(
          zohoItemCode
        );

      const itemIdMatches =
        existingZohoItemId ===
        zohoItemId;

      const itemCodeMatches =
        existingZohoItemCode ===
        normalizedZohoItemCode;

      if (
        itemIdMatches &&
        itemCodeMatches
      ) {
        alreadyLinked.push({
          productVariantId:
            variant.id,

          sku:
            variant.sku,

          zohoItemId,

          zohoName:
            zohoItem.name ||
            null,
        });

        continue;
      }

      /*
      |--------------------------------------------------------------------------
      | New or Changed Link
      |--------------------------------------------------------------------------
      */

      needsUpdate.push({
        variant,

        values: {
          zohoItemId,

          zohoItemCode,

          zohoLastSyncedAt:
            new Date(),
        },

        result: {
          productVariantId:
            variant.id,

          sku:
            variant.sku,

          previousZohoItemId:
            existingZohoItemId ||
            null,

          zohoItemId,

          zohoName:
            zohoItem.name ||
            null,

          changeType:
            existingZohoItemId
              ? "CHANGED"
              : "NEW",
        },
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Perform Database Updates
    |--------------------------------------------------------------------------
    */

    let updatedCount =
      0;

    if (
      !dryRun &&
      needsUpdate.length
    ) {
      updatedCount =
        await executeUpdatesInBatches(
          needsUpdate
        );
    }

    /*
|--------------------------------------------------------------------------
| Persist Link Status
|--------------------------------------------------------------------------
|
| Dry runs must never change integration-status records.
|--------------------------------------------------------------------------
*/

if (
  !dryRun &&
  linkStatusRows.length
) {
  for (
    let index =
      0;
    index <
      linkStatusRows.length;
    index +=
      UPDATE_BATCH_SIZE
  ) {
    const batch =
      linkStatusRows.slice(
        index,
        index +
          UPDATE_BATCH_SIZE
      );

    await Promise.all(
      batch.map(
        (
          statusRow
        ) =>
          db.ZohoItemLinkStatus
            .upsert(
              statusRow
            )
      )
    );
  }
}

    /*
    |--------------------------------------------------------------------------
    | Local SKU Set
    |--------------------------------------------------------------------------
    |
    | Used to identify Zoho items that do not exist locally.
    |--------------------------------------------------------------------------
    */

    const localSkuSet =
      new Set(
        variants
          .map(
            (
              variant
            ) =>
              normalizeSku(
                variant.sku
              )
          )
          .filter(
            Boolean
          )
      );

    /*
    |--------------------------------------------------------------------------
    | Zoho Items Not Found Locally
    |--------------------------------------------------------------------------
    */

    const unmatchedZoho =
      usableZohoItems
        .filter(
          (
            item
          ) =>
            !localSkuSet.has(
              normalizeSku(
                item.sku
              )
            )
        )
        .map(
          (
            item
          ) => ({
            zohoItemId:
              normalizeValue(
                item.item_id
              ) ||
              null,

            sku:
              item.sku ||
              null,

            name:
              item.name ||
              null,

            reason:
              "SKU_NOT_FOUND_LOCALLY",
          })
        );

    /*
    |--------------------------------------------------------------------------
    | Unique Duplicate Zoho SKUs
    |--------------------------------------------------------------------------
    */

    const uniqueDuplicateZohoSkus =
      Array.from(
        new Set(
          duplicateZohoSkus
        )
      );

    /*
    |--------------------------------------------------------------------------
    | Changed Links
    |--------------------------------------------------------------------------
    */

    const changedLinks =
      needsUpdate.map(
        (
          update
        ) =>
          update.result
      );

    const newLinkCount =
      changedLinks.filter(
        (
          item
        ) =>
          item.changeType ===
          "NEW"
      ).length;

    const changedLinkCount =
      changedLinks.filter(
        (
          item
        ) =>
          item.changeType ===
          "CHANGED"
      ).length;

    /*
    |--------------------------------------------------------------------------
    | Result
    |--------------------------------------------------------------------------
    */

    const syncCompletedAt =
      new Date();

    return {
      dryRun,

      /*
      |--------------------------------------------------------------------------
      | Timing
      |--------------------------------------------------------------------------
      */

      syncStartedAt:
        syncStartedAt
          .toISOString(),

      syncCompletedAt:
        syncCompletedAt
          .toISOString(),

      durationMs:
        syncCompletedAt
          .getTime() -
        syncStartedAt
          .getTime(),

      /*
      |--------------------------------------------------------------------------
      | Zoho
      |--------------------------------------------------------------------------
      */

      totalZohoItems:
        zohoItems.length,

      totalZohoItemsWithSku:
        usableZohoItems.length,

      uniqueZohoSkus:
        zohoBySku.size,

      /*
      |--------------------------------------------------------------------------
      | Local
      |--------------------------------------------------------------------------
      */

      totalLocalVariants:
        variants.length,

      /*
      |--------------------------------------------------------------------------
      | Matching
      |--------------------------------------------------------------------------
      */

      matched:
        matched.length,

      alreadyLinked:
        alreadyLinked.length,

      needsUpdate:
        needsUpdate.length,

      newLinks:
        newLinkCount,

      changedLinks:
        changedLinkCount,

      /*
      |--------------------------------------------------------------------------
      | Database Updates
      |--------------------------------------------------------------------------
      */

      updated:
        dryRun
          ? 0
          : updatedCount,

      wouldUpdate:
        dryRun
          ? needsUpdate.length
          : 0,

      updateBatchSize:
        UPDATE_BATCH_SIZE,

      /*
      |--------------------------------------------------------------------------
      | Unmatched
      |--------------------------------------------------------------------------
      */

      unmatchedLocalCount:
        unmatchedLocal.length,

      unmatchedZohoCount:
        unmatchedZoho.length,

      zohoItemsWithoutItemIdCount:
        zohoItemsWithoutItemId.length,

      /*
      |--------------------------------------------------------------------------
      | Duplicate Zoho SKUs
      |--------------------------------------------------------------------------
      */

      duplicateZohoSkuCount:
        uniqueDuplicateZohoSkus.length,

      duplicateZohoSkus:
        uniqueDuplicateZohoSkus,

      /*
      |--------------------------------------------------------------------------
      | Diagnostic Samples
      |--------------------------------------------------------------------------
      |
      | Keep the API response bounded.
      |--------------------------------------------------------------------------
      */

      unmatchedLocal:
        unmatchedLocal.slice(
          0,
          100
        ),

      unmatchedZoho:
        unmatchedZoho.slice(
          0,
          100
        ),

      zohoItemsWithoutItemId:
        zohoItemsWithoutItemId.slice(
          0,
          100
        ),

      updatedItems:
        changedLinks.slice(
          0,
          100
        ),
    };
  };

module.exports = {
  fetchAllZohoItems,
  syncItems,
};