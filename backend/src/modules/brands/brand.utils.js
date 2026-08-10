const generateSlug = (
  value
) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(/&/g, " and ")
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    )
    .replace(
      /-{2,}/g,
      "-"
    );
};

const generateCode = (
  value
) => {
  return String(value || "")
    .trim()
    .toUpperCase()
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(/&/g, " AND ")
    .replace(
      /[^A-Z0-9]+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    )
    .replace(
      /_{2,}/g,
      "_"
    );
};

const normalizeNullable = (
  value
) => {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const normalized =
    String(value).trim();

  return normalized || null;
};

module.exports = {
  generateSlug,
  generateCode,
  normalizeNullable,
};
