const fs =
  require(
    "fs/promises"
  );

const path =
  require(
    "path"
  );

const crypto =
  require(
    "crypto"
  );

const sharp =
  require(
    "sharp"
  );

const {
  ensureDirectory,
  buildAssetDirectory,
  getRelativeStoragePath,
  buildPublicUrl,
} = require(
  "./mediaStorage.service"
);

/*
|--------------------------------------------------------------------------
| Image Variant Definitions
|--------------------------------------------------------------------------
|
| Existing variant dimensions are preserved.
|
|--------------------------------------------------------------------------
*/

const IMAGE_VARIANT_DEFINITIONS = [
  {
    variantType:
      "THUMBNAIL",

    width:
      200,

    height:
      200,

    fit:
      "cover",
  },

  {
    variantType:
      "SMALL",

    width:
      400,

    height:
      null,

    fit:
      "inside",
  },

  {
    variantType:
      "MEDIUM",

    width:
      800,

    height:
      null,

    fit:
      "inside",
  },

  {
    variantType:
      "LARGE",

    width:
      1200,

    height:
      null,

    fit:
      "inside",
  },

  {
    variantType:
      "DESKTOP",

    width:
      1600,

    height:
      null,

    fit:
      "inside",
  },

  {
    variantType:
      "TABLET",

    width:
      1024,

    height:
      null,

    fit:
      "inside",
  },

  {
    variantType:
      "MOBILE",

    width:
      640,

    height:
      null,

    fit:
      "inside",
  },

  {
    variantType:
      "KIOSK",

    width:
      1440,

    height:
      null,

    fit:
      "inside",
  },

  {
    variantType:
      "PREVIEW",

    width:
      1000,

    height:
      null,

    fit:
      "inside",
  },
];

/*
|--------------------------------------------------------------------------
| Output Formats
|--------------------------------------------------------------------------
*/

const IMAGE_OUTPUT_FORMATS = [
  {
    format:
      "webp",

    mimeType:
      "image/webp",

    options: {
      quality:
        82,

      effort:
        4,
    },
  },

  {
    format:
      "avif",

    mimeType:
      "image/avif",

    options: {
      quality:
        55,

      effort:
        4,
    },
  },
];

/*
|--------------------------------------------------------------------------
| Product Image Normalisation Settings
|--------------------------------------------------------------------------
|
| This is used ONLY when normalizeProductImage === true.
|
| 0.84 means the longest visible edge of the product
| will occupy approximately 84% of the generated canvas.
|
|--------------------------------------------------------------------------
*/

const PRODUCT_VISUAL_OCCUPANCY =
  0.95;

/*
|--------------------------------------------------------------------------
| Trim Threshold
|--------------------------------------------------------------------------
|
| Conservative setting.
|
| Removes normal white / near-white outer whitespace
| without aggressively eating into lighter products.
|
|--------------------------------------------------------------------------
*/

const PRODUCT_TRIM_THRESHOLD =
  15;

/*
|--------------------------------------------------------------------------
| Product Canvas Background
|--------------------------------------------------------------------------
*/

const PRODUCT_BACKGROUND = {
  r:
    255,

  g:
    255,

  b:
    255,

  alpha:
    1,
};

/*
|--------------------------------------------------------------------------
| Buffer Checksum
|--------------------------------------------------------------------------
*/

const calculateBufferChecksum = (
  buffer
) => {
  return crypto
    .createHash(
      "sha256"
    )
    .update(
      buffer
    )
    .digest(
      "hex"
    );
};

/*
|--------------------------------------------------------------------------
| Standard Resize Options
|--------------------------------------------------------------------------
*/

const buildResizeOptions = (
  definition
) => {
  return {
    width:
      definition.width,

    height:
      definition.height ||
      undefined,

    fit:
      definition.fit,

    withoutEnlargement:
      true,

    position:
      "centre",
  };
};

