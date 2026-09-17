const crypto =
  require(
    "crypto"
  );

const {
  Op,
} =
  require(
    "sequelize"
  );

const db =
  require(
    "../models"
  );

const {
  sendEmail,
} =
  require(
    "./email.service"
  );

const OTP_TTL_MINUTES =
  Number(
    process.env
      .ORDER_TRACKING_OTP_TTL_MINUTES ||
    10
  );

const OTP_RESEND_SECONDS =
  Number(
    process.env
      .ORDER_TRACKING_OTP_RESEND_SECONDS ||
    60
  );

const ACCESS_TOKEN_TTL_MINUTES =
  Number(
    process.env
      .ORDER_TRACKING_TOKEN_TTL_MINUTES ||
    30
  );

const MAX_ATTEMPTS =
  Number(
    process.env
      .ORDER_TRACKING_OTP_MAX_ATTEMPTS ||
    5
  );

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

const normalizeOrderNumber =
  (
    value
  ) =>
    String(
      value ||
      ""
    )
      .trim()
      .toUpperCase();

const safeEqual =
  (
    a,
    b
  ) => {
    const left =
      Buffer.from(
        String(
          a ||
          ""
        )
      );

    const right =
      Buffer.from(
        String(
          b ||
          ""
        )
      );

    if (
      left.length !==
      right.length
    ) {
      return false;
    }

    return crypto
      .timingSafeEqual(
        left,
        right
      );
  };

const getSecret =
  () =>
    String(
      process.env
        .ORDER_TRACKING_OTP_SECRET ||
      process.env
        .JWT_SECRET ||
      ""
    ).trim();

const hashValue =
  (
    value
  ) => {
    const secret =
      getSecret();

    if (!secret) {
      throw new Error(
        "ORDER_TRACKING_OTP_SECRET is not configured."
      );
    }

    return crypto
      .createHmac(
        "sha256",
        secret
      )
      .update(
        String(
          value
        )
      )
      .digest(
        "hex"
      );
  };

const createOtp =
  () =>
    String(
      crypto
        .randomInt(
          0,
          1000000
        )
    )
      .padStart(
        6,
        "0"
      );

const createAccessToken =
  () =>
    crypto
      .randomBytes(
        32
      )
      .toString(
        "hex"
      );

const escapeHtml =
  (
    value
  ) =>
    String(
      value ??
      ""
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );

const resolveCompany =
  async ({
    companyId =
      null,
    companyCode =
      null,
  }) => {
    if (
      companyId
    ) {
      const company =
        await db.Company.findByPk(
          companyId
        );

      if (
        company
      ) {
        return company;
      }
    }

    const code =
      String(
        companyCode ||
        ""
      )
        .trim()
        .toUpperCase();

    if (
      code &&
      db.Company
        ?.rawAttributes
        ?.code
    ) {
      const company =
        await db.Company.findOne({
          where: {
            code,
          },
        });

      if (
        company
      ) {
        return company;
      }
    }

    /*
     * Safe fallback for a single-company deployment.
     */
    const companies =
      await db.Company.findAll({
        limit:
          2,
      });

    if (
      companies.length ===
      1
    ) {
      return companies[0];
    }

    return null;
  };

const sendTrackingOtpEmail =
  async ({
    to,
    firstName,
    orderNumber,
    otp,
  }) => {
    const safeName =
      escapeHtml(
        firstName ||
        "Customer"
      );

    const safeOrder =
      escapeHtml(
        orderNumber
      );

    const safeOtp =
      escapeHtml(
        otp
      );

    const html =
      `<!doctype html>
      <html>
      <body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#111827;">
        <div style="max-width:620px;margin:0 auto;padding:32px 16px;">
          <div style="background:#ffffff;border-radius:14px;padding:28px;border:1px solid #e5e7eb;">
            <div style="font-size:26px;font-weight:800;">MyShops</div>

            <h1 style="margin:24px 0 10px;font-size:24px;">
              Verify your order
            </h1>

            <p style="font-size:15px;line-height:1.7;color:#4b5563;">
              Hi ${safeName},<br/>
              Use the verification code below to securely track order <strong>${safeOrder}</strong>.
            </p>

            <div style="margin:26px 0;text-align:center;">
              <div style="display:inline-block;letter-spacing:10px;font-size:32px;font-weight:800;background:#f3f4f6;padding:16px 20px;border-radius:12px;">
                ${safeOtp}
              </div>
            </div>

            <p style="font-size:13px;line-height:1.6;color:#6b7280;">
              This code expires in ${OTP_TTL_MINUTES} minutes. Do not share it with anyone.
            </p>

            <p style="font-size:12px;line-height:1.6;color:#9ca3af;margin-top:28px;">
              If you did not request this code, you can ignore this email.
            </p>
          </div>
        </div>
      </body>
      </html>`;

    const text = [
      "MyShops order verification",
      "",
      `Order: ${orderNumber}`,
      `Verification code: ${otp}`,
      "",
      `This code expires in ${OTP_TTL_MINUTES} minutes.`,
    ].join(
      "\n"
    );

    await sendEmail({
      to,
      subject:
        `Your MyShops order tracking code - ${orderNumber}`,
      html,
      text,
    });
  };

