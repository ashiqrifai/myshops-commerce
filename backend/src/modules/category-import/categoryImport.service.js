const {
    parse,
  } = require(
    "csv-parse/sync"
  );
  
  const {
    Op,
  } = require(
    "sequelize"
  );
  
  const db =
  require(
    "../../models"
  );
  
  const categoryService =
  require(
    "../categories/category.service"
  );
  
  const {
    generateSlug,
  } = require(
    "../categories/category.utils"
  );
  
  const {
    CATEGORY_IMPORT_MODES,
    CATEGORY_IMPORT_HEADERS,
  } = require(
    "./categoryImport.constants"
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
    const result =
      clean(
        value
      );
  
    return result ||
      null;
  };
  
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
    CATEGORY_IMPORT_HEADERS.map(
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
      !CATEGORY_IMPORT_MODES.includes(
        mode
      )
    ) {
      throw new Error(
        `importMode must be one of: ${CATEGORY_IMPORT_MODES.join(", ")}.`
      );
    }
  
    return mode;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Parse CSV
  |--------------------------------------------------------------------------
  */
  
  const parseCategoryCsv =
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
        "The CSV file does not contain category records."
      );
    }
  
    const rawHeaders =
      records[
        0
      ];
  
    const headers =
      rawHeaders.map(
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
  
    const seen =
      new Set();
  
    const duplicates =
      new Set();
  
    headers.forEach(
      (
        header
      ) => {
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
    );
  
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
  
    if (
      !headers.includes(
        "name"
      )
    ) {
      throw new Error(
        'The CSV must contain a "name" column.'
      );
    }
  
    const rows = [];
  
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
  | Normalize row
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
        "Category name is required."
      );
    }
  
    const requestedSlug =
      clean(
        row.slug
      );
  
    const slug =
      generateSlug(
        requestedSlug ||
        name
      );
  
    if (
      !slug
    ) {
      throw new Error(
        "A valid category slug could not be generated."
      );
    }
  
    const parentSlugValue =
      clean(
        row.parentSlug
      );
  
    const parentSlug =
      parentSlugValue
        ? generateSlug(
            parentSlugValue
          )
        : null;
  
    if (
      parentSlug &&
      parentSlug ===
        slug
    ) {
      throw new Error(
        "A category cannot use itself as its parent."
      );
    }
  
    return {
      rowNumber:
        row.rowNumber,
  
      name,
  
      slug,
  
      parentSlug,
  
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
  
        sortOrder:
          toInteger(
            row.sortOrder,
            0
          ),
  
        iconName:
          cleanNullable(
            row.iconName
          ),
  
        iconUrl:
          cleanNullable(
            row.iconUrl
          ),
  
        isActive:
          toBoolean(
            row.isActive,
            true
          ),
  
        showInMenu:
          toBoolean(
            row.showInMenu,
            true
          ),
  
        showOnHome:
          toBoolean(
            row.showOnHome,
            false
          ),
  
        isFeatured:
          toBoolean(
            row.isFeatured,
            false
          ),
  
        isSearchable:
          toBoolean(
            row.isSearchable,
            true
          ),
  
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
  | Import
  |--------------------------------------------------------------------------
  */
  
  const importCategories =
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
      parseCategoryCsv({
        buffer,
      });
  
    const validationErrors =
      [];
  
    const normalizedRows =
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
        validationErrors.push({
          rowNumber:
            row.rowNumber,
  
          message:
            error.message,
        });
      }
    }
  
    /*
     * Prevent duplicate category slugs inside the same CSV.
     */
  
    const csvSlugRows =
      new Map();
  
    for (
      const row of
      normalizedRows
    ) {
      if (
        csvSlugRows.has(
          row.slug
        )
      ) {
        validationErrors.push({
          rowNumber:
            row.rowNumber,
  
          message:
            `Duplicate category slug "${row.slug}" exists in the CSV.`,
        });
      } else {
        csvSlugRows.set(
          row.slug,
          row.rowNumber
        );
      }
    }
  
    if (
      validationErrors.length >
        0 &&
      !continueOnError
    ) {
      return {
        success:
          false,
  
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
            validationErrors.length,
        },
  
        errors:
          validationErrors,
  
        results:
          [],
      };
    }
  
    /*
     * Existing categories are loaded once.
     */
  
    const existingCategories =
      await db.Category.findAll({
        where: {
          companyId,
        },
  
        attributes: [
          "id",
          "name",
          "slug",
          "parentCategoryId",
          "level",
        ],
      });
  
    const categoryBySlug =
      new Map(
        existingCategories.map(
          (
            category
          ) => [
            category.slug,
            category,
          ]
        )
      );
  
    /*
     * Rows are processed iteratively.
     *
     * Root categories can run immediately.
     * Child categories wait until their parent exists.
     */
  
    let pending =
      normalizedRows.filter(
        (
          row
        ) =>
          !validationErrors.some(
            (
              error
            ) =>
              error.rowNumber ===
              row.rowNumber
          )
      );
  
    const results =
      [];
  
    const errors = [
      ...validationErrors,
    ];
  
    let safetyCounter =
      0;
  
    while (
      pending.length >
        0
    ) {
      safetyCounter +=
        1;
  
      if (
        safetyCounter >
        normalizedRows.length +
          5
      ) {
        break;
      }
  
      const nextPending =
        [];
  
      let processedThisPass =
        0;
  
      for (
        const row of
        pending
      ) {
        let parent =
          null;
  
        if (
          row.parentSlug
        ) {
          parent =
            categoryBySlug.get(
              row.parentSlug
            ) ||
            null;
  
          if (
            !parent
          ) {
            nextPending.push(
              row
            );
  
            continue;
          }
        }
  
        const existing =
          categoryBySlug.get(
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
                "Category already exists.",
            });
  
            processedThisPass +=
              1;
  
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
                "Category does not exist.",
            });
  
            processedThisPass +=
              1;
  
            continue;
          }
  
          const payload = {
            ...row.payload,
  
            parentCategoryId:
              parent
                ? parent.id
                : null,
          };
  
          if (
            existing
          ) {
            const updated =
              await categoryService
                .updateCategory({
                  categoryId:
                    existing.id,
  
                  companyId,
  
                  userId,
  
                  payload,
                });
  
            categoryBySlug.set(
              updated.slug,
              updated
            );
  
            /*
             * If slug changed, remove the old map entry.
             */
  
            if (
              existing.slug !==
              updated.slug
            ) {
              categoryBySlug.delete(
                existing.slug
              );
            }
  
            results.push({
              rowNumber:
                row.rowNumber,
  
              id:
                updated.id,
  
              name:
                updated.name,
  
              slug:
                updated.slug,
  
              parentSlug:
                row.parentSlug,
  
              action:
                "UPDATED",
            });
          } else {
            const created =
              await categoryService
                .createCategory({
                  companyId,
  
                  userId,
  
                  payload,
                });
  
            categoryBySlug.set(
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
  
              parentSlug:
                row.parentSlug,
  
              action:
                "CREATED",
            });
          }
  
          processedThisPass +=
            1;
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
  
          processedThisPass +=
            1;
  
          if (
            !continueOnError
          ) {
            pending =
              [];
  
            break;
          }
        }
      }
  
      if (
        processedThisPass ===
        0
      ) {
        /*
         * Remaining rows reference missing parents,
         * or contain circular parent references.
         */
  
        for (
          const row of
          nextPending
        ) {
          errors.push({
            rowNumber:
              row.rowNumber,
  
            slug:
              row.slug,
  
            parentSlug:
              row.parentSlug,
  
            message:
              `Parent category "${row.parentSlug}" could not be found in the database or CSV.`,
          });
        }
  
        pending =
          [];
  
        break;
      }
  
      pending =
        nextPending;
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
    parseCategoryCsv,
    importCategories,
  };