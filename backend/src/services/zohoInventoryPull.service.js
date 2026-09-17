const {
    Op,
  } = require(
    "sequelize"
  );
  
  const db =
    require(
      "../models"
    );
  
  const {
    getAccessToken,
  } = require(
    "./zohoAuth.service"
  );
  
  const {
    fetchAllZohoItems,
  } = require(
    "./zohoItemSync.service"
  );
  
  const inventoryIntegrationService =
    require(
      "./zohoInventoryIntegration.service"
    );
  
  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */
  
  const text =
    (value) =>
      String(
        value ??
        ""
      ).trim();
  
  const normalizeSku =
    (value) =>
      text(
        value
      ).toUpperCase();
  
  const getRequiredEnv =
    (key) => {
      const value =
        text(
          process.env[
            key
          ]
        );
  
      if (
        !value
      ) {
        throw new Error(
          `${key} is not configured.`
        );
      }
  
      return value;
    };
  
  /*
  |--------------------------------------------------------------------------
  | Zoho Configuration
  |--------------------------------------------------------------------------
  */
  
  const getZohoConfig =
    () => {
      const organizationId =
        getRequiredEnv(
          "ZOHO_ORGANIZATION_ID"
        );
  
      const apiBaseUrl =
        text(
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
  | Company
  |--------------------------------------------------------------------------
  */
  
  const getCompanyByCode =
    async (
      companyCode
    ) => {
      const code =
        text(
          companyCode
        ).toUpperCase();
  
      if (
        !code
      ) {
        throw new Error(
          "companyCode is required."
        );
      }
  
      const company =
        await db.Company.findOne({
          where: {
            code,
            isActive:
              true,
          },
        });
  
      if (
        !company
      ) {
        throw new Error(
          `Company ${code} was not found.`
        );
      }
  
      return company;
    };
  
  /*
  |--------------------------------------------------------------------------
  | Array Chunk
  |--------------------------------------------------------------------------
  */
  
  const chunkArray =
    (
      values,
      size
    ) => {
      const result =
        [];
  
      for (
        let index = 0;
        index <
        values.length;
        index += size
      ) {
        result.push(
          values.slice(
            index,
            index +
              size
          )
        );
      }
  
      return result;
    };
  
  /*
  |--------------------------------------------------------------------------
  | Fetch Zoho Item Details
  |--------------------------------------------------------------------------
  |
  | Zoho item details returns location-wise inventory:
  |
  | locations: [
  |   {
  |     location_id,
  |     location_stock_on_hand,
  |     location_available_stock,
  |     location_actual_available_stock
  |   }
  | ]
  |
  |--------------------------------------------------------------------------
  */
  
  const fetchZohoItemDetailsBatch =
    async (
      itemIds
    ) => {
      if (
        !Array.isArray(
          itemIds
        ) ||
        !itemIds.length
      ) {
        return [];
      }
  
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
  
          item_ids:
            itemIds.join(
              ","
            ),
        });
  
      const response =
        await fetch(
          `${apiBaseUrl}/inventory/v1/itemdetails?${params.toString()}`,
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
          `Zoho item details API returned HTTP ${response.status}.`
        );
      }
  
      return Array.isArray(
        payload.items
      )
        ? payload.items
        : [];
    };
  
  /*
  |--------------------------------------------------------------------------
  | Fetch All Required Zoho Item Details
  |--------------------------------------------------------------------------
  */
  
  const fetchZohoItemDetails =
    async (
      itemIds
    ) => {
      const uniqueIds =
        Array.from(
          new Set(
            itemIds
              .map(
                (id) =>
                  text(
                    id
                  )
              )
              .filter(
                Boolean
              )
          )
        );
  
      /*
       * Keep batches reasonably small so URL length remains safe.
       */
      const batches =
        chunkArray(
          uniqueIds,
          100
        );
  
      const results =
        [];
  
      for (
        let index = 0;
        index <
        batches.length;
        index += 1
      ) {
        const batch =
          batches[
            index
          ];
  
        console.log(
          `[ZOHO INVENTORY PULL] Fetching item details batch ${index + 1}/${batches.length} (${batch.length} items)`
        );
  
        const items =
          await fetchZohoItemDetailsBatch(
            batch
          );
  
        results.push(
          ...items
        );
      }
  
      return results;
    };
  
  /*
  |--------------------------------------------------------------------------
  | Parse Zoho Location Quantity
  |--------------------------------------------------------------------------
  */
  
  const getLocationQuantity =
    (
      location
    ) => {
      if (
        !location
      ) {
        return 0;
      }
  
      /*
       * Physical quantity on hand is our first choice.
       */
      const candidates =
        [
          location
            .location_stock_on_hand,
  
          location
            .stock_on_hand,
  
          location
            .location_available_stock,
  
          location
            .location_actual_available_stock,
        ];
  
      for (
        const value of
        candidates
      ) {
        if (
          value ===
            null ||
          value ===
            undefined ||
          value ===
            ""
        ) {
          continue;
        }
  
        const number =
          Number(
            value
          );
  
        if (
          Number.isFinite(
            number
          )
        ) {
          return number;
        }
      }
  
      return 0;
    };
  
  /*
  |--------------------------------------------------------------------------
  | Pull Inventory From Zoho
  |--------------------------------------------------------------------------
  */
  
  const syncInventory =
    async ({
      companyCode,
      zeroMissingLocations =
        true,
    }) => {
      const startedAt =
        new Date();
  
      /*
      |--------------------------------------------------------------------------
      | Company
      |--------------------------------------------------------------------------
      */
  
      const company =
        await getCompanyByCode(
          companyCode
        );
  
      console.log(
        `[ZOHO INVENTORY PULL] Starting inventory sync for ${company.code}`
      );
  
      /*
      |--------------------------------------------------------------------------
      | Active Location Mappings
      |--------------------------------------------------------------------------
      */
  
      const mappings =
        await db.ZohoLocationMapping.findAll({
          where: {
            companyId:
              company.id,
  
            isActive:
              true,
          },
  
          include: [
            {
              model:
                db.InventoryLocation,
  
              as:
                "inventoryLocation",
  
              required:
                true,
  
              where: {
                companyId:
                  company.id,
  
                isActive:
                  true,
              },
            },
          ],
        });
  
      if (
        !mappings.length
      ) {
        throw new Error(
          `No active Zoho location mappings exist for company ${company.code}.`
        );
      }
  
      const mappedLocationIds =
        new Set(
          mappings.map(
            (mapping) =>
              text(
                mapping
                  .zohoLocationId
              )
          )
        );
  
      /*
      |--------------------------------------------------------------------------
      | Local Variants
      |--------------------------------------------------------------------------
      */
  
      const localVariants =
        await db.ProductVariant.findAll({
          where: {
            companyId:
              company.id,
  
            status: {
              [Op.ne]:
                "ARCHIVED",
            },
  
            sku: {
              [Op.ne]:
                null,
            },
          },
  
          attributes: [
            "id",
            "sku",
            "zohoItemId",
            "zohoItemCode",
          ],
        });
  
      /*
      |--------------------------------------------------------------------------
      | Load Zoho Item Master
      |--------------------------------------------------------------------------
      |
      | We reuse your existing Zoho item listing function.
      |
      |--------------------------------------------------------------------------
      */
  
      const zohoItems =
        await fetchAllZohoItems();
  
      const zohoById =
        new Map();
  
      const zohoBySku =
        new Map();
  
      for (
        const item of
        zohoItems
      ) {
        const itemId =
          text(
            item.item_id
          );
  
        const sku =
          normalizeSku(
            item.sku
          );
  
        if (
          itemId
        ) {
          zohoById.set(
            itemId,
            item
          );
        }
  
        if (
          sku &&
          !zohoBySku.has(
            sku
          )
        ) {
          zohoBySku.set(
            sku,
            item
          );
        }
      }
  
      /*
      |--------------------------------------------------------------------------
      | Match Website Variants To Zoho
      |--------------------------------------------------------------------------
      */
  
      const matchedVariants =
        [];
  
      const unmatchedVariants =
        [];
  
      for (
        const variant of
        localVariants
      ) {
        const existingZohoItemId =
          text(
            variant
              .zohoItemId
          );
  
        let zohoItem =
          null;
  
        /*
         * Prefer the Zoho item ID created by sync-items.
         */
        if (
          existingZohoItemId
        ) {
          zohoItem =
            zohoById.get(
              existingZohoItemId
            ) ||
            null;
        }
  
        /*
         * SKU fallback.
         */
        if (
          !zohoItem
        ) {
          zohoItem =
            zohoBySku.get(
              normalizeSku(
                variant.sku
              )
            ) ||
            null;
        }
  
        if (
          !zohoItem
        ) {
          unmatchedVariants.push({
            productVariantId:
              variant.id,
  
            sku:
              variant.sku,
  
            zohoItemId:
              existingZohoItemId ||
              null,
          });
  
          continue;
        }
  
        const zohoItemId =
          text(
            zohoItem.item_id
          );
  
        if (
          !zohoItemId
        ) {
          unmatchedVariants.push({
            productVariantId:
              variant.id,
  
            sku:
              variant.sku,
  
            zohoItemId:
              null,
          });
  
          continue;
        }
  
        matchedVariants.push({
          variant,
  
          zohoItemId,
  
          zohoItem,
        });
      }
  
      console.log(
        `[ZOHO INVENTORY PULL] Local variants: ${localVariants.length}, matched: ${matchedVariants.length}, unmatched: ${unmatchedVariants.length}`
      );
  
      /*
      |--------------------------------------------------------------------------
      | Fetch Detailed Item Inventory
      |--------------------------------------------------------------------------
      */
  
      const itemIds =
        matchedVariants.map(
          (
            matched
          ) =>
            matched
              .zohoItemId
        );
  
      const itemDetails =
        await fetchZohoItemDetails(
          itemIds
        );
  
      const detailsById =
        new Map();
  
      for (
        const item of
        itemDetails
      ) {
        const itemId =
          text(
            item.item_id
          );
  
        if (
          itemId
        ) {
          detailsById.set(
            itemId,
            item
          );
        }
      }
  
      /*
      |--------------------------------------------------------------------------
      | Convert Zoho Inventory Into Existing Snapshot Format
      |--------------------------------------------------------------------------
      */
  
      const snapshotItems =
        [];
  
      const missingDetails =
        [];
  
      for (
        const matched of
        matchedVariants
      ) {
        const {
          variant,
          zohoItemId,
        } =
          matched;
  
        const detail =
          detailsById.get(
            zohoItemId
          );
  
        if (
          !detail
        ) {
          missingDetails.push({
            sku:
              variant.sku,
  
            zohoItemId,
          });
  
          continue;
        }
  
        const zohoLocations =
          Array.isArray(
            detail.locations
          )
            ? detail.locations
            : [];
  
        const locationById =
          new Map();
  
        for (
          const location of
          zohoLocations
        ) {
          const locationId =
            text(
              location
                .location_id
            );
  
          if (
            !locationId
          ) {
            continue;
          }
  
          locationById.set(
            locationId,
            location
          );
        }
  
        /*
         * Process only locations mapped to MyShops.
         *
         * This prevents unrelated Zoho locations from generating
         * "location not mapped" errors.
         */
        for (
          const mapping of
          mappings
        ) {
          const zohoLocationId =
            text(
              mapping
                .zohoLocationId
            );
  
          if (
            !mappedLocationIds.has(
              zohoLocationId
            )
          ) {
            continue;
          }
  
          const zohoLocation =
            locationById.get(
              zohoLocationId
            );
  
          /*
           * Important:
           *
           * In a FULL reconciliation, if a mapped location is not
           * returned for an item, we treat it as zero.
           *
           * This prevents old website stock from remaining forever
           * after Zoho reaches zero.
           */
          if (
            !zohoLocation &&
            !zeroMissingLocations
          ) {
            continue;
          }
  
          const quantityOnHand =
            zohoLocation
              ? getLocationQuantity(
                  zohoLocation
                )
              : 0;
  
          snapshotItems.push({
            sku:
              variant.sku,
  
            zohoItemId,
  
            zohoLocationId,
  
            zohoLocationName:
              mapping
                .zohoLocationName ||
              mapping
                .inventoryLocation
                ?.name ||
              null,
  
            quantityOnHand,
  
            source:
              "ZOHO_PULL",
          });
        }
      }
  
      if (
        !snapshotItems.length
      ) {
        throw new Error(
          "Zoho inventory sync produced no stock rows."
        );
      }
  
      /*
      |--------------------------------------------------------------------------
      | Snapshot ID
      |--------------------------------------------------------------------------
      */
  
      const snapshotId =
        [
          "ZOHO-PULL",
          company.code,
          Date.now(),
        ].join(
          "-"
        );
  
      /*
      |--------------------------------------------------------------------------
      | Reuse Existing Snapshot Processor
      |--------------------------------------------------------------------------
      */
  
      const snapshotResult =
        await inventoryIntegrationService
          .applyStockSnapshot({
            companyCode:
              company.code,
  
            snapshotId,
  
            items:
              snapshotItems,
          });
  
      const completedAt =
        new Date();
  
      const durationMs =
        completedAt.getTime() -
        startedAt.getTime();
  
      console.log(
        `[ZOHO INVENTORY PULL] Completed ${snapshotId}. Rows: ${snapshotItems.length}, processed: ${snapshotResult.processed}, ignored: ${snapshotResult.ignored}, skipped: ${snapshotResult.skipped}`
      );
  
      return {
        snapshotId,
  
        companyCode:
          company.code,
  
        startedAt,
  
        completedAt,
  
        durationMs,
  
        totalZohoItems:
          zohoItems.length,
  
        totalLocalVariants:
          localVariants.length,
  
        matchedVariants:
          matchedVariants.length,
  
        unmatchedVariants:
          unmatchedVariants.length,
  
        zohoItemDetailsLoaded:
          itemDetails.length,
  
        missingItemDetails:
          missingDetails.length,
  
        mappedLocations:
          mappings.length,
  
        generatedSnapshotRows:
          snapshotItems.length,
  
        zeroMissingLocations:
          Boolean(
            zeroMissingLocations
          ),
  
        snapshot:
          snapshotResult,
  
        /*
         * Limit diagnostics so response doesn't become massive.
         */
        diagnostics: {
          unmatchedVariants:
            unmatchedVariants.slice(
              0,
              100
            ),
  
          missingItemDetails:
            missingDetails.slice(
              0,
              100
            ),
        },
      };
    };
  
  module.exports = {
    fetchZohoItemDetailsBatch,
    fetchZohoItemDetails,
    syncInventory,
  };