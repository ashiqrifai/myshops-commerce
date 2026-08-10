const crypto =
  require("crypto");

const multer =
  require("multer");

const {
  TEMP_ROOT,
  ensureDirectory,
  sanitizeFileName,
} = require(
  "../../services/media/mediaStorage.service"
);

const MAXIMUM_UPLOAD_BYTES =
  50 * 1024 * 1024;

const MAXIMUM_FILES =
  20;

const storage =
  multer.diskStorage({
    destination: async (
      req,
      file,
      callback
    ) => {
      try {
        await ensureDirectory(
          TEMP_ROOT
        );

        callback(
          null,
          TEMP_ROOT
        );
      } catch (error) {
        callback(error);
      }
    },

    filename: (
      req,
      file,
      callback
    ) => {
      const randomValue =
        crypto.randomUUID();

      const safeFileName =
        sanitizeFileName(
          file.originalname
        );

      callback(
        null,
        `${randomValue}-${safeFileName}`
      );
    },
  });

const mediaUpload =
  multer({
    storage,

    limits: {
      files:
        MAXIMUM_FILES,

      fileSize:
        MAXIMUM_UPLOAD_BYTES,

      fields: 30,
    },
  });

module.exports =
  mediaUpload.array(
    "files",
    MAXIMUM_FILES
  );