/*
|--------------------------------------------------------------------------
| Standard Variant Generation
|--------------------------------------------------------------------------
|
| This is the EXISTING behaviour.
|
| Used for:
|
| - normal uploads
| - banners
| - CMS assets
| - category images
| - brand images
| - marketing assets
| - any regeneration where normalisation is disabled
|
|--------------------------------------------------------------------------
*/

const generateStandardVariantBuffer =
  async ({
    sourcePath,
    definition,
    outputFormat,
  }) => {
    let pipeline =
      sharp(
        sourcePath,
        {
          animated:
            false,

          failOn:
            "warning",
        }
      )
        .rotate()
        .resize(
          buildResizeOptions(
            definition
          )
        );

    if (
      outputFormat.format ===
      "webp"
    ) {
      pipeline =
        pipeline.webp(
          outputFormat.options
        );
    }

    if (
      outputFormat.format ===
      "avif"
    ) {
      pipeline =
        pipeline.avif(
          outputFormat.options
        );
    }

    const {
      data,
      info,
    } =
      await pipeline.toBuffer({
        resolveWithObject:
          true,
      });

    return {
      buffer:
        data,

      width:
        info.width ||
        null,

      height:
        info.height ||
        null,

      size:
        info.size,
    };
  };

/*
|--------------------------------------------------------------------------
| Prepare Product Image
|--------------------------------------------------------------------------
|
| ORIGINAL FILE IS NOT CHANGED.
|
| We create an in-memory copy:
|
| rotate
| → flatten transparency onto white
| → trim excess surrounding white space
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Detect Product Bounding Box
|--------------------------------------------------------------------------
*/

