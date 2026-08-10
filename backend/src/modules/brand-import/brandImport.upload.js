const multer =
require(
  "multer"
);

const upload =
multer({
  storage:
    multer.memoryStorage(),

  limits: {
    fileSize:
      5 *
      1024 *
      1024,
  },

  fileFilter(
    req,
    file,
    callback
  ) {
    const fileName =
      String(
        file.originalname ||
        ""
      ).toLowerCase();

    const mimeType =
      String(
        file.mimetype ||
        ""
      ).toLowerCase();

    const allowedMimeTypes = [
      "text/csv",
      "application/csv",
      "application/vnd.ms-excel",
      "text/plain",
      "application/octet-stream",
    ];

    if (
      !fileName.endsWith(
        ".csv"
      ) &&
      !allowedMimeTypes.includes(
        mimeType
      )
    ) {
      const error =
        new Error(
          "Only CSV files are supported."
        );

      error.statusCode =
        400;

      error.code =
        "INVALID_BRAND_IMPORT_FILE_TYPE";

      return callback(
        error
      );
    }

    return callback(
      null,
      true
    );
  },
});

const handleBrandImportUpload =
upload.single(
  "file"
);

module.exports = {
  handleBrandImportUpload,
};