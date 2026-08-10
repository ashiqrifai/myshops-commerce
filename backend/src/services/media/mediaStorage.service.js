const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const MEDIA_ROOT =
  process.env.MEDIA_STORAGE_ROOT ||
  path.resolve(
    process.cwd(),
    "storage",
    "media"
  );

const TEMP_ROOT =
  process.env.MEDIA_TEMP_ROOT ||
  path.resolve(
    process.cwd(),
    "storage",
    "temp"
  );

const PUBLIC_MEDIA_PREFIX =
  process.env.PUBLIC_MEDIA_PREFIX ||
  "/media";

const ensureDirectory = async (
  directoryPath
) => {
  await fs.mkdir(directoryPath, {
    recursive: true,
  });
};

const sanitizeFileName = (
  fileName
) => {
  const extension =
    path.extname(fileName);

  const baseName = path
    .basename(fileName, extension)
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  const safeBaseName =
    baseName || "media-file";

  return `${safeBaseName}${extension.toLowerCase()}`;
};

const generateStoredFileName = ({
  originalFileName,
  checksum,
}) => {
  const extension =
    path.extname(originalFileName)
      .toLowerCase();

  const safeName = sanitizeFileName(
    originalFileName
  );

  const baseName = path.basename(
    safeName,
    extension
  );

  return `${baseName}-${checksum.slice(
    0,
    16
  )}${extension}`;
};

const buildAssetDirectory = ({
  companyId,
  assetId,
}) => {
  return path.join(
    MEDIA_ROOT,
    companyId,
    assetId
  );
};

const buildAssetStoragePath = ({
  companyId,
  assetId,
  storedFileName,
}) => {
  return path.join(
    buildAssetDirectory({
      companyId,
      assetId,
    }),
    "original",
    storedFileName
  );
};

const moveFile = async ({
  sourcePath,
  destinationPath,
}) => {
  await ensureDirectory(
    path.dirname(destinationPath)
  );

  try {
    await fs.rename(
      sourcePath,
      destinationPath
    );
  } catch (error) {
    if (error.code !== "EXDEV") {
      throw error;
    }

    await fs.copyFile(
      sourcePath,
      destinationPath
    );

    await fs.unlink(sourcePath);
  }

  return destinationPath;
};

const removeFileIfExists = async (
  filePath
) => {
  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};

const removeDirectoryIfExists =
  async (directoryPath) => {
    if (!directoryPath) {
      return;
    }

    try {
      await fs.rm(directoryPath, {
        recursive: true,
        force: true,
      });
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  };

const calculateFileChecksum = async (
  filePath
) => {
  const hash =
    crypto.createHash("sha256");

  const fileHandle =
    await fs.open(filePath, "r");

  try {
    const stream =
      fileHandle.createReadStream();

    for await (const chunk of stream) {
      hash.update(chunk);
    }

    return hash.digest("hex");
  } finally {
    await fileHandle.close();
  }
};

const getRelativeStoragePath = (
  absolutePath
) => {
  return path
    .relative(
      MEDIA_ROOT,
      absolutePath
    )
    .split(path.sep)
    .join("/");
};

const resolveAbsoluteStoragePath = (
  storagePath
) => {
  return path.resolve(
    MEDIA_ROOT,
    storagePath
  );
};

const buildPublicUrl = (
  storagePath
) => {
  const normalizedPath =
    storagePath
      .split(path.sep)
      .join("/");

  return `${PUBLIC_MEDIA_PREFIX}/${normalizedPath}`;
};

module.exports = {
  MEDIA_ROOT,
  TEMP_ROOT,
  PUBLIC_MEDIA_PREFIX,
  ensureDirectory,
  sanitizeFileName,
  generateStoredFileName,
  buildAssetDirectory,
  buildAssetStoragePath,
  moveFile,
  removeFileIfExists,
  removeDirectoryIfExists,
  calculateFileChecksum,
  getRelativeStoragePath,
  resolveAbsoluteStoragePath,
  buildPublicUrl,
};