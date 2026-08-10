const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");

const {
  ensureDirectory,
  buildAssetDirectory,
  getRelativeStoragePath,
  buildPublicUrl,
} = require("./mediaStorage.service");

const IMAGE_VARIANT_DEFINITIONS = [
  {
    variantType: "THUMBNAIL",
    width: 200,
    height: 200,
    fit: "cover",
  },
  {
    variantType: "SMALL",
    width: 400,
    height: null,
    fit: "inside",
  },
  {
    variantType: "MEDIUM",
    width: 800,
    height: null,
    fit: "inside",
  },
  {
    variantType: "LARGE",
    width: 1200,
    height: null,
    fit: "inside",
  },
  {
    variantType: "DESKTOP",
    width: 1600,
    height: null,
    fit: "inside",
  },
  {
    variantType: "TABLET",
    width: 1024,
    height: null,
    fit: "inside",
  },
  {
    variantType: "MOBILE",
    width: 640,
    height: null,
    fit: "inside",
  },
  {
    variantType: "KIOSK",
    width: 1440,
    height: null,
    fit: "inside",
  },
  {
    variantType: "PREVIEW",
    width: 1000,
    height: null,
    fit: "inside",
  },
];

const IMAGE_OUTPUT_FORMATS = [
  {
    format: "webp",
    mimeType: "image/webp",
    options: {
      quality: 82,
      effort: 4,
    },
  },
  {
    format: "avif",
    mimeType: "image/avif",
    options: {
      quality: 55,
      effort: 4,
    },
  },
];

const calculateBufferChecksum = (buffer) => {
  return crypto
    .createHash("sha256")
    .update(buffer)
    .digest("hex");
};

const buildResizeOptions = (definition) => {
  return {
    width: definition.width,
    height: definition.height || undefined,
    fit: definition.fit,
    withoutEnlargement: true,
    position: "centre",
  };
};

const generateVariantBuffer = async ({
  sourcePath,
  definition,
  outputFormat,
}) => {
  let pipeline = sharp(sourcePath, {
    animated: false,
    failOn: "warning",
  })
    .rotate()
    .resize(buildResizeOptions(definition));

  if (outputFormat.format === "webp") {
    pipeline = pipeline.webp(
      outputFormat.options
    );
  }

  if (outputFormat.format === "avif") {
    pipeline = pipeline.avif(
      outputFormat.options
    );
  }

  const { data, info } =
    await pipeline.toBuffer({
      resolveWithObject: true,
    });

  return {
    buffer: data,
    width: info.width || null,
    height: info.height || null,
    size: info.size,
  };
};

const generateImageVariants = async ({
  companyId,
  assetId,
  sourcePath,
  isPublic,
}) => {
  const assetDirectory =
    buildAssetDirectory({
      companyId,
      assetId,
    });

  const variantsDirectory = path.join(
    assetDirectory,
    "variants"
  );

  await ensureDirectory(
    variantsDirectory
  );

  const generatedVariants = [];

  for (const definition of IMAGE_VARIANT_DEFINITIONS) {
    for (const outputFormat of IMAGE_OUTPUT_FORMATS) {
      const result =
        await generateVariantBuffer({
          sourcePath,
          definition,
          outputFormat,
        });

      const fileName =
        `${definition.variantType.toLowerCase()}.${outputFormat.format}`;

      const absolutePath = path.join(
        variantsDirectory,
        fileName
      );

      await fs.writeFile(
        absolutePath,
        result.buffer
      );

      const storagePath =
        getRelativeStoragePath(
          absolutePath
        );

      generatedVariants.push({
        variantType:
          definition.variantType,

        format:
          outputFormat.format,

        mimeType:
          outputFormat.mimeType,

        width: result.width,
        height: result.height,
        fileSize: result.size,

        storageProvider: "LOCAL",
        storagePath,

        publicUrl: isPublic
          ? buildPublicUrl(storagePath)
          : null,

        checksum:
          calculateBufferChecksum(
            result.buffer
          ),

        isPrimary: false,
        isActive: true,
      });
    }
  }

  return generatedVariants;
};

const extractDominantColor = async (
  sourcePath
) => {
  try {
    const { dominant } =
      await sharp(sourcePath)
        .rotate()
        .stats();

    const toHex = (value) =>
      Math.round(value)
        .toString(16)
        .padStart(2, "0");

    return `#${toHex(
      dominant.r
    )}${toHex(
      dominant.g
    )}${toHex(
      dominant.b
    )}`.toUpperCase();
  } catch (error) {
    console.error(
      "Unable to extract dominant colour:",
      error.message
    );

    return null;
  }
};

module.exports = {
  IMAGE_VARIANT_DEFINITIONS,
  IMAGE_OUTPUT_FORMATS,
  generateImageVariants,
  extractDominantColor,
};