const { createPublicOrder } = require("../services/publicOrderService");

const placePublicOrder = async (req, res) => {
  try {
    const authenticatedCustomerId = req.customer?.id || null;

    const order = await createPublicOrder({
      payload: req.body,
      authenticatedCustomerId,
    });

    return res.status(201).json({
      success: true,
      data: { order },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error("Public order placement failed:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      error: {
        code: error.code || "ORDER_PLACEMENT_FAILED",
        message: error.message || "Unable to place order.",
        details: error.details || [],
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method,
      },
    });
  }
};

module.exports = {
  placePublicOrder,
};
