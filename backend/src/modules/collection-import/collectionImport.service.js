const {
    parse,
  } = require(
    "csv-parse/sync"
  );
  
  const db =
  require(
    "../../models"
  );
  
  const collectionService =
  require(
    "../collections/collection.service"
  );
  
  const {
    COLLECTION_IMPORT_MODES,
    COLLECTION_IMPORT_HEADERS,
  } = require(
    "./collectionImport.constants"
  );
  
  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */
  
  const clean =
  (
    value
  ) =>
    String(
      value ??
      ""
    ).trim();
  
  const cleanNullable =
  (
    value
  ) => {
    const normalized =
      clean(
        value
      );
  
    return normalized ||
      null;
  };
  
  const generateSlug =
  (
    value
  ) =>
    String(
      value ||
      ""
    )
      .trim()
      .toLowerCase()
      .normalize(
        "NFD"
      )
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );
  
  const normalizeHeader =
  (
    value
  ) =>
    clean(
      value
    )
      .replace(
        /^\uFEFF/,
        ""
      )
      .replace(
        /[\s_\-]+/g,
        ""
      )
      .toLowerCase();
  
  const HEADER_MAP =
  new Map(
    COLLECTION_IMPORT_HEADERS.map(
      (
        header
      ) => [
        normalizeHeader(
          header
        ),
  
        header,
      ]
    )
  );
  
  const toBoolean =
  (
    value,
    fallback
  ) => {
    if (
      value ===
        undefined ||
      value ===
        null ||
      clean(
        value
      ) ===
        ""
    ) {
      return fallback;
    }
  
    const normalized =
      clean(
        value
      )
        .toUpperCase();
  
    if (
      [
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
  
    throw new Error(
      `Invalid boolean value "${value}".`
    );
  };
  
  const toInteger =
  (
    value,
    fallback =
      0
  ) => {
    if (
      value ===
        undefined ||
      value ===
        null ||
      clean(
        value
      ) ===
        ""
    ) {
      return fallback;
    }
  
    const result =
      Number(
        value
      );
  
    if (
      !Number.isInteger(
        result
      ) ||
      result <
        0
    ) {
      throw new Error(
        `"${value}" is not a valid non-negative integer.`
      );
    }
  
    return result;
  };
  
  const toDateOrNull =
  (
    value,
    fieldName
  ) => {
    const normalized =
      clean(
        value
      );
  
    if (
      !normalized
    ) {
      return null;
    }
  
    const date =
      new Date(
        normalized
      );
  
    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      throw new Error(
        `${fieldName} is not a valid date.`
      );
    }
  
    return date.toISOString();
  };
  
  const normalizeCollectionType =
  (
    value
  ) => {
    const type =
      clean(
        value ||
        "MANUAL"
      )
        .toUpperCase();
  
    if (
      ![
        "MANUAL",
        "SMART",
      ].includes(
        type
      )
    ) {
      throw new Error(
        "collectionType must be MANUAL or SMART."
      );
    }
  
    return type;
  };
  
  const getImportMode =
  (
    value
  ) => {
    const mode =
      clean(
        value ||
        "CREATE_OR_UPDATE"
      )
        .toUpperCase();
  
    if (
      !COLLECTION_IMPORT_MODES.includes(
        mode
      )
    ) {
      throw new Error(
        `importMode must be one of: ${COLLECTION_IMPORT_MODES.join(", ")}.`
      );
    }
  
    return mode;
  };
  
  /*
  |--------------------------------------------------------------------------
  | CSV Parser
  |--------------------------------------------------------------------------
  */
  
  const parseCollectionCsv =
  ({
    buffer,
  }) => {
    if (
      !Buffer.isBuffer(
        buffer
      )
    ) {
      throw new Error(
        "A valid CSV file is required."
      );
    }
  
    const text =
      buffer.toString(
        "utf8"
      );
  
    if (
      !clean(
        text
      )
    ) {
      throw new Error(
        "The uploaded CSV file is empty."
      );
    }
  
    let records;
  
    try {
      records =
        parse(
          text,
          {
            bom:
              true,
  
            columns:
              false,
  
            skip_empty_lines:
              true,
  
            trim:
              false,
  
            relax_column_count:
              false,
          }
        );
    } catch (
      error
    ) {
      throw new Error(
        `Unable to parse CSV file: ${error.message}`
      );
    }
  
    if (
      !Array.isArray(
        records
      ) ||
      records.length <
        2
    ) {
      throw new Error(
        "The CSV file does not contain collection records."
      );
    }
  
    const headers =
      records[
        0
      ].map(
        (
          header
        ) => {
          const normalized =
            normalizeHeader(
              header
            );
  
          return (
            HEADER_MAP.get(
              normalized
            ) ||
            clean(
              header
            )
          );
        }
      );
  
    if (
      !headers.includes(
        "name"
      )
    ) {
      throw new Error(
        'The CSV must contain a "name" column.'
      );
    }
  
    const seen =
      new Set();
  
    const duplicates =
      new Set();
  
    for (
      const header of
      headers
    ) {
      const key =
        header.toLowerCase();
  
      if (
        seen.has(
          key
        )
      ) {
        duplicates.add(
          header
        );
      }
  
      seen.add(
        key
      );
    }
  
    if (
      duplicates.size >
        0
    ) {
      throw new Error(
        `The CSV contains duplicate columns: ${[
          ...duplicates,
        ].join(", ")}.`
      );
    }
  
    const rows =
      [];
  
    for (
      let index =
        1;
      index <
      records.length;
      index +=
        1
    ) {
      const source =
        records[
          index
        ];
  
      const row = {
        rowNumber:
          index +
          1,
      };
  
      headers.forEach(
        (
          header,
          columnIndex
        ) => {
          row[
            header
          ] =
            source[
              columnIndex
            ] ??
            "";
        }
      );
  
      const empty =
        headers.every(
          (
            header
          ) =>
            !clean(
              row[
                header
              ]
            )
        );
  
      if (
        !empty
      ) {
        rows.push(
          row
        );
      }
    }
  
    return {
      headers,
      rows,
    };
  };
  
  /*
  |--------------------------------------------------------------------------
  | Normalize Row
  |--------------------------------------------------------------------------
  */
  
  const normalizeRow =
  (
    row
  ) => {
    const name =
      clean(
        row.name
      );
  
    if (
      !name
    ) {
      throw new Error(
        "Collection name is required."
      );
    }
  
    const slug =
      generateSlug(
        clean(
          row.slug
        ) ||
        name
      );
  
    if (
      !slug
    ) {
      throw new Error(
        "A valid collection slug could not be generated."
      );
    }
  
    const publishedFrom =
      toDateOrNull(
        row.publishedFrom,
        "publishedFrom"
      );
  
    const publishedUntil =
      toDateOrNull(
        row.publishedUntil,
        "publishedUntil"
      );
  
    if (
      publishedFrom &&
      publishedUntil &&
      new Date(
        publishedUntil
      ).getTime() <
        new Date(
          publishedFrom
        ).getTime()
    ) {
      throw new Error(
        "publishedUntil cannot be earlier than publishedFrom."
      );
    }
  
    return {
      rowNumber:
        row.rowNumber,
  
      name,
      slug,
  
      payload: {
        name,
        slug,
  
        description:
          cleanNullable(
            row.description
          ),
  
        shortDescription:
          cleanNullable(
            row.shortDescription
          ),
  
        collectionType:
          normalizeCollectionType(
            row.collectionType
          ),
  
        sortOrder:
          toInteger(
            row.sortOrder,
            0
          ),
  
        isActive:
          toBoolean(
            row.isActive,
            true
          ),
  
        isFeatured:
          toBoolean(
            row.isFeatured,
            false
          ),
  
        showInMenu:
          toBoolean(
            row.showInMenu,
            false
          ),
  
        showOnHome:
          toBoolean(
            row.showOnHome,
            false
          ),
  
        isSearchable:
          toBoolean(
            row.isSearchable,
            true
          ),
  
        showProductCount:
          toBoolean(
            row.showProductCount,
            true
          ),
  
        publishedFrom,
        publishedUntil,
  
        metaTitle:
          cleanNullable(
            row.metaTitle
          ),
  
        metaDescription:
          cleanNullable(
            row.metaDescription
          ),
  
        metaKeywords:
          cleanNullable(
            row.metaKeywords
          ),
  
        canonicalUrl:
          cleanNullable(
            row.canonicalUrl
          ),
  
        robotsIndex:
          toBoolean(
            row.robotsIndex,
            true
          ),
  
        robotsFollow:
          toBoolean(
            row.robotsFollow,
            true
          ),
      },
    };
  };
  
  /*
  |--------------------------------------------------------------------------
  | Import Collections
  |--------------------------------------------------------------------------
  */
  
  const importCollections =
  async ({
    companyId,
    userId,
    buffer,
  
    importMode =
      "CREATE_OR_UPDATE",
  
    continueOnError =
      true,
  }) => {
    const mode =
      getImportMode(
        importMode
      );
  
    const parsed =
      parseCollectionCsv({
        buffer,
      });
  
    const normalizedRows =
      [];
  
    const errors =
      [];
  
    for (
      const row of
      parsed.rows
    ) {
      try {
        normalizedRows.push(
          normalizeRow(
            row
          )
        );
      } catch (
        error
      ) {
        errors.push({
          rowNumber:
            row.rowNumber,
  
          message:
            error.message,
        });
      }
    }
  
    /*
     * Duplicate slugs inside the CSV.
     */
  
    const seenSlugs =
      new Set();
  
    for (
      const row of
      normalizedRows
    ) {
      if (
        seenSlugs.has(
          row.slug
        )
      ) {
        errors.push({
          rowNumber:
            row.rowNumber,
  
          slug:
            row.slug,
  
          message:
            `Duplicate collection slug "${row.slug}" exists in the CSV.`,
        });
      }
  
      seenSlugs.add(
        row.slug
      );
    }
  
    if (
      errors.length >
        0 &&
      !continueOnError
    ) {
      return {
        success:
          false,
  
        partiallySuccessful:
          false,
  
        importMode:
          mode,
  
        headers:
          parsed.headers,
  
        summary: {
          total:
            parsed.rows.length,
  
          created:
            0,
  
          updated:
            0,
  
          skipped:
            0,
  
          failed:
            errors.length,
        },
  
        results:
          [],
  
        errors,
      };
    }
  
    const existingCollections =
      await db.Collection.findAll({
        where: {
          companyId,
        },
  
        attributes: [
          "id",
          "name",
          "slug",
        ],
      });
  
    const bySlug =
      new Map(
        existingCollections.map(
          (
            collection
          ) => [
            collection.slug,
            collection,
          ]
        )
      );
  
    const results =
      [];
  
    for (
      const row of
      normalizedRows
    ) {
      if (
        errors.some(
          (
            item
          ) =>
            item.rowNumber ===
            row.rowNumber
        )
      ) {
        continue;
      }
  
      const existing =
        bySlug.get(
          row.slug
        ) ||
        null;
  
      try {
        if (
          mode ===
            "CREATE_ONLY" &&
          existing
        ) {
          results.push({
            rowNumber:
              row.rowNumber,
  
            slug:
              row.slug,
  
            action:
              "SKIPPED",
  
            message:
              "Collection already exists.",
          });
  
          continue;
        }
  
        if (
          mode ===
            "UPDATE_ONLY" &&
          !existing
        ) {
          results.push({
            rowNumber:
              row.rowNumber,
  
            slug:
              row.slug,
  
            action:
              "SKIPPED",
  
            message:
              "Collection does not exist.",
          });
  
          continue;
        }
  
        if (
          existing
        ) {
          const updated =
            await collectionService
              .updateCollection({
                companyId,
  
                collectionId:
                  existing.id,
  
                userId,
  
                payload:
                  row.payload,
              });
  
          /*
           * Remove old slug reference in case
           * the service changes it.
           */
  
          if (
            existing.slug !==
            updated.slug
          ) {
            bySlug.delete(
              existing.slug
            );
          }
  
          bySlug.set(
            updated.slug,
            updated
          );
  
          results.push({
            rowNumber:
              row.rowNumber,
  
            id:
              updated.id,
  
            name:
              updated.name,
  
            slug:
              updated.slug,
  
            collectionType:
              updated.collectionType,
  
            action:
              "UPDATED",
          });
        } else {
          const created =
            await collectionService
              .createCollection({
                companyId,
  
                userId,
  
                payload:
                  row.payload,
              });
  
          bySlug.set(
            created.slug,
            created
          );
  
          results.push({
            rowNumber:
              row.rowNumber,
  
            id:
              created.id,
  
            name:
              created.name,
  
            slug:
              created.slug,
  
            collectionType:
              created.collectionType,
  
            action:
              "CREATED",
          });
        }
      } catch (
        error
      ) {
        errors.push({
          rowNumber:
            row.rowNumber,
  
          slug:
            row.slug,
  
          message:
            error.message,
        });
  
        if (
          !continueOnError
        ) {
          break;
        }
      }
    }
  
    const created =
      results.filter(
        (
          item
        ) =>
          item.action ===
          "CREATED"
      ).length;
  
    const updated =
      results.filter(
        (
          item
        ) =>
          item.action ===
          "UPDATED"
      ).length;
  
    const skipped =
      results.filter(
        (
          item
        ) =>
          item.action ===
          "SKIPPED"
      ).length;
  
    return {
      success:
        errors.length ===
        0,
  
      partiallySuccessful:
        errors.length >
          0 &&
        (
          created >
            0 ||
          updated >
            0 ||
          skipped >
            0
        ),
  
      importMode:
        mode,
  
      headers:
        parsed.headers,
  
      summary: {
        total:
          parsed.rows.length,
  
        created,
  
        updated,
  
        skipped,
  
        failed:
          errors.length,
      },
  
      results,
  
      errors,
    };
  };
  
  module.exports = {
    parseCollectionCsv,
    importCollections,
  };