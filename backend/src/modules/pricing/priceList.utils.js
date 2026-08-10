function normalizeNullable(value) {
    if (
      value === undefined ||
      value === null
    ) {
      return null;
    }
  
    const normalized =
      String(value).trim();
  
    return normalized.length
      ? normalized
      : null;
  }
  
  function normalizeCode(value) {
    if (
      value === undefined ||
      value === null
    ) {
      return "";
    }
  
    return String(value)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/_+/g, "_");
  }
  
  function generatePriceListCode(
    value
  ) {
    return normalizeCode(value);
  }
  
  module.exports = {
    normalizeNullable,
    normalizeCode,
    generatePriceListCode,
  };