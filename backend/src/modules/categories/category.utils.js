const normalizeWhitespace = (
    value
  ) => {
    if (
      value === undefined ||
      value === null
    ) {
      return "";
    }
  
    return String(value)
      .trim()
      .replace(/\s+/g, " ");
  };
  
  const generateSlug = (
    value
  ) => {
    return normalizeWhitespace(value)
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
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-");
  };
  
  const normalizeNullableText = (
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
  
  const parseBoolean = (
    value,
    fallback = undefined
  ) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return fallback;
    }
  
    if (typeof value === "boolean") {
      return value;
    }
  
    if (
      String(value).toLowerCase() ===
      "true"
    ) {
      return true;
    }
  
    if (
      String(value).toLowerCase() ===
      "false"
    ) {
      return false;
    }
  
    return fallback;
  };
  
  const buildCategoryTree = (
    categories
  ) => {
    const categoryMap = new Map();
    const roots = [];
  
    categories.forEach(
      (category) => {
        const plainCategory =
          typeof category.get ===
          "function"
            ? category.get({
                plain: true,
              })
            : { ...category };
  
        categoryMap.set(
          plainCategory.id,
          {
            ...plainCategory,
            children: [],
          }
        );
      }
    );
  
    categoryMap.forEach(
      (category) => {
        if (
          category.parentCategoryId &&
          categoryMap.has(
            category.parentCategoryId
          )
        ) {
          categoryMap
            .get(
              category.parentCategoryId
            )
            .children.push(category);
        } else {
          roots.push(category);
        }
      }
    );
  
    const sortTree = (
      tree
    ) => {
      tree.sort((a, b) => {
        const sortDifference =
          Number(a.sortOrder || 0) -
          Number(b.sortOrder || 0);
  
        if (sortDifference !== 0) {
          return sortDifference;
        }
  
        return String(a.name).localeCompare(
          String(b.name)
        );
      });
  
      tree.forEach(
        (category) => {
          sortTree(category.children);
        }
      );
    };
  
    sortTree(roots);
  
    return roots;
  };
  
  module.exports = {
    normalizeWhitespace,
    generateSlug,
    normalizeNullableText,
    parseBoolean,
    buildCategoryTree,
  };