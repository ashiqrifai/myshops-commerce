const db =
  require(
    "../models"
  );

const AppError =
  require(
    "../utils/AppError"
  );

const {
  hashToken,
} = require(
  "../modules/kiosk-devices/kioskDevice.utils"
);


module.exports =
  async (
    req,
    _res,
    next
  ) => {

    try {

      const authorization =
        String(
          req.headers.authorization ||
          ""
        );

      const token =
        authorization.startsWith(
          "Bearer "
        )
          ? authorization
              .slice(
                7
              )
              .trim()
          : "";


      if (
        !token
      ) {

        throw new AppError(
          "Kiosk device token is required.",
          401,
          "KIOSK_DEVICE_AUTHENTICATION_REQUIRED"
        );
      }


      const device =
        await db.KioskDevice.findOne({
          where: {
            deviceTokenHash:
              hashToken(
                token
              ),

            status:
              "ACTIVE",

            isActive:
              true,
          },

          include: [
            {
              model:
                db.KioskProfile,

              as:
                "kioskProfile",

              required:
                true,

              where: {
                isActive:
                  true,
              },
            },
          ],
        });


      if (
        !device
      ) {

        throw new AppError(
          "Kiosk device token is invalid or the device is disabled.",
          401,
          "INVALID_KIOSK_DEVICE_TOKEN"
        );
      }


      const locationId =
        device
          .kioskProfile
          ?.inventoryLocationId;


      if (
        !locationId
      ) {

        throw new AppError(
          "This kiosk is not assigned to an inventory location.",
          409,
          "KIOSK_LOCATION_NOT_CONFIGURED"
        );
      }


      const location =
        await db.InventoryLocation.findOne({
          where: {
            id:
              locationId,

            companyId:
              device.companyId,

            isActive:
              true,
          },
        });


      if (
        !location
      ) {

        throw new AppError(
          "The inventory location assigned to this kiosk is unavailable.",
          409,
          "KIOSK_LOCATION_UNAVAILABLE"
        );
      }


      req.kioskDevice =
        device;

      req.kioskProfile =
        device.kioskProfile;

      req.kioskLocation =
        location;


      next();

    } catch (
      error
    ) {

      next(
        error
      );
    }
  };
