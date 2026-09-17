const {
    Op,
  } = require(
    "sequelize"
  );
  
  const db =
    require(
      "../models"
    );
  
  const AppError =
    require(
      "../utils/AppError"
    );
  
  const roundMoney =
    (
      value
    ) =>
      Number(
        Number(
          value ||
          0
        ).toFixed(
          4
        )
      );
  
  const normalizeCode =
    (
      value
    ) =>
      String(
        value ||
          ""
      )
        .trim()
        .toUpperCase();
  
  const normalizeEmail =
    (
      value
    ) =>
      String(
        value ||
          ""
      )
        .trim()
        .toLowerCase();
  
  const calculateDiscount =
    ({
      coupon,
      merchandiseTotal,
      deliveryAmount,
    }) => {
      const baseAmount =
        roundMoney(
          merchandiseTotal
        );
  
      switch (
        coupon.discountType
      ) {
        case "PERCENTAGE": {
          let discount =
            roundMoney(
              baseAmount *
                (
                  Number(
                    coupon.discountValue
                  ) /
                  100
                )
            );
  
          if (
            coupon.maximumDiscountAmount !==
            null
          ) {
            discount =
              Math.min(
                discount,
  
                Number(
                  coupon.maximumDiscountAmount
                )
              );
          }
  
          return {
            merchandiseDiscount:
              Math.min(
                discount,
                baseAmount
              ),
  
            deliveryDiscount:
              0,
          };
        }
  
        case "FIXED":
          return {
            merchandiseDiscount:
              Math.min(
                Number(
                  coupon.discountValue
                ),
                baseAmount
              ),
  
            deliveryDiscount:
              0,
          };
  
        case "FREE_SHIPPING":
          return {
            merchandiseDiscount:
              0,
  
            deliveryDiscount:
              roundMoney(
                deliveryAmount
              ),
          };
  
        default:
          throw new AppError(
            "Coupon discount type is not supported.",
            400,
            "UNSUPPORTED_COUPON_TYPE"
          );
      }
    };
  
  exports.validateCoupon =
    async ({
      companyId,
      code,
      currencyCode =
        "AED",
      channelCode =
        "WEBSITE",
      merchandiseTotal,
      deliveryAmount,
      customerId =
        null,
      customerEmail =
        null,
      transaction =
        null,
    }) => {
      const normalizedCode =
        normalizeCode(
          code
        );
  
      if (
        !normalizedCode
      ) {
        throw new AppError(
          "Coupon code is required.",
          400,
          "COUPON_CODE_REQUIRED"
        );
      }
  
      const now =
        new Date();
  
      const coupon =
        await db.Coupon.findOne({
          where: {
            companyId,
  
            code:
              normalizedCode,
  
            isActive:
              true,
  
            currencyCode:
              String(
                currencyCode
              )
                .trim()
                .toUpperCase(),
  
            channelCode:
              String(
                channelCode
              )
                .trim()
                .toUpperCase(),
  
            [Op.and]: [
              {
                [Op.or]: [
                  {
                    validFrom:
                      null,
                  },
  
                  {
                    validFrom: {
                      [Op.lte]:
                        now,
                    },
                  },
                ],
              },
  
              {
                [Op.or]: [
                  {
                    validUntil:
                      null,
                  },
  
                  {
                    validUntil: {
                      [Op.gte]:
                        now,
                    },
                  },
                ],
              },
            ],
          },
  
          transaction,
        });
  
      if (
        !coupon
      ) {
        throw new AppError(
          "This coupon code is invalid or no longer available.",
          404,
          "COUPON_NOT_AVAILABLE"
        );
      }
  
      const merchandise =
        roundMoney(
          merchandiseTotal
        );
  
      if (
        merchandise <
        Number(
          coupon.minimumOrderAmount ||
          0
        )
      ) {
        throw new AppError(
          `A minimum order value of AED ${Number(
            coupon.minimumOrderAmount
          ).toFixed(
            2
          )} is required for this coupon.`,
          409,
          "COUPON_MINIMUM_NOT_MET"
        );
      }
  
      if (
        coupon.usageLimit !==
        null
      ) {
        const totalUsage =
          await db.CouponRedemption.count({
            where: {
              companyId,
              couponId:
                coupon.id,
            },
  
            transaction,
          });
  
        if (
          totalUsage >=
          Number(
            coupon.usageLimit
          )
        ) {
          throw new AppError(
            "This coupon has reached its usage limit.",
            409,
            "COUPON_USAGE_LIMIT_REACHED"
          );
        }
      }
  
      if (
        coupon.perCustomerLimit !==
        null
      ) {
        const identityWhere =
          customerId
            ? {
                customerId,
              }
            : {
                customerEmail:
                  normalizeEmail(
                    customerEmail
                  ),
              };
  
        const customerUsage =
          await db.CouponRedemption.count({
            where: {
              companyId,
  
              couponId:
                coupon.id,
  
              ...identityWhere,
            },
  
            transaction,
          });
  
        if (
          customerUsage >=
          Number(
            coupon.perCustomerLimit
          )
        ) {
          throw new AppError(
            "This coupon has already been used the maximum number of times for this customer.",
            409,
            "COUPON_CUSTOMER_LIMIT_REACHED"
          );
        }
      }
  
      if (
        coupon.firstOrderOnly
      ) {
        let previousOrders =
          0;
  
        if (
          customerId
        ) {
          previousOrders =
            await db.Order.count({
              where: {
                companyId,
                customerId,
  
                orderStatus: {
                  [Op.ne]:
                    "CANCELLED",
                },
              },
  
              transaction,
            });
        } else if (
          customerEmail
        ) {
          previousOrders =
            await db.Order.count({
              where: {
                companyId,
  
                customerEmail:
                  normalizeEmail(
                    customerEmail
                  ),
  
                orderStatus: {
                  [Op.ne]:
                    "CANCELLED",
                },
              },
  
              transaction,
            });
        }
  
        if (
          previousOrders >
          0
        ) {
          throw new AppError(
            "This coupon is available for first orders only.",
            409,
            "COUPON_FIRST_ORDER_ONLY"
          );
        }
      }
  
      const {
        merchandiseDiscount,
        deliveryDiscount,
      } =
        calculateDiscount({
          coupon,
  
          merchandiseTotal:
            merchandise,
  
          deliveryAmount,
        });
  
      const discountAmount =
        roundMoney(
          merchandiseDiscount +
            deliveryDiscount
        );
  
      return {
        coupon,
  
        result: {
          code:
            coupon.code,
  
          name:
            coupon.name,
  
          discountType:
            coupon.discountType,
  
          discountValue:
            Number(
              coupon.discountValue
            ),
  
          merchandiseDiscount:
            roundMoney(
              merchandiseDiscount
            ),
  
          deliveryDiscount:
            roundMoney(
              deliveryDiscount
            ),
  
          discountAmount,
  
          finalDeliveryAmount:
            Math.max(
              0,
  
              roundMoney(
                Number(
                  deliveryAmount ||
                  0
                ) -
                  deliveryDiscount
              )
            ),
        },
      };
    };