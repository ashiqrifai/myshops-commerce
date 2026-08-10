const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const normalizeNullable = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized || null;
};

const normalizeStringArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean);
};

const buildVariantKey = (attributeValues) =>
  [...attributeValues]
    .sort((a, b) =>
      String(a.attributeId).localeCompare(
        String(b.attributeId)
      )
    )
    .map(
      (item) =>
        `${item.attributeId}:${item.optionId}`
    )
    .join("|");

const cartesianProduct = (groups) => {
  if (!groups.length) {
    return [[]];
  }

  return groups.reduce(
    (accumulator, group) =>
      accumulator.flatMap((existing) =>
        group.map((item) => [
          ...existing,
          item,
        ])
      ),
    [[]]
  );
};

const generateVariantSku = ({
  parentSku,
  sequence,
  optionCodes,
}) => {
  const base =
    String(parentSku || "PRODUCT")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const optionPart = optionCodes
    .map((value) =>
      String(value || "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "")
        .slice(0, 12)
    )
    .filter(Boolean)
    .join("-");

  return [
    base || "PRODUCT",
    optionPart || String(sequence).padStart(3, "0"),
  ]
    .filter(Boolean)
    .join("-");
};

module.exports = {
  slugify,
  normalizeNullable,
  normalizeStringArray,
  buildVariantKey,
  cartesianProduct,
  generateVariantSku,
};
