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
  
  const db = require(
    "../../models"
  );
  
  const attributeService = require(
    "../attributes/attribute.service"
  );
  
  const {
    ATTRIBUTE_INPUT_TYPES,
    ATTRIBUTE_DATA_TYPES,
    SELECT_INPUT_TYPES,
  } = require(
    "../attributes/attribute.constants"
  );
  
  const {
    generateCode,
    generateOptionValue,
  } = require(
    "../attributes/attribute.utils"
  );
  
  const {
    ATTRIBUTE_IMPORT_MODES,
    ATTRIBUTE_IMPORT_HEADERS,
  } = require(
    "./attributeImport.constants"
  );
  
  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */
  
  const clean = (
    value
  ) =>
    String(
      value ??
        ""
    ).trim();
  
  const cleanNullable = (
    value
  ) => {
    const result =
      clean(
        value
      );
  
    return (
      result ||
      null
    );
  };
  
  const normalizeHeader = (
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
      ATTRIBUTE_IMPORT_HEADERS.map(
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
  
  /*
  |--------------------------------------------------------------------------
  | Boolean
  |--------------------------------------------------------------------------
  */
  
  const toBoolean = (
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
      ).toUpperCase();
  
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
  
  /*
  |--------------------------------------------------------------------------
  | Integer
  |--------------------------------------------------------------------------
  */
  
  const toInteger = (
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
  
    const parsed =
      Number(
        value
      );
  
    if (
      !Number.isInteger(
        parsed
      ) ||
      parsed <
        0
    ) {
      throw new Error(
        `"${value}" is not a valid non-negative integer.`
      );
    }
  
    return parsed;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Import Mode
  |--------------------------------------------------------------------------
  */
  
  const getImportMode = (
    value
  ) => {
    const mode =
      clean(
        value ||
        "CREATE_OR_UPDATE"
      ).toUpperCase();
  
    if (
      !ATTRIBUTE_IMPORT_MODES.includes(
        mode
      )
    ) {
      throw new Error(
        `importMode must be one of: ${ATTRIBUTE_IMPORT_MODES.join(
          ", "
        )}.`
      );
    }
  
    return mode;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Options Parser
  |--------------------------------------------------------------------------
  |
  | Supported:
  |
  | 128 GB|256 GB|512 GB
  |
  | Black::black::#000000|White::white::#FFFFFF
  |
  | Each option:
  | label
  | label::value
  | label::value::swatchValue
  |--------------------------------------------------------------------------
  */
  
  const parseOptions = (
    value
  ) => {
    const raw =
      clean(
        value
      );
  
    if (!raw) {
      return [];
    }
  
    const pieces =
      raw
        .split("|")
        .map(
          (
            item
          ) =>
            item.trim()
        )
        .filter(
          Boolean
        );
  
    const seenValues =
      new Set();
  
    return pieces.map(
      (
        item,
        index
      ) => {
        const [
          labelPart,
          valuePart,
          swatchPart,
        ] =
          item
            .split("::")
            .map(
              (
                part
              ) =>
                part.trim()
            );
  
        const label =
          clean(
            labelPart
          );
  
        if (!label) {
          throw new Error(
            `Option ${index + 1} has no label.`
          );
        }
  
        const optionValue =
          generateOptionValue(
            valuePart ||
            label
          );
  
        if (!optionValue) {
          throw new Error(
            `A valid value could not be generated for option "${label}".`
          );
        }
  
        if (
          seenValues.has(
            optionValue
          )
        ) {
          throw new Error(
            `Duplicate option value "${optionValue}".`
          );
        }
  
        seenValues.add(
          optionValue
        );
  
        return {
          label,
  
          value:
            optionValue,
  
          swatchValue:
            cleanNullable(
              swatchPart
            ),
  
          displayOrder:
            index,
  
          isActive:
            true,
        };
      }
    );
  };
  
  /*
  |--------------------------------------------------------------------------
  | Category Slugs Parser
  |--------------------------------------------------------------------------
  */
  
  const parseCategorySlugs = (
    value
  ) => {
    const raw =
      clean(
        value
      );
  
    if (!raw) {
      return [];
    }
  
    return [
      ...new Set(
        raw
          .split("|")
          .map(
            (
              item
            ) =>
              item
                .trim()
                .toLowerCase()
          )
          .filter(
            Boolean
          )
      ),
    ];
  };
  
  /*
  |--------------------------------------------------------------------------
  | Resolve Categories
  |--------------------------------------------------------------------------
  */
  
  const resolveCategoryAssignments =
    async ({
      companyId,
      categorySlugs,
      attributeDefaults,
    }) => {
      if (
        !categorySlugs.length
      ) {
        return [];
      }
  
      const categories =
        await db.Category.findAll({
          where: {
            companyId,
  
            slug: {
              [Op.in]:
                categorySlugs,
            },
  
            isActive:
              true,
          },
  
          attributes: [
            "id",
            "name",
            "slug",
          ],
  
          raw:
            true,
        });
  
      const bySlug =
        new Map(
          categories.map(
            (
              category
            ) => [
              String(
                category.slug
              ).toLowerCase(),
  
              category,
            ]
          )
        );
  
      const missing =
        categorySlugs.filter(
          (
            slug
          ) =>
            !bySlug.has(
              slug
            )
        );
  
      if (
        missing.length >
        0
      ) {
        throw new Error(
          `Category slug${
            missing.length ===
            1
              ? ""
              : "s"
          } not found: ${missing.join(
            ", "
          )}.`
        );
      }
  
      return categorySlugs.map(
        (
          slug,
          index
        ) => {
          const category =
            bySlug.get(
              slug
            );
  
          return {
            categoryId:
              category.id,
  
            isRequired:
              attributeDefaults.isRequired,
  
            isFilterable:
              attributeDefaults.isFilterable,
  
            isVariantDefining:
              attributeDefaults.isVariantDefining,
  
            displayOrder:
              index,
  
            isActive:
              true,
          };
        }
      );
    };
  
  /*
  |--------------------------------------------------------------------------
  | Parse CSV
  |--------------------------------------------------------------------------
  */
  
  const parseAttributeCsv = ({
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
        "The CSV file does not contain attribute records."
      );
    }
  
    const headers =
      records[0].map(
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
  
    /*
    |--------------------------------------------------------------------------
    | Duplicate Headers
    |--------------------------------------------------------------------------
    */
  
    const seen =
      new Set();
  
    const duplicates =
      new Set();
  
    headers.forEach(
      (
        header
      ) => {
        const key =
          String(
            header
          ).toLowerCase();
  
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
  
      if (!empty) {
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
  
  const normalizeRow = (
    row,
    headers
  ) => {
    const name =
      clean(
        row.name
      );
  
    if (!name) {
      throw new Error(
        "Attribute name is required."
      );
    }
  
    const code =
      generateCode(
        clean(
          row.code
        ) ||
        name
      );
  
    if (!code) {
      throw new Error(
        "A valid attribute code could not be generated."
      );
    }
  
    const inputType =
      clean(
        row.inputType ||
        "TEXT"
      ).toUpperCase();
  
    if (
      !ATTRIBUTE_INPUT_TYPES.includes(
        inputType
      )
    ) {
      throw new Error(
        `Invalid inputType "${row.inputType}".`
      );
    }
  
    let dataType =
      clean(
        row.dataType
      ).toUpperCase();
  
    if (!dataType) {
      if (
        inputType ===
        "NUMBER"
      ) {
        dataType =
          "NUMBER";
      } else if (
        inputType ===
        "BOOLEAN"
      ) {
        dataType =
          "BOOLEAN";
      } else if (
        inputType ===
        "DATE"
      ) {
        dataType =
          "DATE";
      } else if (
        inputType ===
        "MULTI_SELECT"
      ) {
        dataType =
          "JSON";
      } else {
        dataType =
          "STRING";
      }
    }
  
    if (
      !ATTRIBUTE_DATA_TYPES.includes(
        dataType
      )
    ) {
      throw new Error(
        `Invalid dataType "${row.dataType}".`
      );
    }
  
    const isVariantDefining =
      toBoolean(
        row.isVariantDefining,
        false
      );
  
    const isFilterable =
      toBoolean(
        row.isFilterable,
        false
      );
  
    const isSearchable =
      toBoolean(
        row.isSearchable,
        false
      );
  
    const isComparable =
      toBoolean(
        row.isComparable,
        false
      );
  
    const isRequired =
      toBoolean(
        row.isRequired,
        false
      );
  
    const options =
      parseOptions(
        row.options
      );
  
    /*
     * For selectable attributes, options are mandatory on CREATE.
     * For UPDATE they may be omitted, so we track whether the CSV
     * actually contained an options column.
     */
  
    const hasOptionsColumn =
      headers.includes(
        "options"
      );
  
    const hasCategorySlugsColumn =
      headers.includes(
        "categorySlugs"
      );
  
    const categorySlugs =
      parseCategorySlugs(
        row.categorySlugs
      );
  
    const payload = {
      name,
      code,
  
      description:
        cleanNullable(
          row.description
        ),
  
      inputType,
      dataType,
  
      unit:
        cleanNullable(
          row.unit
        ),
  
      isVariantDefining,
      isFilterable,
      isSearchable,
      isComparable,
      isRequired,
  
      displayOrder:
        toInteger(
          row.displayOrder,
          0
        ),
  
      isActive:
        toBoolean(
          row.isActive,
          true
        ),
    };
  
    if (
      hasOptionsColumn
    ) {
      payload.options =
        options;
    }
  
    return {
      rowNumber:
        row.rowNumber,
  
      name,
      code,
  
      inputType,
      dataType,
  
      options,
  
      categorySlugs,
  
      hasOptionsColumn,
      hasCategorySlugsColumn,
  
      payload,
    };
  };
  
  /*
  |--------------------------------------------------------------------------
  | Main Import
  |--------------------------------------------------------------------------
  */
  
  const importAttributes =
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
        parseAttributeCsv({
          buffer,
        });
  
      const normalizedRows =
        [];
  
      const errors =
        [];
  
      /*
      |--------------------------------------------------------------------------
      | Normalize Rows
      |--------------------------------------------------------------------------
      */
  
      for (
        const row of
        parsed.rows
      ) {
        try {
          normalizedRows.push(
            normalizeRow(
              row,
              parsed.headers
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
      |--------------------------------------------------------------------------
      | Duplicate Codes in CSV
      |--------------------------------------------------------------------------
      */
  
      const seenCodes =
        new Set();
  
      for (
        const row of
        normalizedRows
      ) {
        if (
          seenCodes.has(
            row.code
          )
        ) {
          errors.push({
            rowNumber:
              row.rowNumber,
  
            code:
              row.code,
  
            message:
              `Duplicate attribute code "${row.code}" exists in the CSV.`,
          });
        }
  
        seenCodes.add(
          row.code
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
  
      /*
      |--------------------------------------------------------------------------
      | Existing Attributes
      |--------------------------------------------------------------------------
      */
  
      const existingAttributes =
        await db.Attribute.findAll({
          where: {
            companyId,
          },
  
          attributes: [
            "id",
            "name",
            "code",
            "inputType",
            "dataType",
          ],
        });
  
      const byCode =
        new Map(
          existingAttributes.map(
            (
              attribute
            ) => [
              attribute.code,
              attribute,
            ]
          )
        );
  
      /*
      |--------------------------------------------------------------------------
      | Process Rows
      |--------------------------------------------------------------------------
      */
  
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
          byCode.get(
            row.code
          ) ||
          null;
  
        try {
          /*
          |--------------------------------------------------------------------------
          | Import Mode
          |--------------------------------------------------------------------------
          */
  
          if (
            mode ===
              "CREATE_ONLY" &&
            existing
          ) {
            results.push({
              rowNumber:
                row.rowNumber,
  
              code:
                row.code,
  
              name:
                row.name,
  
              action:
                "SKIPPED",
  
              message:
                "Attribute already exists.",
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
  
              code:
                row.code,
  
              name:
                row.name,
  
              action:
                "SKIPPED",
  
              message:
                "Attribute does not exist.",
            });
  
            continue;
          }
  
          /*
          |--------------------------------------------------------------------------
          | Resolve Category Assignments
          |--------------------------------------------------------------------------
          */
  
          if (
            row.hasCategorySlugsColumn
          ) {
            row.payload.categoryAssignments =
              await resolveCategoryAssignments({
                companyId,
  
                categorySlugs:
                  row.categorySlugs,
  
                attributeDefaults: {
                  isRequired:
                    row.payload.isRequired,
  
                  isFilterable:
                    row.payload.isFilterable,
  
                  isVariantDefining:
                    row.payload.isVariantDefining,
                },
              });
          }
  
          /*
          |--------------------------------------------------------------------------
          | Selectable Attribute Validation
          |--------------------------------------------------------------------------
          */
  
          if (
            !existing &&
            SELECT_INPUT_TYPES.includes(
              row.inputType
            ) &&
            (
              !Array.isArray(
                row.payload.options
              ) ||
              row.payload.options.length ===
                0
            )
          ) {
            throw new Error(
              `Selectable attribute "${row.name}" requires at least one option.`
            );
          }
  
          /*
          |--------------------------------------------------------------------------
          | Update
          |--------------------------------------------------------------------------
          */
  
          if (
            existing
          ) {
            const updated =
              await attributeService
                .updateAttribute({
                  companyId,
  
                  attributeId:
                    existing.id,
  
                  userId,
  
                  payload:
                    row.payload,
                });
  
            byCode.set(
              updated.code,
              updated
            );
  
            results.push({
              rowNumber:
                row.rowNumber,
  
              id:
                updated.id,
  
              name:
                updated.name,
  
              code:
                updated.code,
  
              inputType:
                updated.inputType,
  
              action:
                "UPDATED",
            });
          } else {
            /*
            |--------------------------------------------------------------------------
            | Create
            |--------------------------------------------------------------------------
            */
  
            const created =
              await attributeService
                .createAttribute({
                  companyId,
  
                  userId,
  
                  payload:
                    row.payload,
                });
  
            byCode.set(
              created.code,
              created
            );
  
            results.push({
              rowNumber:
                row.rowNumber,
  
              id:
                created.id,
  
              name:
                created.name,
  
              code:
                created.code,
  
              inputType:
                created.inputType,
  
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
  
            code:
              row.code,
  
            name:
              row.name,
  
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
  
      /*
      |--------------------------------------------------------------------------
      | Summary
      |--------------------------------------------------------------------------
      */
  
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
    parseAttributeCsv,
    importAttributes,
  };