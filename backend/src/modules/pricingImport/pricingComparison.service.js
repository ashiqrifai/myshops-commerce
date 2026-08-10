/*
|--------------------------------------------------------------------------
| Pricing Comparison Service
|--------------------------------------------------------------------------
*/

const normalizeMoney = (
  value
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(number)
    ? Number(number.toFixed(4))
    : null;
};

const normalizeQuantity = (
  value,
  fallback = null
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  const number =
    Number(value);

  return Number.isFinite(number)
    ? Number(number.toFixed(4))
    : fallback;
};

const normalizeDateOnly = (
  value
) => {
  if (!value) {
    return null;
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date
    .toISOString()
    .slice(
      0,
      10
    );
};

const normalizeBoolean = (
  value,
  fallback = true
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  const normalized =
    String(value)
      .trim()
      .toUpperCase();

  if (
    [
      "ACTIVE",
      "TRUE",
      "YES",
      "Y",
      "1",
    ].includes(
      normalized
    )
  ) {
    return true;
  }

  if (
    [
      "INACTIVE",
      "FALSE",
      "NO",
      "N",
      "0",
    ].includes(
      normalized
    )
  ) {
    return false;
  }

  return fallback;
};

const buildScheduleKey = ({
  productVariantId,
  priceListId,
  minimumQuantity,
  validFrom,
  validUntil,
}) => {
  return [
    productVariantId,
    priceListId,
    normalizeQuantity(
      minimumQuantity,
      1
    ),
    normalizeDateOnly(
      validFrom
    ) ||
      "",
    normalizeDateOnly(
      validUntil
    ) ||
      "",
  ].join(
    "::"
  );
};

const serializeExistingPrice = (
  price
) => {
  if (!price) {
    return null;
  }

  return {
    id:
      price.id,

    productVariantId:
      price.productVariantId,

    priceListId:
      price.priceListId,

    regularPrice:
      normalizeMoney(
        price.regularPrice
      ),

    sellingPrice:
      normalizeMoney(
        price.sellingPrice
      ),

    compareAtPrice:
      normalizeMoney(
        price.compareAtPrice
      ),

    costPrice:
      normalizeMoney(
        price.costPrice
      ),

    minimumQuantity:
      normalizeQuantity(
        price.minimumQuantity,
        1
      ),

    maximumQuantity:
      normalizeQuantity(
        price.maximumQuantity,
        null
      ),

    validFrom:
      normalizeDateOnly(
        price.validFrom
      ),

    validUntil:
      normalizeDateOnly(
        price.validUntil
      ),

    priority:
      Number(
        price.priority ??
        100
      ),

    isActive:
      price.isActive ===
      true,
  };
};

const normalizeImportedPrice = (
  row
) => {
  return {
    regularPrice:
      normalizeMoney(
        row.regularPrice
      ),

    sellingPrice:
      normalizeMoney(
        row.sellingPrice
      ),

    compareAtPrice:
      normalizeMoney(
        row.compareAtPrice
      ),

    costPrice:
      normalizeMoney(
        row.costPrice
      ),

    minimumQuantity:
      normalizeQuantity(
        row.minimumQuantity,
        1
      ),

    maximumQuantity:
      normalizeQuantity(
        row.maximumQuantity,
        null
      ),

    validFrom:
      normalizeDateOnly(
        row.validFrom
      ),

    validUntil:
      normalizeDateOnly(
        row.validUntil
      ),

    priority:
      Number(
        row.priority ??
        100
      ),

    isActive:
      normalizeBoolean(
        row.status ??
        row.isActive,
        true
      ),
  };
};

const getChangedFields = ({
  existingPrice,
  importedPrice,
}) => {
  if (!existingPrice) {
    return [];
  }

  const comparableFields = [
    "regularPrice",
    "sellingPrice",
    "compareAtPrice",
    "costPrice",
    "maximumQuantity",
    "priority",
    "isActive",
  ];

  return comparableFields.filter(
    (
      field
    ) =>
      existingPrice[
        field
      ] !==
      importedPrice[
        field
      ]
  );
};

const classifyPriceChange = ({
  existingRecord,
  importedRow,
}) => {
  const existingPrice =
    serializeExistingPrice(
      existingRecord
    );

  const importedPrice =
    normalizeImportedPrice(
      importedRow
    );

  if (!existingPrice) {
    return {
      action:
        "CREATE",

      changedFields:
        [],

      existingPrice:
        null,

      importedPrice,
    };
  }

  const changedFields =
    getChangedFields({
      existingPrice,
      importedPrice,
    });

  if (
    changedFields.length ===
    0
  ) {
    return {
      action:
        "NO_CHANGE",

      changedFields,

      existingPrice,

      importedPrice,
    };
  }

  if (
    existingPrice.isActive ===
      true &&
    importedPrice.isActive ===
      false &&
    changedFields.length ===
      1
  ) {
    return {
      action:
        "DEACTIVATE",

      changedFields,

      existingPrice,

      importedPrice,
    };
  }

  return {
    action:
      "UPDATE",

    changedFields,

    existingPrice,

    importedPrice,
  };
};

module.exports = {
  buildScheduleKey,
  classifyPriceChange,
  normalizeDateOnly,
  normalizeImportedPrice,
  normalizeMoney,
  normalizeQuantity,
  serializeExistingPrice,
};
