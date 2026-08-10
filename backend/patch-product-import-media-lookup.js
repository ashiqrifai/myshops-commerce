const fs = require("fs");
const path = require("path");

const filePath = path.resolve(
  process.cwd(),
  "src/modules/product-import/services/lookup.service.js"
);

if (!fs.existsSync(filePath)) {
  throw new Error(
    `lookup.service.js was not found at:\n${filePath}`
  );
}

let source = fs.readFileSync(
  filePath,
  "utf8"
);

function replaceOnce({
  search,
  replacement,
  description,
}) {
  if (!source.includes(search)) {
    throw new Error(
      `Unable to patch ${description}. ` +
      "The expected source block was not found."
    );
  }

  source = source.replace(
    search,
    replacement
  );
}

/*
|--------------------------------------------------------------------------
| 1. Add media ID collector
|--------------------------------------------------------------------------
*/

const collectBarcodesBlock = `  const collectBarcodes = (
    rows
  ) =>
    uniqueValues(
      rows
        .map((row) =>
          clean(
            row.barcode
          )
        )
        .filter(Boolean)
    );`;

const collectMediaAssetIdsBlock = `${collectBarcodesBlock}
  
  /*
  |--------------------------------------------------------------------------
  | Collect Media Asset IDs
  |--------------------------------------------------------------------------
  */
  
  const collectMediaAssetIds = (
    rows
  ) => {
    const values = [];
  
    for (const row of rows || []) {
      const primaryMediaAssetId =
        clean(
          row.primaryMediaAssetId
        );
  
      if (primaryMediaAssetId) {
        values.push(
          primaryMediaAssetId
        );
      }
  
      const galleryMediaAssetIds =
        normalizeArray(
          row.galleryMediaAssetIds
        )
          .map(
            (value) =>
              clean(value)
          )
          .filter(Boolean);
  
      values.push(
        ...galleryMediaAssetIds
      );
  
      const variantMediaAssetId =
        clean(
          row.variantMediaAssetId
        );
  
      if (variantMediaAssetId) {
        values.push(
          variantMediaAssetId
        );
      }
    }
  
    return uniqueValues(
      values
    );
  };`;

if (
  !source.includes(
    "const collectMediaAssetIds"
  )
) {
  replaceOnce({
    search:
      collectBarcodesBlock,

    replacement:
      collectMediaAssetIdsBlock,

    description:
      "media asset ID collector",
  });
}

/*
|--------------------------------------------------------------------------
| 2. Add MediaAsset loader
|--------------------------------------------------------------------------
*/

const existingProductsHeading = `  /*
  |--------------------------------------------------------------------------
  | Load Existing Products
  |--------------------------------------------------------------------------
  */`;

const mediaLoaderBlock = `  /*
  |--------------------------------------------------------------------------
  | Load Media Assets
  |--------------------------------------------------------------------------
  */
  
  const loadMediaAssets = async ({
    companyId,
    mediaAssetIds,
    transaction,
  }) => {
    if (
      !Array.isArray(
        mediaAssetIds
      ) ||
      mediaAssetIds.length ===
        0
    ) {
      return [];
    }
  
    return db.MediaAsset.findAll({
      where: {
        companyId,
  
        id: {
          [Op.in]:
            mediaAssetIds,
        },
      },
  
      attributes: [
        "id",
        "companyId",
        "assetType",
        "classification",
        "status",
        "title",
        "altText",
        "originalFileName",
        "mimeType",
        "publicUrl",
        "thumbnailPath",
        "previewPath",
        "width",
        "height",
        "isPublic",
        "isActive",
      ],
  
      transaction,
    });
  };
  
${existingProductsHeading}`;

if (
  !source.includes(
    "const loadMediaAssets"
  )
) {
  replaceOnce({
    search:
      existingProductsHeading,

    replacement:
      mediaLoaderBlock,

    description:
      "media asset loader",
  });
}

/*
|--------------------------------------------------------------------------
| 3. Collect requested MediaAsset IDs
|--------------------------------------------------------------------------
*/

const barcodeCollectionBlock = `      const barcodes =
        collectBarcodes(
          rows
        );`;

const mediaCollectionBlock = `${barcodeCollectionBlock}
  
      const mediaAssetIds =
        collectMediaAssetIds(
          rows
        );`;

if (
  !source.includes(
    "const mediaAssetIds ="
  )
) {
  replaceOnce({
    search:
      barcodeCollectionBlock,

    replacement:
      mediaCollectionBlock,

    description:
      "media asset ID collection",
  });
}

/*
|--------------------------------------------------------------------------
| 4. Add mediaAssets to Promise.all result
|--------------------------------------------------------------------------
*/

const promiseResultBlock = `        existingProducts,
        existingVariants,
      ] = await Promise.all([`;

const promiseResultWithMedia = `        existingProducts,
        existingVariants,
        mediaAssets,
      ] = await Promise.all([`;