const detectProductBoundingBox =
  async (
    sourcePath
  ) => {
    const {
      data,
      info,
    } =
      await sharp(
        sourcePath,
        {
          animated:
            false,

          failOn:
            "warning",
        }
      )
        .rotate()
        .flatten({
          background:
            PRODUCT_BACKGROUND,
        })
        .removeAlpha()
        .raw()
        .toBuffer({
          resolveWithObject:
            true,
        });

    const {
      width,
      height,
      channels,
    } =
      info;

    /*
    |--------------------------------------------------------------------------
    | Detect Background Colour
    |--------------------------------------------------------------------------
    |
    | Sample the four corners.
    |
    |--------------------------------------------------------------------------
    */

    const sampleSize =
      Math.min(
        30,
        Math.floor(
          Math.min(
            width,
            height
          ) /
            4
        )
      );

    let totalR =
      0;

    let totalG =
      0;

    let totalB =
      0;

    let sampleCount =
      0;

    const samplePixel =
      (
        x,
        y
      ) => {
        const index =
          (
            y *
              width +
            x
          ) *
          channels;

        totalR +=
          data[index];

        totalG +=
          data[
            index + 1
          ];

        totalB +=
          data[
            index + 2
          ];

        sampleCount +=
          1;
      };

    for (
      let y = 0;
      y < sampleSize;
      y++
    ) {
      for (
        let x = 0;
        x < sampleSize;
        x++
      ) {
        samplePixel(
          x,
          y
        );

        samplePixel(
          width -
            1 -
            x,
          y
        );

        samplePixel(
          x,
          height -
            1 -
            y
        );

        samplePixel(
          width -
            1 -
            x,
          height -
            1 -
            y
        );
      }
    }

    const background = {
      r:
        totalR /
        sampleCount,

      g:
        totalG /
        sampleCount,

      b:
        totalB /
        sampleCount,
    };

    /*
    |--------------------------------------------------------------------------
    | Content Detection
    |--------------------------------------------------------------------------
    */

    const threshold =
      20;

    const rowCounts =
      new Array(
        height
      ).fill(0);

    const columnCounts =
      new Array(
        width
      ).fill(0);

    for (
      let y = 0;
      y < height;
      y++
    ) {
      for (
        let x = 0;
        x < width;
        x++
      ) {
        const index =
          (
            y *
              width +
            x
          ) *
          channels;

        const r =
          data[index];

        const g =
          data[
            index + 1
          ];

        const b =
          data[
            index + 2
          ];

        const difference =
          Math.max(
            Math.abs(
              r -
                background.r
            ),

            Math.abs(
              g -
                background.g
            ),

            Math.abs(
              b -
                background.b
            )
          );

        if (
          difference >
          threshold
        ) {
          rowCounts[y] +=
            1;

          columnCounts[x] +=
            1;
        }
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Ignore Isolated Background Noise
    |--------------------------------------------------------------------------
    */

    const minimumRowPixels =
      Math.max(
        3,
        Math.round(
          width *
            0.01
        )
      );

    const minimumColumnPixels =
      Math.max(
        3,
        Math.round(
          height *
            0.01
        )
      );

    let top =
      rowCounts.findIndex(
        (
          count
        ) =>
          count >=
          minimumRowPixels
      );

    let bottom =
      -1;

    for (
      let y =
        height - 1;
      y >= 0;
      y--
    ) {
      if (
        rowCounts[y] >=
        minimumRowPixels
      ) {
        bottom =
          y;

        break;
      }
    }

    let left =
      columnCounts.findIndex(
        (
          count
        ) =>
          count >=
          minimumColumnPixels
      );

    let right =
      -1;

    for (
      let x =
        width - 1;
      x >= 0;
      x--
    ) {
      if (
        columnCounts[x] >=
        minimumColumnPixels
      ) {
        right =
          x;

        break;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Fallback
    |--------------------------------------------------------------------------
    |
    | If we cannot safely detect content,
    | use the entire image.
    |
    |--------------------------------------------------------------------------
    */

    if (
      top === -1 ||
      bottom === -1 ||
      left === -1 ||
      right === -1
    ) {
      return {
        left:
          0,

        top:
          0,

        width,

        height,
      };
    }

    /*
    |--------------------------------------------------------------------------
    | Small Safety Margin
    |--------------------------------------------------------------------------
    |
    | Don't crop exactly against the product edge.
    |
    |--------------------------------------------------------------------------
    */

    const detectedWidth =
      right -
      left +
      1;

    const detectedHeight =
      bottom -
      top +
      1;

    const marginX =
      Math.round(
        detectedWidth *
          0.03
      );

    const marginY =
      Math.round(
        detectedHeight *
          0.03
      );

    const safeLeft =
      Math.max(
        0,
        left -
          marginX
      );

    const safeTop =
      Math.max(
        0,
        top -
          marginY
      );

    const safeRight =
      Math.min(
        width - 1,
        right +
          marginX
      );

    const safeBottom =
      Math.min(
        height - 1,
        bottom +
          marginY
      );

    return {
      left:
        safeLeft,

      top:
        safeTop,

      width:
        safeRight -
        safeLeft +
        1,

      height:
        safeBottom -
        safeTop +
        1,
    };
  };

/*
|--------------------------------------------------------------------------
| Prepare Normalized Product Buffer
|--------------------------------------------------------------------------
*/

const prepareNormalizedProductBuffer =
  async (
    sourcePath
  ) => {
    const box =
      await detectProductBoundingBox(
        sourcePath
      );

    console.log(
      "[Product image normalization]",
      {
        sourcePath,

        box,
      }
    );

    return sharp(
      sourcePath,
      {
        animated:
          false,

        failOn:
          "warning",
      }
    )
      .rotate()
      .flatten({
        background:
          PRODUCT_BACKGROUND,
      })
      .extract({
        left:
          box.left,

        top:
          box.top,

        width:
          box.width,

        height:
          box.height,
      })
      .toBuffer();
  };

/*
|--------------------------------------------------------------------------
| Normalised Product Variant
|--------------------------------------------------------------------------
|
| Example:
|
| Source:
|
| 1500 x 1500 canvas
| actual iPhone = 815 x 1009
|
| After trim:
|
| 815 x 1009
|
| Then:
|
| scale proportionally into approximately 84%
| of the requested variant size
|
| Then:
|
| centre it on a clean white square canvas.
|
|--------------------------------------------------------------------------
*/

const generateNormalizedProductVariantBuffer =
  async ({
    normalizedSourceBuffer,
    definition,
    outputFormat,
  }) => {
    /*
    |--------------------------------------------------------------------------
    | Target Canvas
    |--------------------------------------------------------------------------
    |
    | Product variants are intentionally square.
    |
    |--------------------------------------------------------------------------
    */

    const targetWidth =
      Number(
        definition.width
      );

    const targetHeight =
      Number(
        definition.height ||
          definition.width
      );

    /*
    |--------------------------------------------------------------------------
    | Occupied Product Area
    |--------------------------------------------------------------------------
    */

    const innerWidth =
      Math.max(
        1,
        Math.round(
          targetWidth *
            PRODUCT_VISUAL_OCCUPANCY
        )
      );

    const innerHeight =
      Math.max(
        1,
        Math.round(
          targetHeight *
            PRODUCT_VISUAL_OCCUPANCY
        )
      );

    /*
    |--------------------------------------------------------------------------
    | Resize Actual Product
    |--------------------------------------------------------------------------
    |
    | Aspect ratio is preserved.
    |
    | Enlargement is allowed because some originals contain
    | a small product inside a very large white canvas.
    |
    |--------------------------------------------------------------------------
    */

    const resizedProductBuffer =
      await sharp(
        normalizedSourceBuffer,
        {
          animated:
            false,

          failOn:
            "warning",
        }
      )
        .resize({
          width:
            innerWidth,

          height:
            innerHeight,

          fit:
            "inside",

          position:
            "centre",

          withoutEnlargement:
            false,
        })
        .toBuffer();

    /*
    |--------------------------------------------------------------------------
    | Get Actual Resized Dimensions
    |--------------------------------------------------------------------------
    */

    const metadata =
      await sharp(
        resizedProductBuffer
      ).metadata();

    const productWidth =
      metadata.width ||
      innerWidth;

    const productHeight =
      metadata.height ||
      innerHeight;

    /*
    |--------------------------------------------------------------------------
    | Calculate White Padding
    |--------------------------------------------------------------------------
    */

    const left =
      Math.max(
        0,
        Math.floor(
          (
            targetWidth -
            productWidth
          ) /
            2
        )
      );

    const right =
      Math.max(
        0,
        targetWidth -
          productWidth -
          left
      );

    const top =
      Math.max(
        0,
        Math.floor(
          (
            targetHeight -
            productHeight
          ) /
            2
        )
      );

    const bottom =
      Math.max(
        0,
        targetHeight -
          productHeight -
          top
      );

    /*
    |--------------------------------------------------------------------------
    | Put Product Onto Square White Canvas
    |--------------------------------------------------------------------------
    */

    let pipeline =
      sharp(
        resizedProductBuffer
      )
        .extend({
          top,
          bottom,
          left,
          right,

          background:
            PRODUCT_BACKGROUND,
        });

    /*
    |--------------------------------------------------------------------------
    | Output Format
    |--------------------------------------------------------------------------
    */

    if (
      outputFormat.format ===
      "webp"
    ) {
      pipeline =
        pipeline.webp(
          outputFormat.options
        );
    }

    if (
      outputFormat.format ===
      "avif"
    ) {
      pipeline =
        pipeline.avif(
          outputFormat.options
        );
    }

    const {
      data,
      info,
    } =
      await pipeline.toBuffer({
        resolveWithObject:
          true,
      });

    return {
      buffer:
        data,

      width:
        info.width ||
        null,

      height:
        info.height ||
        null,

      size:
        info.size,
    };
  };

/*
|--------------------------------------------------------------------------
| Generate Image Variants
|--------------------------------------------------------------------------
|
| NEW OPTIONAL PARAMETER:
|
| normalizeProductImage
|
| DEFAULT = false
|
| This means ALL EXISTING UPLOADS CONTINUE WORKING
| EXACTLY AS THEY DO TODAY.
|
|--------------------------------------------------------------------------
*/

const generateImageVariants =
  async ({
    companyId,
    assetId,
    sourcePath,
    isPublic,

    normalizeProductImage =
      false,
  }) => {
    const assetDirectory =
      buildAssetDirectory({
        companyId,
        assetId,
      });

    const variantsDirectory =
      path.join(
        assetDirectory,
        "variants"
      );

    await ensureDirectory(
      variantsDirectory
    );

    const generatedVariants =
      [];

    /*
    |--------------------------------------------------------------------------
    | Prepare Normalized Product Once
    |--------------------------------------------------------------------------
    |
    | We trim only once, not once for every generated variant.
    |
    |--------------------------------------------------------------------------
    */

    let normalizedProductBuffer =
      null;

    if (
      normalizeProductImage
    ) {
      normalizedProductBuffer =
        await prepareNormalizedProductBuffer(
          sourcePath
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Generate Variants
    |--------------------------------------------------------------------------
    */

    for (
      const definition of
      IMAGE_VARIANT_DEFINITIONS
    ) {
      for (
        const outputFormat of
        IMAGE_OUTPUT_FORMATS
      ) {
        let result;

        /*
        |--------------------------------------------------------------------------
        | Normalized Product
        |--------------------------------------------------------------------------
        */

        if (
          normalizeProductImage &&
          normalizedProductBuffer
        ) {
          result =
            await generateNormalizedProductVariantBuffer({
              normalizedSourceBuffer:
                normalizedProductBuffer,

              definition,

              outputFormat,
            });
        } else {
          /*
          |--------------------------------------------------------------------------
          | Standard Existing Behaviour
          |--------------------------------------------------------------------------
          */

          result =
            await generateStandardVariantBuffer({
              sourcePath,

              definition,

              outputFormat,
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Variant Filename
        |--------------------------------------------------------------------------
        */

        const fileName =
          `${definition.variantType.toLowerCase()}.${outputFormat.format}`;

        const absolutePath =
          path.join(
            variantsDirectory,
            fileName
          );

        /*
        |--------------------------------------------------------------------------
        | Save Generated Variant
        |--------------------------------------------------------------------------
        */

        await fs.writeFile(
          absolutePath,
          result.buffer
        );

        const storagePath =
          getRelativeStoragePath(
            absolutePath
          );

        /*
        |--------------------------------------------------------------------------
        | Variant Record
        |--------------------------------------------------------------------------
        */

        generatedVariants.push({
          variantType:
            definition.variantType,

          format:
            outputFormat.format,

          mimeType:
            outputFormat.mimeType,

          width:
            result.width,

          height:
            result.height,

          fileSize:
            result.size,

          storageProvider:
            "LOCAL",

          storagePath,

          publicUrl:
            isPublic
              ? buildPublicUrl(
                  storagePath
                )
              : null,

          checksum:
            calculateBufferChecksum(
              result.buffer
            ),

          isPrimary:
            false,

          isActive:
            true,
        });
      }
    }

    return generatedVariants;
  };

/*
|--------------------------------------------------------------------------
| Dominant Colour
|--------------------------------------------------------------------------
*/

const extractDominantColor =
  async (
    sourcePath
  ) => {
    try {
      const {
        dominant,
      } =
        await sharp(
          sourcePath
        )
          .rotate()
          .stats();

      const toHex =
        (
          value
        ) =>
          Math.round(
            value
          )
            .toString(
              16
            )
            .padStart(
              2,
              "0"
            );

      return `#${toHex(
        dominant.r
      )}${toHex(
        dominant.g
      )}${toHex(
        dominant.b
      )}`.toUpperCase();
    } catch (
      error
    ) {
      console.error(
        "Unable to extract dominant colour:",
        error.message
      );

      return null;
    }
  };

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  IMAGE_VARIANT_DEFINITIONS,
  IMAGE_OUTPUT_FORMATS,
  generateImageVariants,
  extractDominantColor,
};