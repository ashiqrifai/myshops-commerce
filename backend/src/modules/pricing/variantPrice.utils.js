const AppError = require(
    "../../utils/AppError"
  );
  
  const normalizeNullable = (
    value
  ) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return null;
    }
  
    const normalized =
      String(value).trim();
  
    return normalized.length
      ? normalized
      : null;
  };
  
  const normalizeDecimal = (
    value,
    {
      fieldName = "Value",
      allowNull = true,
      minimum = null,
      maximum = null,
      scale = 4,
    } = {}
  ) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      if (allowNull) {
        return null;
      }
  
      throw new AppError(
        `${fieldName} is required.`,
        400,
        "VARIANT_PRICE_VALUE_REQUIRED"
      );
    }
  
    const numericValue =
      Number(value);
  
    if (
      !Number.isFinite(
        numericValue
      )
    ) {
      throw new AppError(
        `${fieldName} must be a valid number.`,
        400,
        "VARIANT_PRICE_VALUE_INVALID"
      );
    }
  
    if (
      minimum !== null &&
      numericValue < minimum
    ) {
      throw new AppError(
        `${fieldName} must be greater than or equal to ${minimum}.`,
        400,
        "VARIANT_PRICE_VALUE_BELOW_MINIMUM"
      );
    }
  
    if (
      maximum !== null &&
      numericValue > maximum
    ) {
      throw new AppError(
        `${fieldName} must be less than or equal to ${maximum}.`,
        400,
        "VARIANT_PRICE_VALUE_ABOVE_MAXIMUM"
      );
    }
  
    const multiplier =
      10 ** scale;
  
    return (
      Math.round(
        (
          numericValue +
          Number.EPSILON
        ) *
          multiplier
      ) / multiplier
    );
  };
  
  const normalizeMoney = (
    value,
    {
      fieldName = "Price",
      allowNull = true,
    } = {}
  ) => {
    return normalizeDecimal(
      value,
      {
        fieldName,
        allowNull,
        minimum: 0,
        scale: 4,
      }
    );
  };
  
  const normalizeQuantity = (
    value,
    {
      fieldName = "Quantity",
      allowNull = true,
      minimum = 1,
    } = {}
  ) => {
    return normalizeDecimal(
      value,
      {
        fieldName,
        allowNull,
        minimum,
        scale: 4,
      }
    );
  };
  
  const normalizePriority = (
    value,
    fallback = 100
  ) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return fallback;
    }
  
    const numericValue =
      Number(value);
  
    if (
      !Number.isInteger(
        numericValue
      ) ||
      numericValue < 0 ||
      numericValue > 999999
    ) {
      throw new AppError(
        "Priority must be an integer between 0 and 999999.",
        400,
        "VARIANT_PRICE_PRIORITY_INVALID"
      );
    }
  
    return numericValue;
  };
  
  const normalizeDate = (
    value,
    {
      fieldName = "Date",
      allowNull = true,
    } = {}
  ) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      if (allowNull) {
        return null;
      }
  
      throw new AppError(
        `${fieldName} is required.`,
        400,
        "VARIANT_PRICE_DATE_REQUIRED"
      );
    }
  
    const parsedDate =
      value instanceof Date
        ? value
        : new Date(value);
  
    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      throw new AppError(
        `${fieldName} must be a valid date.`,
        400,
        "VARIANT_PRICE_DATE_INVALID"
      );
    }
  
    return parsedDate;
  };
  
  const validateDateRange = ({
    validFrom,
    validUntil,
  }) => {
    if (
      !validFrom ||
      !validUntil
    ) {
      return;
    }
  
    const fromTime =
      new Date(
        validFrom
      ).getTime();
  
    const untilTime =
      new Date(
        validUntil
      ).getTime();
  
    if (
      untilTime <
      fromTime
    ) {
      throw new AppError(
        "Valid until must be later than or equal to valid from.",
        400,
        "VARIANT_PRICE_DATE_RANGE_INVALID"
      );
    }
  };
  
  const validateQuantityRange = ({
    minimumQuantity,
    maximumQuantity,
  }) => {
    if (
      minimumQuantity ===
        undefined ||
      minimumQuantity === null
    ) {
      throw new AppError(
        "Minimum quantity is required.",
        400,
        "VARIANT_PRICE_MINIMUM_QUANTITY_REQUIRED"
      );
    }
  
    if (
      maximumQuantity ===
        undefined ||
      maximumQuantity === null
    ) {
      return;
    }
  
    if (
      Number(maximumQuantity) <
      Number(minimumQuantity)
    ) {
      throw new AppError(
        "Maximum quantity must be greater than or equal to minimum quantity.",
        400,
        "VARIANT_PRICE_QUANTITY_RANGE_INVALID"
      );
    }
  };
  
  const validatePriceRelationships =
    ({
      regularPrice,
      sellingPrice,
      compareAtPrice,
      costPrice,
    }) => {
      if (
        regularPrice ===
          undefined ||
        regularPrice === null
      ) {
        throw new AppError(
          "Regular price is required.",
          400,
          "VARIANT_PRICE_REGULAR_PRICE_REQUIRED"
        );
      }
  
      if (
        sellingPrice ===
          undefined ||
        sellingPrice === null
      ) {
        throw new AppError(
          "Selling price is required.",
          400,
          "VARIANT_PRICE_SELLING_PRICE_REQUIRED"
        );
      }
  
      if (
        compareAtPrice !==
          undefined &&
        compareAtPrice !== null &&
        Number(sellingPrice) >
          Number(compareAtPrice)
      ) {
        throw new AppError(
          "Selling price cannot exceed compare-at price.",
          400,
          "VARIANT_PRICE_COMPARE_AT_INVALID"
        );
      }
  
      if (
        costPrice !==
          undefined &&
        costPrice !== null &&
        Number(costPrice) < 0
      ) {
        throw new AppError(
          "Cost price cannot be negative.",
          400,
          "VARIANT_PRICE_COST_INVALID"
        );
      }
    };
  
  const quantityRangesOverlap = ({
    firstMinimum,
    firstMaximum,
    secondMinimum,
    secondMaximum,
  }) => {
    const firstMax =
      firstMaximum ===
        undefined ||
      firstMaximum === null
        ? Number.POSITIVE_INFINITY
        : Number(
            firstMaximum
          );
  
    const secondMax =
      secondMaximum ===
        undefined ||
      secondMaximum === null
        ? Number.POSITIVE_INFINITY
        : Number(
            secondMaximum
          );
  
    return (
      Number(firstMinimum) <=
        secondMax &&
      Number(secondMinimum) <=
        firstMax
    );
  };
  
  const dateRangesOverlap = ({
    firstFrom,
    firstUntil,
    secondFrom,
    secondUntil,
  }) => {
    const firstStart =
      firstFrom
        ? new Date(
            firstFrom
          ).getTime()
        : Number.NEGATIVE_INFINITY;
  
    const firstEnd =
      firstUntil
        ? new Date(
            firstUntil
          ).getTime()
        : Number.POSITIVE_INFINITY;
  
    const secondStart =
      secondFrom
        ? new Date(
            secondFrom
          ).getTime()
        : Number.NEGATIVE_INFINITY;
  
    const secondEnd =
      secondUntil
        ? new Date(
            secondUntil
          ).getTime()
        : Number.POSITIVE_INFINITY;
  
    return (
      firstStart <=
        secondEnd &&
      secondStart <=
        firstEnd
    );
  };
  
  const calculateDiscount = ({
    regularPrice,
    sellingPrice,
  }) => {
    const regular =
      Number(
        regularPrice || 0
      );
  
    const selling =
      Number(
        sellingPrice || 0
      );
  
    const discountAmount =
      Math.max(
        0,
        regular - selling
      );
  
    const discountPercent =
      regular > 0
        ? Number(
            (
              (
                discountAmount /
                regular
              ) *
              100
            ).toFixed(2)
          )
        : 0;
  
    return {
      discountAmount:
        Number(
          discountAmount.toFixed(
            4
          )
        ),
  
      discountPercent,
    };
  };
  
  const buildVariantPricePayload =
    ({
      payload,
      existingPrice = null,
    }) => {
      const regularPrice =
        Object.prototype
          .hasOwnProperty.call(
            payload,
            "regularPrice"
          )
          ? normalizeMoney(
              payload.regularPrice,
              {
                fieldName:
                  "Regular price",
                allowNull:
                  false,
              }
            )
          : existingPrice
            ? Number(
                existingPrice
                  .regularPrice
              )
            : null;
  
      const sellingPrice =
        Object.prototype
          .hasOwnProperty.call(
            payload,
            "sellingPrice"
          )
          ? normalizeMoney(
              payload.sellingPrice,
              {
                fieldName:
                  "Selling price",
                allowNull:
                  false,
              }
            )
          : existingPrice
            ? Number(
                existingPrice
                  .sellingPrice
              )
            : null;
  
      const compareAtPrice =
        Object.prototype
          .hasOwnProperty.call(
            payload,
            "compareAtPrice"
          )
          ? normalizeMoney(
              payload.compareAtPrice,
              {
                fieldName:
                  "Compare-at price",
                allowNull:
                  true,
              }
            )
          : existingPrice
            ? existingPrice
                .compareAtPrice ===
              null
              ? null
              : Number(
                  existingPrice
                    .compareAtPrice
                )
            : null;
  
      const costPrice =
        Object.prototype
          .hasOwnProperty.call(
            payload,
            "costPrice"
          )
          ? normalizeMoney(
              payload.costPrice,
              {
                fieldName:
                  "Cost price",
                allowNull:
                  true,
              }
            )
          : existingPrice
            ? existingPrice
                .costPrice ===
              null
              ? null
              : Number(
                  existingPrice
                    .costPrice
                )
            : null;
  
      const minimumQuantity =
        Object.prototype
          .hasOwnProperty.call(
            payload,
            "minimumQuantity"
          )
          ? normalizeQuantity(
              payload.minimumQuantity,
              {
                fieldName:
                  "Minimum quantity",
                allowNull:
                  false,
                minimum: 1,
              }
            )
          : existingPrice
            ? Number(
                existingPrice
                  .minimumQuantity
              )
            : 1;
  
      const maximumQuantity =
        Object.prototype
          .hasOwnProperty.call(
            payload,
            "maximumQuantity"
          )
          ? normalizeQuantity(
              payload.maximumQuantity,
              {
                fieldName:
                  "Maximum quantity",
                allowNull:
                  true,
                minimum: 1,
              }
            )
          : existingPrice
            ? existingPrice
                .maximumQuantity ===
              null
              ? null
              : Number(
                  existingPrice
                    .maximumQuantity
                )
            : null;
  
      const validFrom =
        Object.prototype
          .hasOwnProperty.call(
            payload,
            "validFrom"
          )
          ? normalizeDate(
              payload.validFrom,
              {
                fieldName:
                  "Valid from",
                allowNull:
                  true,
              }
            )
          : existingPrice
            ? existingPrice
                .validFrom
            : null;
  
      const validUntil =
        Object.prototype
          .hasOwnProperty.call(
            payload,
            "validUntil"
          )
          ? normalizeDate(
              payload.validUntil,
              {
                fieldName:
                  "Valid until",
                allowNull:
                  true,
              }
            )
          : existingPrice
            ? existingPrice
                .validUntil
            : null;
  
      const priority =
        Object.prototype
          .hasOwnProperty.call(
            payload,
            "priority"
          )
          ? normalizePriority(
              payload.priority
            )
          : existingPrice
            ? existingPrice
                .priority
            : 100;
  
      const isActive =
        Object.prototype
          .hasOwnProperty.call(
            payload,
            "isActive"
          )
          ? payload.isActive ===
            true
          : existingPrice
            ? existingPrice
                .isActive
            : true;
  
      validatePriceRelationships({
        regularPrice,
        sellingPrice,
        compareAtPrice,
        costPrice,
      });
  
      validateQuantityRange({
        minimumQuantity,
        maximumQuantity,
      });
  
      validateDateRange({
        validFrom,
        validUntil,
      });
  
      return {
        regularPrice,
        sellingPrice,
        compareAtPrice,
        costPrice,
        minimumQuantity,
        maximumQuantity,
        validFrom,
        validUntil,
        priority,
        isActive,
      };
    };
  
  module.exports = {
    normalizeNullable,
    normalizeDecimal,
    normalizeMoney,
    normalizeQuantity,
    normalizePriority,
    normalizeDate,
    validateDateRange,
    validateQuantityRange,
    validatePriceRelationships,
    quantityRangesOverlap,
    dateRangesOverlap,
    calculateDiscount,
    buildVariantPricePayload,
  };