if (
  !source.includes(
    "        mediaAssets,\n" +
    "      ] = await Promise.all(["
  )
) {
  replaceOnce({
    search:
      promiseResultBlock,

    replacement:
      promiseResultWithMedia,

    description:
      "Promise media result",
  });
}

/*
|--------------------------------------------------------------------------
| 5. Load MediaAssets inside Promise.all
|--------------------------------------------------------------------------
*/

const existingVariantLoaderBlock = `        loadExistingVariants({
          companyId,
          variantSkus,
          barcodes,
          transaction,
        }),
      ]);`;

const existingVariantAndMediaLoaderBlock = `        loadExistingVariants({
          companyId,
          variantSkus,
          barcodes,
          transaction,
        }),
  
        loadMediaAssets({
          companyId,
          mediaAssetIds,
          transaction,
        }),
      ]);`;

if (
  !source.includes(
    "        loadMediaAssets({"
  )
) {
  replaceOnce({
    search:
      existingVariantLoaderBlock,

    replacement:
      existingVariantAndMediaLoaderBlock,

    description:
      "MediaAsset Promise loader",
  });
}

/*
|--------------------------------------------------------------------------
| 6. Add media IDs to requested lookup metadata
|--------------------------------------------------------------------------
*/

const requestedKeysBlock = `          variantSkus,
          barcodes,
  
          attributeOptionReferences:`;

const requestedKeysWithMedia = `          variantSkus,
          barcodes,
          mediaAssetIds,
  
          attributeOptionReferences:`;

if (
  !source.includes(
    "          mediaAssetIds,\n" +
    "  \n" +
    "          attributeOptionReferences:"
  )
) {
  replaceOnce({
    search:
      requestedKeysBlock,

    replacement:
      requestedKeysWithMedia,

    description:
      "requested media metadata",
  });
}

/*
|--------------------------------------------------------------------------
| 7. Add mediaAssets to lookup rows
|--------------------------------------------------------------------------
*/

const lookupRowsBlock = `          priceLists,
          existingProducts,
          existingVariants,
        },`;

const lookupRowsWithMedia = `          priceLists,
          existingProducts,
          existingVariants,
          mediaAssets,
        },`;

if (
  !source.includes(
    "          existingVariants,\n" +
    "          mediaAssets,\n" +
    "        },"
  )
) {
  replaceOnce({
    search:
      lookupRowsBlock,

    replacement:
      lookupRowsWithMedia,

    description:
      "media lookup rows",
  });
}

/*
|--------------------------------------------------------------------------
| 8. Add mediaAssetById lookup map
|--------------------------------------------------------------------------
*/

const variantBarcodeMapBlock = `          variantByBarcode:
            new Map(
              existingVariants
                .filter(
                  (variant) =>
                    Boolean(
                      clean(
                        variant.barcode
                      )
                    )
                )
                .map((variant) => [
                  clean(
                    variant.barcode
                  ),
                  variant,
                ])
            ),
        },`;

const variantBarcodeAndMediaMapBlock = `          variantByBarcode:
            new Map(
              existingVariants
                .filter(
                  (variant) =>
                    Boolean(
                      clean(
                        variant.barcode
                      )
                    )
                )
                .map((variant) => [
                  clean(
                    variant.barcode
                  ),
                  variant,
                ])
            ),
  
          mediaAssetById:
            buildMap(
              mediaAssets,
              (asset) =>
                clean(
                  asset.id
                )
            ),
        },`;

if (
  !source.includes(
    "mediaAssetById:"
  )
) {
  replaceOnce({
    search:
      variantBarcodeMapBlock,

    replacement:
      variantBarcodeAndMediaMapBlock,

    description:
      "mediaAssetById lookup map",
  });
}

/*
|--------------------------------------------------------------------------
| 9. Export collector and loader
|--------------------------------------------------------------------------
*/

const exportsBlock = `    collectVariantSkus,
    collectBarcodes,
  
    buildAttributeMaps,`;

const exportsWithMedia = `    collectVariantSkus,
    collectBarcodes,
    collectMediaAssetIds,
  
    loadMediaAssets,
  
    buildAttributeMaps,`;

if (
  !source.includes(
    "    collectMediaAssetIds,"
  )
) {
  replaceOnce({
    search:
      exportsBlock,

    replacement:
      exportsWithMedia,

    description:
      "media lookup exports",
  });
}

/*
|--------------------------------------------------------------------------
| Save backup and updated file
|--------------------------------------------------------------------------
*/

const backupPath =
  `${filePath}.before-media`;

if (
  !fs.existsSync(
    backupPath
  )
) {
  fs.copyFileSync(
    filePath,
    backupPath
  );
}

fs.writeFileSync(
  filePath,
  source,
  "utf8"
);

console.log(
  "Media lookup support added successfully."
);

console.log(
  `Updated: ${filePath}`
);

console.log(
  `Backup:  ${backupPath}`
);