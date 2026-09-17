const express = require("express");
const controller = require("./coupon.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validateRequest = require("../../middleware/validateRequest");
const {
  couponIdValidation,
  listCouponsValidation,
  createCouponValidation,
  updateCouponValidation,
  changeCouponStatusValidation,
} = require("./coupon.validation");

const router = express.Router();
router.use(authenticate);

router.get("/", authorize("pricing.read"), listCouponsValidation, validateRequest, controller.listCoupons);
router.post("/", authorize("pricing.create"), createCouponValidation, validateRequest, controller.createCoupon);
router.get("/:id", authorize("pricing.read"), couponIdValidation, validateRequest, controller.getCouponById);
router.put("/:id", authorize("pricing.update"), updateCouponValidation, validateRequest, controller.updateCoupon);
router.patch("/:id/status", authorize("pricing.update"), changeCouponStatusValidation, validateRequest, controller.changeCouponStatus);
router.delete("/:id", authorize("pricing.delete"), couponIdValidation, validateRequest, controller.deleteCoupon);

module.exports = router;
