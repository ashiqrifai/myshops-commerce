const express =
  require(
    "express"
  );

const multer =
  require(
    "multer"
  );

const controller =
  require(
    "./giftVoucherPromotion.controller"
  );

const authenticate =
  require(
    "../../middleware/authenticate"
  );

const authorize =
  require(
    "../../middleware/authorize"
  );

const validateRequest =
  require(
    "../../middleware/validateRequest"
  );

const {
  promotionIdValidation,
  listGiftVoucherPromotionsValidation,
  createGiftVoucherPromotionValidation,
  updateGiftVoucherPromotionValidation,
  changeGiftVoucherPromotionStatusValidation,
} =
  require(
    "./giftVoucherPromotion.validation"
  );

const router =
  express.Router();

const upload =
  multer({
    storage:
      multer.memoryStorage(),

    limits: {
      fileSize:
        10 *
        1024 *
        1024,
    },

    fileFilter:
      (
        _req,
        file,
        callback
      ) => {
        const name =
          String(
            file.originalname ||
            ""
          )
            .trim()
            .toLowerCase();

        if (
          !name.endsWith(
            ".csv"
          )
        ) {
          return callback(
            new Error(
              "Only CSV files are allowed."
            )
          );
        }

        return callback(
          null,
          true
        );
      },
  });

router.use(
  authenticate
);

/*
|--------------------------------------------------------------------------
| CSV Import
|--------------------------------------------------------------------------
|
| IMPORTANT: Keep these routes BEFORE "/:id".
|--------------------------------------------------------------------------
*/

router.get(
  "/import-template",
  authorize(
    "pricing.read"
  ),
  controller.downloadImportTemplate
);

router.post(
  "/import",
  authorize(
    "pricing.create"
  ),
  upload.single(
    "file"
  ),
  controller.importGiftVoucherPromotions
);

/*
|--------------------------------------------------------------------------
| Standard CRUD
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  authorize(
    "pricing.read"
  ),
  listGiftVoucherPromotionsValidation,
  validateRequest,
  controller.listGiftVoucherPromotions
);

router.post(
  "/",
  authorize(
    "pricing.create"
  ),
  createGiftVoucherPromotionValidation,
  validateRequest,
  controller.createGiftVoucherPromotion
);

router.get(
  "/:id",
  authorize(
    "pricing.read"
  ),
  promotionIdValidation,
  validateRequest,
  controller.getGiftVoucherPromotionById
);

router.put(
  "/:id",
  authorize(
    "pricing.update"
  ),
  updateGiftVoucherPromotionValidation,
  validateRequest,
  controller.updateGiftVoucherPromotion
);

router.patch(
  "/:id/status",
  authorize(
    "pricing.update"
  ),
  changeGiftVoucherPromotionStatusValidation,
  validateRequest,
  controller.changeGiftVoucherPromotionStatus
);

router.delete(
  "/:id",
  authorize(
    "pricing.delete"
  ),
  promotionIdValidation,
  validateRequest,
  controller.deleteGiftVoucherPromotion
);

module.exports =
  router;