const requestOtp =
  async ({
    companyId =
      null,
    companyCode =
      null,
    orderNumber,
    email,
    requestIp =
      null,
    userAgent =
      null,
  }) => {
    const normalizedOrderNumber =
      normalizeOrderNumber(
        orderNumber
      );

    const normalizedEmail =
      normalizeEmail(
        email
      );

    /*
     * Always return a generic response to avoid order enumeration.
     */
    const genericResult = {
      accepted:
        true,

      message:
        "If the order number and email match, a verification code will be sent.",
    };

    if (
      !normalizedOrderNumber ||
      !normalizedEmail
    ) {
      return genericResult;
    }

    const company =
      await resolveCompany({
        companyId,
        companyCode,
      });

    if (
      !company
    ) {
      return genericResult;
    }

    const order =
      await db.Order.findOne({
        where: {
          companyId:
            company.id,

          orderNumber:
            normalizedOrderNumber,

          customerEmail:
            normalizedEmail,
        },
      });

    if (
      !order
    ) {
      return genericResult;
    }

    const latest =
      await db.OrderTrackingOtp.findOne({
        where: {
          companyId:
            company.id,

          orderId:
            order.id,

          email:
            normalizedEmail,

          revokedAt:
            null,
        },

        order: [
          [
            "createdAt",
            "DESC",
          ],
        ],
      });

    const now =
      new Date();

    if (
      latest &&
      latest.resendAvailableAt &&
      new Date(
        latest.resendAvailableAt
      ) >
      now
    ) {
      return genericResult;
    }

    await db.OrderTrackingOtp.update(
      {
        revokedAt:
          now,
      },
      {
        where: {
          companyId:
            company.id,

          orderId:
            order.id,

          email:
            normalizedEmail,

          revokedAt:
            null,
        },
      }
    );

    const otp =
      createOtp();

    await db.OrderTrackingOtp.create({
      companyId:
        company.id,

      orderId:
        order.id,

      orderNumber:
        order.orderNumber,

      email:
        normalizedEmail,

      otpHash:
        hashValue(
          otp
        ),

      otpExpiresAt:
        new Date(
          Date.now() +
          OTP_TTL_MINUTES *
          60 *
          1000
        ),

      attempts:
        0,

      maxAttempts:
        MAX_ATTEMPTS,

      resendAvailableAt:
        new Date(
          Date.now() +
          OTP_RESEND_SECONDS *
          1000
        ),

      requestIp:
        requestIp
          ? String(
              requestIp
            ).slice(
              0,
              100
            )
          : null,

      userAgent:
        userAgent
          ? String(
              userAgent
            ).slice(
              0,
              1000
            )
          : null,
    });

    try {
      await sendTrackingOtpEmail({
        to:
          normalizedEmail,

        firstName:
          order.customerFirstName,

        orderNumber:
          order.orderNumber,

        otp,
      });
    } catch (
      error
    ) {
      console.error(
        "[Order Tracking] OTP email failed:",
        {
          orderId:
            order.id,

          orderNumber:
            order.orderNumber,

          error:
            error
              ?.message ||
            String(
              error
            ),
        }
      );

      /*
       * Do not reveal mail-delivery state to the browser.
       */
    }

    return genericResult;
  };

