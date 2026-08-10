const path = require("path");
const sharp = require("sharp");

const AppError = require(
  "../../utils/AppError"
);

const ALLOWED_FILE_TYPES = {
  "image/jpeg": {
    assetType: "IMAGE",
    extension: "jpg",
    maximumSizeBytes:
      25 * 1024 * 1024,
  },

  "image/png": {
    assetType: "IMAGE",
    extension: "png",
    maximumSizeBytes:
      25 * 1024 * 1024,
  },

  "image/webp": {
    assetType: "IMAGE",
    extension: "webp",
    maximumSizeBytes:
      25 * 1024 * 1024,
  },

  "image/avif": {
    assetType: "IMAGE",
    extension: "avif",
    maximumSizeBytes:
      25 * 1024 * 1024,
  },

  "image/gif": {
    assetType: "IMAGE",
    extension: "gif",
    maximumSizeBytes:
      25 * 1024 * 1024,
  },

  "application/pdf": {
    assetType: "PDF",
    extension: "pdf",
    maximumSizeBytes:
      50 * 1024 * 1024,
  },
  "video/mp4": {
  assetType: "VIDEO",
  extension: "mp4",
  maximumSizeBytes:
    50 * 1024 * 1024,
},

"video/webm": {
  assetType: "VIDEO",
  extension: "webm",
  maximumSizeBytes:
    50 * 1024 * 1024,
},

"video/quicktime": {
  assetType: "VIDEO",
  extension: "mov",
  maximumSizeBytes:
    50 * 1024 * 1024,
},
};

const detectFileType = async (
  filePath
) => {
  /*
   * file-type is ESM-only, so it is loaded
   * through dynamic import from CommonJS.
   */
  const {
    fileTypeFromFile,
  } = await import("file-type");

  return fileTypeFromFile(filePath);
};

const validateUploadedFile = async ({
  filePath,
  originalFileName,
  reportedMimeType,
  fileSize,
}) => {
  const detected =
    await detectFileType(filePath);

  if (!detected) {
    throw new AppError(
      "The uploaded file type could not be identified.",
      400,
      "MEDIA_FILE_TYPE_UNKNOWN"
    );
  }

  const configuration =
    ALLOWED_FILE_TYPES[detected.mime];

  if (!configuration) {
    throw new AppError(
      `Files of type ${detected.mime} are not currently supported.`,
      400,
      "MEDIA_FILE_TYPE_NOT_ALLOWED"
    );
  }

  if (
    fileSize >
    configuration.maximumSizeBytes
  ) {
    throw new AppError(
      `The uploaded file exceeds the allowed size for ${detected.mime}.`,
      413,
      "MEDIA_FILE_TOO_LARGE"
    );
  }

  const originalExtension = path
    .extname(originalFileName)
    .replace(".", "")
    .toLowerCase();

  const acceptedExtensions =
    detected.mime === "image/jpeg"
      ? ["jpg", "jpeg"]
      : [configuration.extension];

  if (
    originalExtension &&
    !acceptedExtensions.includes(
      originalExtension
    )
  ) {
    throw new AppError(
      "The filename extension does not match the uploaded file content.",
      400,
      "MEDIA_FILE_EXTENSION_MISMATCH"
    );
  }

  /*
   * Browser-provided MIME type is not trusted
   * as the source of truth. It is retained only
   * for troubleshooting.
   */
  return {
    mimeType: detected.mime,
    extension:
      configuration.extension,
    assetType:
      configuration.assetType,
    reportedMimeType,
  };
};

const getImageOrientation = ({
  width,
  height,
}) => {
  if (!width || !height) {
    return "UNKNOWN";
  }

  if (width === height) {
    return "SQUARE";
  }

  return width > height
    ? "LANDSCAPE"
    : "PORTRAIT";
};

const extractImageMetadata = async (
  filePath
) => {
  const metadata = await sharp(
    filePath,
    {
      animated: true,
      failOn: "warning",
    }
  ).metadata();

  const width =
    metadata.width || null;

  const height =
    metadata.height || null;

  return {
    width,
    height,

    orientation:
      getImageOrientation({
        width,
        height,
      }),

    hasTransparency:
      metadata.hasAlpha ?? null,

    imageFormat:
      metadata.format || null,

    pageCount:
      metadata.pages || 1,

    space:
      metadata.space || null,

    density:
      metadata.density || null,
  };
};

const extractMediaMetadata = async ({
  filePath,
  assetType,
}) => {
  if (assetType === "IMAGE") {
    return extractImageMetadata(
      filePath
    );
  }

  return {
    width: null,
    height: null,
    orientation: "UNKNOWN",
    hasTransparency: null,
  };
};

module.exports = {
  ALLOWED_FILE_TYPES,
  detectFileType,
  validateUploadedFile,
  extractMediaMetadata,
};