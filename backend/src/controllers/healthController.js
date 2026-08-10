const db = require("../models");

exports.getHealth = async (req, res, next) => {
  try {
    await db.sequelize.authenticate();

    res.status(200).json({
      success: true,
      data: {
        service: "MyShops Commerce API",
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};