const verifyOtp =
  async ({
    companyId =
      null,
    companyCode =
      null,
    orderNumber,
    email,
    otp,
  }) => {
    const normalizedOrderNumber =
      normalizeOrderNumber(
        orderNumber
      );

    const normalizedEmail =
      normalizeEmail(
        email
      );

    const normalizedOtp =
      String(
        otp ||
        ""
      )
        .trim();

    if (
      !normalizedOrderNumber ||
      !normalizedEmail ||
      !/^\d{6}$/.test(
        normalizedOtp
      )
    ) {
      const error =
        new Error(
          "Invalid or expired verification code."
        );

      error.statusCode =
        400;

      error.code =
        "INVALID_TRACKING_OTP";

      throw error;
    }

    const company =
      await resolveCompany({
        companyId,
        companyCode,
      });

    if (
      !company
    ) {
      const error =
        new Error(
          "Invalid or expired verification code."
        );

      error.statusCode =
        400;

      error.code =
        "INVALID_TRACKING_OTP";

      throw error;
    }

    const row =
      await db.OrderTrackingOtp.findOne({
        where: {
          companyId:
            company.id,

          orderNumber:
            normalizedOrderNumber,

          email:
            normalizedEmail,

          revokedAt:
            null,
        },

        order: [
          [
            "createdAt",
            "DESC",
          ],
        ],
      });

    if (
      !row ||
      new Date(
        row.otpExpiresAt
      ) <=
      new Date() ||
      Number(
        row.attempts ||
        0
      ) >=
      Number(
        row.maxAttempts ||
        MAX_ATTEMPTS
      )
    ) {
      const error =
        new Error(
          "Invalid or expired verification code."
        );

      error.statusCode =
        400;

      error.code =
        "INVALID_TRACKING_OTP";

      throw error;
    }

    const valid =
      safeEqual(
        row.otpHash,
        hashValue(
          normalizedOtp
        )
      );

    if (
      !valid
    ) {
      const nextAttempts =
        Number(
          row.attempts ||
          0
        ) +
        1;

      await row.update({
        attempts:
          nextAttempts,

        revokedAt:
          nextAttempts >=
          Number(
            row.maxAttempts ||
            MAX_ATTEMPTS
          )
            ? new Date()
            : null,
      });

      const error =
        new Error(
          "Invalid or expired verification code."
        );

      error.statusCode =
        400;

      error.code =
        "INVALID_TRACKING_OTP";

      throw error;
    }

    const accessToken =
      createAccessToken();

    await row.update({
      verifiedAt:
        new Date(),

      accessTokenHash:
        hashValue(
          accessToken
        ),

      accessTokenExpiresAt:
        new Date(
          Date.now() +
          ACCESS_TOKEN_TTL_MINUTES *
          60 *
          1000
        ),
    });

    return {
      verified:
        true,

      accessToken,

      expiresInMinutes:
        ACCESS_TOKEN_TTL_MINUTES,

      orderNumber:
        row.orderNumber,
    };
  };

const buildTimeline =
  ({
    order,
    shipment,
  }) => {
    const method =
      String(
        shipment
          ?.deliveryMethod ||
        "STANDARD"
      )
        .trim()
        .toUpperCase();

    const status =
      String(
        shipment
          ?.status ||
        "PENDING"
      )
        .trim()
        .toUpperCase();

    const rank = {
      PENDING:
        0,

      ALLOCATED:
        1,

      READY:
        2,

      DISPATCHED:
        3,

      DELIVERED:
        4,

      CANCELLED:
        -1,
    };

    const currentRank =
      rank[
        status
      ] ??
      0;

    if (
      status ===
      "CANCELLED"
    ) {
      return [
        {
          code:
            "CONFIRMED",

          label:
            "Order confirmed",

          completed:
            true,
        },

        {
          code:
            "CANCELLED",

          label:
            "Cancelled",

          completed:
            true,

          current:
            true,
        },
      ];
    }

    const steps =
      method ===
      "PICKUP"
        ? [
            {
              code:
                "CONFIRMED",

              label:
                "Order confirmed",

              minRank:
                0,
            },

            {
              code:
                "ALLOCATED",

              label:
                "Allocated to pickup store",

              minRank:
                1,
            },

            {
              code:
                "READY",

              label:
                "Ready for pickup",

              minRank:
                2,
            },

            {
              code:
                "DELIVERED",

              label:
                "Collected",

              minRank:
                4,
            },
          ]
        : [
            {
              code:
                "CONFIRMED",

              label:
                "Order confirmed",

              minRank:
                0,
            },

            {
              code:
                "ALLOCATED",

              label:
                "Allocated",

              minRank:
                1,
            },

            {
              code:
                "READY",

              label:
                "Ready for dispatch",

              minRank:
                2,
            },

            {
              code:
                "DISPATCHED",

              label:
                "Dispatched",

              minRank:
                3,
            },

            {
              code:
                "DELIVERED",

              label:
                "Delivered",

              minRank:
                4,
            },
          ];

    return steps.map(
      step => ({
        code:
          step.code,

        label:
          step.label,

        completed:
          currentRank >=
          step.minRank,

        current:
          status ===
          step.code,
      })
    );
  };

