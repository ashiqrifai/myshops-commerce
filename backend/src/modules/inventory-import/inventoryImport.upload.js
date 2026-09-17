const multer = require("multer");
const path = require("path");

const MAXIMUM_CSV_BYTES = 10 * 1024 * 1024;

const allowedExtensions = new Set([".csv"]);

const allowedMimeTypes = new Set([
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "text/plain",
  "application/octet-stream",
]);

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    files: 1,
    fileSize: MAXIMUM_CSV_BYTES,
  },

  fileFilter: (req, file, callback) => {
    const extension = path
      .extname(file.originalname || "")
      .toLowerCase();

    const mimeType = String(file.mimetype || "")
      .trim()
      .toLowerCase();

    if (
      allowedExtensions.has(extension) ||
      allowedMimeTypes.has(mimeType)
    ) {
      callback(null, true);
      return;
    }

    callback(
      new Error("Only CSV files are supported.")
    );
  },
});

module.exports = upload.single("file");
