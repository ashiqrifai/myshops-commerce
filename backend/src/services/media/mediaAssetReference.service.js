const {
    registerMediaUsage,
    removeMediaUsage,
  } = require("./mediaUsage.service");
  
  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  const isPlainObject = (value) => {
    return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  };
  
  const isUuid = (value) => {
    return (
      typeof value === "string" &&
      UUID_PATTERN.test(value.trim())
    );
  };
  
  const isSingleAssetField = (
    fieldName
  ) => {
    return fieldName
      .toLowerCase()
      .endsWith("assetid");
  };
  
  const isMultipleAssetField = (
    fieldName
  ) => {
    return fieldName
      .toLowerCase()
      .endsWith("assetids");
  };
  
  const buildPath = (
    parentPath,
    currentKey
  ) => {
    if (!parentPath) {
      return currentKey;
    }
  
    return `${parentPath}.${currentKey}`;
  };
  
  /**
   * Recursively extracts DAM asset references from
   * objects and arrays.
   *
   * Supported examples:
   *
   * {
   *   logoAssetId: "uuid"
   * }
   *
   * {
   *   galleryAssetIds: ["uuid", "uuid"]
   * }
   *
   * {
   *   slides: [
   *     {
   *       desktopImageAssetId: "uuid"
   *     }
   *   ]
   * }
   */
  const extractAssetReferences = (
    value,
    parentPath = ""
  ) => {
    const references = [];
  
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const arrayPath =
          `${parentPath}[${index}]`;
  
        references.push(
          ...extractAssetReferences(
            item,
            arrayPath
          )
        );
      });
  
      return references;
    }
  
    if (!isPlainObject(value)) {
      return references;
    }
  
    for (const [
      key,
      fieldValue,
    ] of Object.entries(value)) {
      const fieldPath = buildPath(
        parentPath,
        key
      );
  
      if (isSingleAssetField(key)) {
        if (isUuid(fieldValue)) {
          references.push({
            mediaAssetId:
              fieldValue.trim(),
  
            fieldName: fieldPath,
          });
        }
  
        continue;
      }
  
      if (
        isMultipleAssetField(key) &&
        Array.isArray(fieldValue)
      ) {
        fieldValue.forEach(
          (assetId, index) => {
            if (!isUuid(assetId)) {
              return;
            }
  
            references.push({
              mediaAssetId:
                assetId.trim(),
  
              fieldName:
                `${fieldPath}[${index}]`,
            });
          }
        );
  
        continue;
      }
  
      if (
        Array.isArray(fieldValue) ||
        isPlainObject(fieldValue)
      ) {
        references.push(
          ...extractAssetReferences(
            fieldValue,
            fieldPath
          )
        );
      }
    }
  
    return references;
  };
  
  const buildReferenceMap = (
    references
  ) => {
    const map = new Map();
  
    for (const reference of references) {
      map.set(
        reference.fieldName,
        reference
      );
    }
  
    return map;
  };
  
  /**
   * Synchronizes the active DAM usage records for
   * one business entity.
   *
   * Usage is matched by the complete JSON path:
   *
   * content.logoAssetId
   * content.slides[0].desktopImageAssetId
   * settings.backgroundAssetId
   */
  const syncAssetUsageReferences =
    async ({
      companyId,
      module,
      entityType,
      entityId,
      entityName = null,
      previousObject = {},
      nextObject = {},
      userId = null,
      transaction,
    }) => {
      const previousReferences =
        extractAssetReferences(
          previousObject
        );
  
      const nextReferences =
        extractAssetReferences(
          nextObject
        );
  
      const previousMap =
        buildReferenceMap(
          previousReferences
        );
  
      const nextMap =
        buildReferenceMap(
          nextReferences
        );
  
      const allFieldNames = new Set([
        ...previousMap.keys(),
        ...nextMap.keys(),
      ]);
  
      const summary = {
        previousReferenceCount:
          previousReferences.length,
  
        nextReferenceCount:
          nextReferences.length,
  
        registered: 0,
        removed: 0,
        replaced: 0,
        unchanged: 0,
      };
  
      for (const fieldName of allFieldNames) {
        const previousAssetId =
          previousMap.get(fieldName)
            ?.mediaAssetId || null;
  
        const nextAssetId =
          nextMap.get(fieldName)
            ?.mediaAssetId || null;
  
        const usageContext =
          entityName
            ? `${entityName} — ${fieldName}`
            : fieldName;
  
        if (
          previousAssetId &&
          nextAssetId &&
          previousAssetId === nextAssetId
        ) {
          await registerMediaUsage({
            companyId,
            mediaAssetId:
              nextAssetId,
            module,
            entityType,
            entityId,
            fieldName,
            usageContext,
            userId,
            transaction,
          });
  
          summary.unchanged += 1;
          continue;
        }
  
        if (previousAssetId) {
          await removeMediaUsage({
            companyId,
            mediaAssetId:
              previousAssetId,
            module,
            entityType,
            entityId,
            fieldName,
            userId,
            transaction,
          });
  
          summary.removed += 1;
        }
  
        if (nextAssetId) {
          await registerMediaUsage({
            companyId,
            mediaAssetId:
              nextAssetId,
            module,
            entityType,
            entityId,
            fieldName,
            usageContext,
            userId,
            transaction,
          });
  
          summary.registered += 1;
        }
  
        if (
          previousAssetId &&
          nextAssetId &&
          previousAssetId !== nextAssetId
        ) {
          summary.replaced += 1;
        }
      }
  
      return summary;
    };
  
  module.exports = {
    extractAssetReferences,
    syncAssetUsageReferences,
  };