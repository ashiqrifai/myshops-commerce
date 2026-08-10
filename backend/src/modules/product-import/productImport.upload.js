const multer =
  require("multer");

const path =
  require("path");

/*
|--------------------------------------------------------------------------
| Upload Limits
|--------------------------------------------------------------------------
*/

const MAX_CSV_FILE_SIZE =
  10 * 1024 * 1024;

const MAX_CSV_FILES =
  1;

/*
|--------------------------------------------------------------------------
| Allowed Types
|--------------------------------------------------------------------------
*/

const ALLOWED_CSV_MIME_TYPES =
  new Set([
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
    "text/plain",
    "application/octet-stream",
  ]);

const ALLOWED_CSV_EXTENSIONS =
  new Set([
    ".csv",
  ]);

/*
|--------------------------------------------------------------------------
| Upload Error
|--------------------------------------------------------------------------
*/

const createUploadError = (
  message,
  code,
  statusCode = 400
) => {
  const error =
    new Error(message);

  error.code =
    code;

  error.statusCode =
    statusCode;

  return error;
};

/*
|--------------------------------------------------------------------------
| File Filter
|--------------------------------------------------------------------------
*/

const csvFileFilter = (
  req,
  file,
  callback
) => {
  const originalName =
    String(
      file.originalname ||
      ""
    ).trim();

  const extension =
    path
      .extname(
        originalName
      )
      .toLowerCase();

  const mimeType =
    String(
      file.mimetype ||
      ""
    )
      .trim()
      .toLowerCase();

  const hasValidExtension =
    ALLOWED_CSV_EXTENSIONS.has(
      extension
    );

  const hasValidMimeType =
    ALLOWED_CSV_MIME_TYPES.has(
      mimeType
    );

  /*
   * Browsers and operating systems sometimes send CSV files
   * as text/plain or application/octet-stream. Therefore,
   * either a valid .csv extension or an accepted MIME type
   * is sufficient.
   */
  if (
    hasValidExtension ||
    hasValidMimeType
  ) {
    return callback(
      null,
      true
    );
  }

  return callback(
    createUploadError(
      "Only CSV files are supported.",
      "INVALID_PRODUCT_IMPORT_FILE_TYPE",
      400
    )
  );
};

/*
|--------------------------------------------------------------------------
| Multer Configuration
|--------------------------------------------------------------------------
*/

const productImportUpload =
  multer({
    storage:
      multer.memoryStorage(),

    fileFilter:
      csvFileFilter,

    limits: {
      fileSize:
        MAX_CSV_FILE_SIZE,

      files:
        MAX_CSV_FILES,

      fields:
        20,

      fieldNameSize:
        200,

      fieldSize:
        1024 * 1024,
    },
  });

/*
|--------------------------------------------------------------------------
| Single CSV Middleware
|--------------------------------------------------------------------------
*/

const uploadProductImportCsv =
  productImportUpload.single(
    "file"
  );

/*
|--------------------------------------------------------------------------
| Multer Error Handler
|--------------------------------------------------------------------------
*/

const handleProductImportUpload =
  (
    req,
    res,
    next
  ) => {
    uploadProductImportCsv(
      req,
      res,
      (error) => {
        if (!error) {
          return next();
        }

        if (
          error instanceof
          multer.MulterError
        ) {
          switch (
            error.code
          ) {
            case "LIMIT_FILE_SIZE":
              return res
                .status(413)
                .json({
                  success:
                    false,

                  message:
                    `CSV file exceeds the maximum allowed size of ${Math.round(
                      MAX_CSV_FILE_SIZE /
                      1024 /
                      1024
                    )} MB.`,

                  code:
                    "PRODUCT_IMPORT_FILE_TOO_LARGE",
                });

            case "LIMIT_FILE_COUNT":
              return res
                .status(400)
                .json({
                  success:
                    false,

                  message:
                    "Only one CSV file may be uploaded.",

                  code:
                    "PRODUCT_IMPORT_TOO_MANY_FILES",
                });

            case "LIMIT_UNEXPECTED_FILE":
              return res
                .status(400)
                .json({
                  success:
                    false,

                  message:
                    'The CSV file must be uploaded using the field name "file".',

                  code:
                    "PRODUCT_IMPORT_UNEXPECTED_FILE_FIELD",
                });

            case "LIMIT_FIELD_COUNT":
              return res
                .status(400)
                .json({
                  success:
                    false,

                  message:
                    "Too many form fields were submitted.",

                  code:
                    "PRODUCT_IMPORT_TOO_MANY_FIELDS",
                });

            case "LIMIT_FIELD_VALUE":
              return res
                .status(400)
                .json({
                  success:
                    false,

                  message:
                    "A submitted form field is too large.",

                  code:
                    "PRODUCT_IMPORT_FIELD_TOO_LARGE",
                });

            default:
              return res
                .status(400)
                .json({
                  success:
                    false,

                  message:
                    error.message ||
                    "CSV upload failed.",

                  code:
                    error.code ||
                    "PRODUCT_IMPORT_UPLOAD_ERROR",
                });
          }
        }

        return res
          .status(
            error.statusCode ||
            400
          )
          .json({
            success:
              false,

            message:
              error.message ||
              "CSV upload failed.",

            code:
              error.code ||
              "PRODUCT_IMPORT_UPLOAD_ERROR",
          });
      }
    );
  };

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  productImportUpload,

  uploadProductImportCsv,

  handleProductImportUpload,

  csvFileFilter,

  createUploadError,

  MAX_CSV_FILE_SIZE,

  MAX_CSV_FILES,

  ALLOWED_CSV_MIME_TYPES,

  ALLOWED_CSV_EXTENSIONS,
};