const getTrackingDetails =
  async ({
    companyId =
      null,
    companyCode =
      null,
    orderNumber,
    accessToken,
  }) => {
    const normalizedOrderNumber =
      normalizeOrderNumber(
        orderNumber
      );

    const company =
      await resolveCompany({
        companyId,
        companyCode,
      });

    if (
      !company ||
      !normalizedOrderNumber ||
      !accessToken
    ) {
      const error =
        new Error(
          "Tracking session is invalid or has expired."
        );

      error.statusCode =
        401;

      error.code =
        "TRACKING_SESSION_INVALID";

      throw error;
    }

    const tokenHash =
      hashValue(
        accessToken
      );

    const verification =
      await db.OrderTrackingOtp.findOne({
        where: {
          companyId:
            company.id,

          orderNumber:
            normalizedOrderNumber,

          accessTokenHash:
            tokenHash,

          revokedAt:
            null,

          accessTokenExpiresAt: {
            [Op.gt]:
              new Date(),
          },
        },

        order: [
          [
            "verifiedAt",
            "DESC",
          ],
        ],
      });

    if (
      !verification
    ) {
      const error =
        new Error(
          "Tracking session is invalid or has expired."
        );

      error.statusCode =
        401;

      error.code =
        "TRACKING_SESSION_INVALID";

      throw error;
    }

    const order =
      await db.Order.findOne({
        where: {
          id:
            verification.orderId,

          companyId:
            company.id,

          orderNumber:
            normalizedOrderNumber,

          customerEmail:
            verification.email,
        },
      });

    if (
      !order
    ) {
      const error =
        new Error(
          "Order was not found."
        );

      error.statusCode =
        404;

      error.code =
        "ORDER_NOT_FOUND";

      throw error;
    }

    const items =
      await db.OrderItem.findAll({
        where: {
          companyId:
            company.id,

          orderId:
            order.id,
        },

        order: [
          [
            "createdAt",
            "ASC",
          ],
        ],
      });

    const shipments =
      await db.OrderShipment.findAll({
        where: {
          companyId:
            company.id,

          orderId:
            order.id,
        },

        order: [
          [
            "createdAt",
            "ASC",
          ],
        ],
      });

    const shipmentIds =
      shipments.map(
        row =>
          row.id
      );

    const shipmentItems =
      shipmentIds.length
        ? await db.OrderShipmentItem.findAll({
            where: {
              companyId:
                company.id,

              orderShipmentId: {
                [Op.in]:
                  shipmentIds,
              },
            },
          })
        : [];

    const shipmentItemIds =
      shipmentItems.map(
        row =>
          row.id
      );

    const allocations =
      shipmentItemIds.length
        ? await db.OrderShipmentAllocation.findAll({
            where: {
              companyId:
                company.id,

              orderShipmentItemId: {
                [Op.in]:
                  shipmentItemIds,
              },
            },
          })
        : [];

    const locationIds =
      Array.from(
        new Set(
          allocations
            .map(
              row =>
                row.inventoryLocationId
            )
            .filter(
              Boolean
            )
        )
      );

    const locations =
      locationIds.length
        ? await db.InventoryLocation.findAll({
            where: {
              companyId:
                company.id,

              id: {
                [Op.in]:
                  locationIds,
              },
            },
          })
        : [];

    const shipmentById =
      new Map(
        shipments.map(
          row => [
            String(
              row.id
            ),
            row,
          ]
        )
      );

    const locationById =
      new Map(
        locations.map(
          row => [
            String(
              row.id
            ),
            row,
          ]
        )
      );

    const shipmentItemsByOrderItem =
      new Map();

    for (
      const row of
      shipmentItems
    ) {
      const key =
        String(
          row.orderItemId
        );

      if (
        !shipmentItemsByOrderItem.has(
          key
        )
      ) {
        shipmentItemsByOrderItem.set(
          key,
          []
        );
      }

      shipmentItemsByOrderItem
        .get(
          key
        )
        .push(
          row
        );
    }

    const allocationsByShipmentItem =
      new Map();

    for (
      const row of
      allocations
    ) {
      const key =
        String(
          row.orderShipmentItemId
        );

      if (
        !allocationsByShipmentItem.has(
          key
        )
      ) {
        allocationsByShipmentItem.set(
          key,
          []
        );
      }

      allocationsByShipmentItem
        .get(
          key
        )
        .push(
          row
        );
    }

    const trackedItems =
      items.map(
        item => {
          const related =
            shipmentItemsByOrderItem.get(
              String(
                item.id
              )
            ) ||
            [];

          const shipmentItem =
            related[0] ||
            null;

          const shipment =
            shipmentItem
              ? shipmentById.get(
                  String(
                    shipmentItem
                      .orderShipmentId
                  )
                ) ||
                null
              : null;

          const itemAllocations =
            shipmentItem
              ? allocationsByShipmentItem.get(
                  String(
                    shipmentItem.id
                  )
                ) ||
                []
              : [];

          const allocation =
            itemAllocations.find(
              row =>
                ![
                  "RELEASED",
                  "CANCELLED",
                ].includes(
                  String(
                    row.status ||
                    ""
                  )
                    .trim()
                    .toUpperCase()
                )
            ) ||
            itemAllocations[0] ||
            null;

          const location =
            allocation
              ?.inventoryLocationId
              ? locationById.get(
                  String(
                    allocation
                      .inventoryLocationId
                  )
                ) ||
                null
              : null;

          const method =
            String(
              shipment
                ?.deliveryMethod ||
              item
                .selectedDeliveryMethod ||
              "STANDARD"
            )
              .trim()
              .toUpperCase();

          let fulfillmentLabel =
            shipment
              ?.deliveryLabel ||
            null;

          if (
            !fulfillmentLabel
          ) {
            if (
              method ===
              "PICKUP"
            ) {
              fulfillmentLabel =
                location
                  ?.name
                  ? `Store Pickup - ${location.name}`
                  : "Store Pickup";
            } else if (
              method ===
              "EXPRESS"
            ) {
              fulfillmentLabel =
                Number(
                  shipment
                    ?.deliveryHours
                ) >
                0
                  ? `Express ${Number(
                      shipment.deliveryHours
                    )}-Hour Delivery`
                  : "Express Delivery";
            } else if (
              method ===
              "DIRECT_DELIVERY"
            ) {
              fulfillmentLabel =
                "Direct Delivery";
            } else {
              fulfillmentLabel =
                "Standard Delivery";
            }
          }

          return {
            id:
              item.id,

            sku:
              item.sku,

            productName:
              item.productName,

            variantName:
              item.variantName,

            quantity:
              Number(
                item.quantity ||
                0
              ),

            unitPrice:
              Number(
                item.unitPrice ||
                0
              ),

            lineTotal:
              Number(
                item.lineTotal ||
                0
              ),

            fulfillmentMethod:
              method,

            fulfillmentLabel,

            fulfillmentLocation:
              location
                ?.name ||
              null,

            shipmentNumber:
              shipment
                ?.shipmentNumber ||
              null,

            shipmentStatus:
              shipment
                ?.status ||
              "PENDING",

            timeline:
              buildTimeline({
                order,
                shipment,
              }),
          };
        }
      );

    return {
      id:
        order.id,

      orderNumber:
        order.orderNumber,

      placedAt:
        order.placedAt,

      currencyCode:
        order.currencyCode,

      paymentMethod:
        order.paymentMethod,

      paymentStatus:
        order.paymentStatus,

      orderStatus:
        order.orderStatus,

      fulfillmentStatus:
        order.fulfillmentStatus,

      subtotal:
        Number(
          order.subtotal ||
          0
        ),

      discountAmount:
        Number(
          order.discountAmount ||
          0
        ),

      deliveryAmount:
        Number(
          order.deliveryAmount ||
          0
        ),

      taxAmount:
        Number(
          order.taxAmount ||
          0
        ),

      grandTotal:
        Number(
          order.grandTotal ||
          0
        ),

      items:
        trackedItems,
    };
  };

module.exports = {
  requestOtp,
  verifyOtp,
  getTrackingDetails,
};
