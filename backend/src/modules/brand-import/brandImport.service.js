const {
    parse,
  } = require(
    "csv-parse/sync"
  );
  
  const db =
  require(
    "../../models"
  );
  
  const brandService =
  require(
    "../brands/brand.service"
  );
  
  const {
    generateSlug,
    generateCode,
  } = require(
    "../brands/brand.utils"
  );
  
  const {
    BRAND_IMPORT_MODES,
    BRAND_IMPORT_HEADERS,
  } = require(
    "./brandImport.constants"
  );
  
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
    BRAND_IMPORT_HEADERS.map(
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
      !BRAND_IMPORT_MODES.includes(
        mode
      )
    ) {
      throw new Error(
        `importMode must be one of: ${BRAND_IMPORT_MODES.join(", ")}.`
      );
    }
  
    return mode;
  };
  
  const parseBrandCsv =
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
        "The CSV file does not contain brand records."
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
        "Brand name is required."
      );
    }
  
    const code =
      generateCode(
        clean(
          row.code
        ) ||
        name
      );
  
    const slug =
      generateSlug(
        clean(
          row.slug
        ) ||
        name
      );
  
    if (
      !code
    ) {
      throw new Error(
        "A valid brand code could not be generated."
      );
    }
  
    if (
      !slug
    ) {
      throw new Error(
        "A valid brand slug could not be generated."
      );
    }
  
    return {
      rowNumber:
        row.rowNumber,
  
      name,
      code,
      slug,
  
      payload: {
        name,
        code,
        slug,
  
        description:
          cleanNullable(
            row.description
          ),
  
        websiteUrl:
          cleanNullable(
            row.websiteUrl
          ),
  
        countryOfOrigin:
          cleanNullable(
            row.countryOfOrigin
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
  
        sortOrder:
          toInteger(
            row.sortOrder,
            0
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
      },
    };
  };
  
  const importBrands =
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
      parseBrandCsv({
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
  
    const seenCodes =
      new Set();
  
    const seenSlugs =
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
            `Duplicate brand code "${row.code}" exists in the CSV.`,
        });
      }
  
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
            `Duplicate brand slug "${row.slug}" exists in the CSV.`,
        });
      }
  
      seenCodes.add(
        row.code
      );
  
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
  
    const existingBrands =
      await db.Brand.findAll({
        where: {
          companyId,
        },
  
        attributes: [
          "id",
          "name",
          "code",
          "slug",
        ],
      });
  
    const byCode =
      new Map(
        existingBrands.map(
          (
            brand
          ) => [
            brand.code,
            brand,
          ]
        )
      );
  
    const bySlug =
      new Map(
        existingBrands.map(
          (
            brand
          ) => [
            brand.slug,
            brand,
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
        byCode.get(
          row.code
        ) ||
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
  
            code:
              row.code,
  
            slug:
              row.slug,
  
            action:
              "SKIPPED",
  
            message:
              "Brand already exists.",
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
  
            slug:
              row.slug,
  
            action:
              "SKIPPED",
  
            message:
              "Brand does not exist.",
          });
  
          continue;
        }
  
        if (
          existing
        ) {
          const updated =
            await brandService
              .updateBrand({
                companyId,
  
                brandId:
                  existing.id,
  
                userId,
  
                payload:
                  row.payload,
              });
  
          byCode.set(
            updated.code,
            updated
          );
  
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
  
            code:
              updated.code,
  
            slug:
              updated.slug,
  
            action:
              "UPDATED",
          });
        } else {
          const created =
            await brandService
              .createBrand({
                companyId,
  
                userId,
  
                payload:
                  row.payload,
              });
  
          byCode.set(
            created.code,
            created
          );
  
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
  
            code:
              created.code,
  
            slug:
              created.slug,
  
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
    parseBrandCsv,
    importBrands,
  };