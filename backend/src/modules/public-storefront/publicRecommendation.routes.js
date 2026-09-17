const express =
  require(
    "express"
  );

const controller =
  require(
    "./publicRecommendation.controller"
  );

const router =
  express.Router();

router.get(
  "/recommendations",
  controller.getRecommendations
);

router.post(
  "/recommendations/cart",
  controller.getCartRecommendations
);

module.exports =
  router;