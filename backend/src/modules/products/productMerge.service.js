const { Op } = require("sequelize");

const {
  sequelize,
  Product,
  ProductVariant,
  ProductVariantAttributeValue,
  ProductImage,
  ProductCategory,
  ProductChannel,
  ProductCollection,
  Attribute,
  AttributeOption,
  ProtectionSchemeAssignment,
  ProductAttachmentRule,
  ProductAttachmentRuleItem,
  GiftVoucherPromotionItem,
  OrderItem,
} = require("../../models");

const createError = (message, statusCode = 400, code = "PRODUCT_MERGE_ERROR", details = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  if (details) error.details = details;
  return error;
};

const clean = (value) =>
  value === undefined || value === null ? "" : String(value).trim();

const unique = (values) => Array.from(new Set(values.filter(Boolean)));

const buildVariantKey = (attributes) =>
  [...attributes]
    .sort((a, b) => String(a.attributeId).localeCompare(String(b.attributeId)))
    .map((item) => `${item.attributeId}:${item.optionId}`)
    .join("|");

const normalizePayload = (payload) => ({
  sourceProductIds: unique(
    Array.isArray(payload?.sourceProductIds)
      ? payload.sourceProductIds.map(clean)
      : []
  ),
  parentProductId: clean(payload?.parentProductId),
  defaultVariantId: clean(payload?.defaultVariantId) || null,
  parent: {
    name: clean(payload?.parent?.name),
    slug: clean(payload?.parent?.slug).toLowerCase(),
    parentSku: clean(payload?.parent?.parentSku).toUpperCase(),
  },
  variantMappings: Array.isArray(payload?.variantMappings)
    ? payload.variantMappings.map((mapping) => ({
        productId: clean(mapping.productId),
        variantId: clean(mapping.variantId),
        attributes: Array.isArray(mapping.attributes)
          ? mapping.attributes.map((item, index) => ({
              attributeId: clean(item.attributeId),
              optionId: clean(item.optionId),
              sortOrder: Number.isFinite(Number(item.sortOrder))
                ? Number(item.sortOrder)
                : index,
            }))
          : [],
      }))
    : [],
});

const loadProducts = async ({ companyId, ids, transaction }) =>
  Product.findAll({
    where: {
      companyId,
      id: { [Op.in]: ids },
    },
    include: [
      {
        model: ProductVariant,
        as: "variants",
        required: false,
        where: { status: { [Op.ne]: "ARCHIVED" } },
      },
      { model: ProductCategory, as: "categoryAssignments", required: false },
      { model: ProductChannel, as: "channels", required: false },
      { model: ProductCollection, as: "collectionAssignments", required: false },
      { model: ProductImage, as: "images", required: false },
    ],
    transaction,
  });

const loadAttributeLookup = async ({ companyId, mappings, transaction }) => {
  const attributeIds = unique(
    mappings.flatMap((m) => m.attributes.map((a) => a.attributeId))
  );
  const optionIds = unique(
    mappings.flatMap((m) => m.attributes.map((a) => a.optionId))
  );

  const [attributes, options] = await Promise.all([
    attributeIds.length
      ? Attribute.findAll({
          where: {
            companyId,
            id: { [Op.in]: attributeIds },
            isActive: true,
            isVariantDefining: true,
          },
          transaction,
        })
      : [],
    optionIds.length
      ? AttributeOption.findAll({
          where: {
            companyId,
            id: { [Op.in]: optionIds },
            isActive: true,
          },
          transaction,
        })
      : [],
  ]);

  return {
    attributes: new Map(attributes.map((item) => [item.id, item])),
    options: new Map(options.map((item) => [item.id, item])),
  };
};

const countBlockingDependencies = async ({
  companyId,
  sourceProductIds,
  parentProductId,
  transaction,
}) => {
  const redundantIds = sourceProductIds.filter((id) => id !== parentProductId);

  if (!redundantIds.length) {
    return {
      protectionAssignments: 0,
      attachmentRules: 0,
      attachmentRuleItems: 0,
      giftVoucherPromotionItems: 0,
    };
  }

  const [
    protectionAssignments,
    attachmentRules,
    attachmentRuleItems,
    giftVoucherPromotionItems,
  ] = await Promise.all([
    ProtectionSchemeAssignment.count({
      where: { productId: { [Op.in]: redundantIds } },
      transaction,
    }),
    ProductAttachmentRule.count({
      where: { companyId, productId: { [Op.in]: redundantIds } },
      transaction,
    }),
    ProductAttachmentRuleItem.count({
      where: { attachmentProductId: { [Op.in]: redundantIds } },
      transaction,
    }),
    GiftVoucherPromotionItem.count({
      where: { productId: { [Op.in]: redundantIds } },
      transaction,
    }),
  ]);

  return {
    protectionAssignments,
    attachmentRules,
    attachmentRuleItems,
    giftVoucherPromotionItems,
  };
};

const validateMerge = async ({ companyId, payload, transaction = null }) => {
  const normalized = normalizePayload(payload);
  const errors = [];
  const warnings = [];

  if (normalized.sourceProductIds.length < 2) {
    errors.push("Select at least two existing products to merge.");
  }

  if (!normalized.parentProductId) {
    errors.push("A surviving parent product is required.");
  } else if (!normalized.sourceProductIds.includes(normalized.parentProductId)) {
    errors.push("The surviving parent must be one of the selected products.");
  }

  if (!normalized.parent.name) errors.push("Parent product name is required.");
  if (!normalized.parent.slug) errors.push("Parent product slug is required.");
  if (!normalized.parent.parentSku) errors.push("Parent SKU is required.");

  if (errors.length) {
    return { normalized, errors, warnings, canExecute: false };
  }

  const products = await loadProducts({
    companyId,
    ids: normalized.sourceProductIds,
    transaction,
  });

  if (products.length !== normalized.sourceProductIds.length) {
    errors.push("One or more selected products could not be found for this company.");
  }

  const productById = new Map(products.map((product) => [product.id, product]));
  const allVariants = products.flatMap((product) => product.variants || []);

  for (const product of products) {
    const variants = product.variants || [];
    if (variants.length !== 1) {
      errors.push(
        `"${product.name}" must contain exactly one non-archived variant for this merge workflow. Found ${variants.length}.`
      );
    }
  }

  if (normalized.variantMappings.length !== allVariants.length) {
    errors.push(
      `Variant mapping count mismatch. Expected ${allVariants.length}, received ${normalized.variantMappings.length}.`
    );
  }

  const mappingByVariantId = new Map();

  for (const mapping of normalized.variantMappings) {
    if (!mapping.productId || !mapping.variantId) {
      errors.push("Each variant mapping requires productId and variantId.");
      continue;
    }

    if (mappingByVariantId.has(mapping.variantId)) {
      errors.push(`Variant ${mapping.variantId} appears more than once.`);
      continue;
    }

    mappingByVariantId.set(mapping.variantId, mapping);

    const product = productById.get(mapping.productId);
    const variant = product?.variants?.find((item) => item.id === mapping.variantId);

    if (!variant) {
      errors.push(
        `Variant ${mapping.variantId} does not belong to selected product ${mapping.productId}.`
      );
    }

    if (!mapping.attributes.length) {
      errors.push(`Variant ${variant?.sku || mapping.variantId} has no mapped attributes.`);
    }

    const seenAttributes = new Set();
    for (const item of mapping.attributes) {
      if (!item.attributeId || !item.optionId) {
        errors.push(`Variant ${variant?.sku || mapping.variantId} has an incomplete attribute mapping.`);
      }

      if (seenAttributes.has(item.attributeId)) {
        errors.push(`Variant ${variant?.sku || mapping.variantId} repeats the same attribute.`);
      }
      seenAttributes.add(item.attributeId);
    }
  }

  for (const variant of allVariants) {
    if (!mappingByVariantId.has(variant.id)) {
      errors.push(`Existing variant ${variant.sku} is missing from the mapping.`);
    }
  }

  const attributeLookup = await loadAttributeLookup({
    companyId,
    mappings: normalized.variantMappings,
    transaction,
  });

  const combinationKeys = new Map();

  /*
  |--------------------------------------------------------------------------
  | Require the same variant-defining attribute set for every child
  |--------------------------------------------------------------------------
  |
  | Example:
  |   STORAGE + COLOR + VERSION + SIM_TYPE
  |
  | Every child in the merged family should use the same attribute set.
  | This keeps storefront selectors deterministic and prevents ambiguous
  | combinations where one child is missing one of the selector dimensions.
  |--------------------------------------------------------------------------
  */

  let expectedAttributeSetKey = null;

  for (const mapping of normalized.variantMappings) {
    const attributeSetKey = mapping.attributes
      .map((item) => item.attributeId)
      .filter(Boolean)
      .sort()
      .join("|");

    if (expectedAttributeSetKey === null) {
      expectedAttributeSetKey = attributeSetKey;
    } else if (attributeSetKey !== expectedAttributeSetKey) {
      errors.push(
        `Variant ${mapping.variantId} does not use the same variant-defining attribute set as the other selected variants.`
      );
    }
    for (const item of mapping.attributes) {
      const attribute = attributeLookup.attributes.get(item.attributeId);
      const option = attributeLookup.options.get(item.optionId);

      if (!attribute) {
        errors.push(
          `Attribute ${item.attributeId} does not exist, is inactive, or is not variant-defining.`
        );
        continue;
      }

      if (!option || option.attributeId !== attribute.id) {
        errors.push(`Option ${item.optionId} does not belong to ${attribute.code}.`);
      }
    }

    const key = buildVariantKey(mapping.attributes);
    if (combinationKeys.has(key)) {
      errors.push(
        `Duplicate variant combination detected between ${combinationKeys.get(key)} and ${mapping.variantId}.`
      );
    } else {
      combinationKeys.set(key, mapping.variantId);
    }
  }

  if (
    normalized.defaultVariantId &&
    !allVariants.some((variant) => variant.id === normalized.defaultVariantId)
  ) {
    errors.push("The selected default variant is not part of this merge.");
  }

  const [slugConflict, skuConflict] = await Promise.all([
    Product.findOne({
      where: {
        companyId,
        slug: normalized.parent.slug,
        id: { [Op.notIn]: normalized.sourceProductIds },
      },
      transaction,
    }),
    Product.findOne({
      where: {
        companyId,
        parentSku: normalized.parent.parentSku,
        id: { [Op.notIn]: normalized.sourceProductIds },
      },
      transaction,
    }),
  ]);

  if (slugConflict) errors.push(`Slug "${normalized.parent.slug}" is already in use.`);
  if (skuConflict) errors.push(`Parent SKU "${normalized.parent.parentSku}" is already in use.`);

  const parentProduct = productById.get(normalized.parentProductId);

  if (parentProduct) {
    if (products.some((product) => product.brandId !== parentProduct.brandId)) {
      warnings.push("Selected products do not all share the same brand. The surviving parent's brand will be kept.");
    }

    if (
      products.some(
        (product) => product.primaryCategoryId !== parentProduct.primaryCategoryId
      )
    ) {
      warnings.push("Selected products do not all share the same primary category. The surviving parent's primary category will be kept.");
    }
  }

  const blockingDependencies = await countBlockingDependencies({
    companyId,
    sourceProductIds: normalized.sourceProductIds,
    parentProductId: normalized.parentProductId,
    transaction,
  });

  const blockingCount = Object.values(blockingDependencies).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );

  if (blockingCount > 0) {
    errors.push(
      "One or more redundant source products have product-level protection, attachment, or gift-voucher assignments. Resolve those before merging."
    );
  }

  const historicalOrderItems = await OrderItem.count({
    where: {
      companyId,
      productId: { [Op.in]: normalized.sourceProductIds },
    },
    transaction,
  });

  if (historicalOrderItems > 0) {
    warnings.push(
      `${historicalOrderItems} historical order item(s) reference these products. They will remain unchanged.`
    );
  }

  const variants = allVariants.map((variant) => {
    const mapping = mappingByVariantId.get(variant.id);
    return {
      productId: variant.productId,
      variantId: variant.id,
      sku: variant.sku,
      barcode: variant.barcode || null,
      zohoItemId: variant.zohoItemId || null,
      zohoItemCode: variant.zohoItemCode || null,
      attributes: (mapping?.attributes || []).map((item) => {
        const attribute = attributeLookup.attributes.get(item.attributeId);
        const option = attributeLookup.options.get(item.optionId);
        return {
          attributeId: item.attributeId,
          attributeCode: attribute?.code || null,
          attributeName: attribute?.name || null,
          optionId: item.optionId,
          optionLabel: option?.label || null,
          optionValue: option?.value || null,
        };
      }),
    };
  });

  return {
    normalized,
    errors,
    warnings,
    canExecute: errors.length === 0,
    products,
    allVariants,
    mappingByVariantId,
    attributeLookup,
    preview: {
      parentProduct: {
        id: normalized.parentProductId,
        name: normalized.parent.name,
        slug: normalized.parent.slug,
        parentSku: normalized.parent.parentSku,
      },
      summary: {
        sourceProducts: products.length,
        variants: variants.length,
        redundantProducts: Math.max(0, products.length - 1),
        historicalOrderItems,
      },
      blockingDependencies,
      variants,
    },
  };
};

const copyCategoriesToParent = async ({ companyId, products, parentProduct, transaction }) => {
  const assignments = products.flatMap((product) => product.categoryAssignments || []);

  for (const assignment of assignments) {
    const exists = await ProductCategory.findOne({
      where: {
        companyId,
        productId: parentProduct.id,
        categoryId: assignment.categoryId,
      },
      transaction,
    });

    if (!exists) {
      await ProductCategory.create(
        {
          companyId,
          productId: parentProduct.id,
          categoryId: assignment.categoryId,
          isPrimary: assignment.categoryId === parentProduct.primaryCategoryId,
          displayOrder: assignment.displayOrder || 0,
        },
        { transaction }
      );
    }
  }
};

const copyCollectionsToParent = async ({ companyId, userId, products, parentProduct, transaction }) => {
  const assignments = products.flatMap((product) => product.collectionAssignments || []);

  for (const assignment of assignments) {
    const exists = await ProductCollection.findOne({
      where: {
        collectionId: assignment.collectionId,
        productId: parentProduct.id,
      },
      transaction,
    });

    if (!exists) {
      await ProductCollection.create(
        {
          companyId,
          collectionId: assignment.collectionId,
          productId: parentProduct.id,
          sortOrder: assignment.sortOrder || 0,
          createdBy: userId || assignment.createdBy,
          updatedBy: userId || null,
        },
        { transaction }
      );
    }
  }
};

const moveSourceProductImagesToVariant = async ({
  companyId,
  sourceProductId,
  parentProductId,
  variantId,
  transaction,
}) => {
  const sourceImages = await ProductImage.findAll({
    where: {
      companyId,
      productId: sourceProductId,
      variantId: null,
    },
    transaction,
  });

  for (const image of sourceImages) {
    const duplicate = await ProductImage.findOne({
      where: {
        companyId,
        productId: parentProductId,
        variantId,
        mediaAssetId: image.mediaAssetId,
        imageRole: image.imageRole,
      },
      transaction,
    });

    if (duplicate) {
      await image.destroy({ transaction });
    } else {
      await image.update(
        {
          productId: parentProductId,
          variantId,
        },
        { transaction }
      );
    }
  }
};

exports.previewProductMerge = async ({ companyId, payload }) => {
  const result = await validateMerge({ companyId, payload });

  return {
    success: true,
    canExecute: result.canExecute,
    errors: result.errors,
    warnings: result.warnings,
    data: result.preview || null,
  };
};

exports.executeProductMerge = async ({ companyId, userId, payload }) =>
  sequelize.transaction(async (transaction) => {
    const validated = await validateMerge({
      companyId,
      payload,
      transaction,
    });

    if (!validated.canExecute) {
      throw createError(
        "Product merge validation failed.",
        422,
        "PRODUCT_MERGE_VALIDATION_FAILED",
        {
          errors: validated.errors,
          warnings: validated.warnings,
        }
      );
    }

    const {
      normalized,
      products,
      allVariants,
      mappingByVariantId,
      attributeLookup,
    } = validated;

    const parentProduct = products.find(
      (product) => product.id === normalized.parentProductId
    );

    if (!parentProduct) {
      throw createError(
        "Surviving parent product was not found.",
        404,
        "PRODUCT_MERGE_PARENT_NOT_FOUND"
      );
    }

    const redundantProducts = products.filter(
      (product) => product.id !== parentProduct.id
    );

    /* Archive redundant parent products first and free slug/parentSku. */
    for (const product of redundantProducts) {
      const suffix = product.id.replace(/-/g, "").slice(0, 8);

      await product.update(
        {
          slug: `${product.slug}--merged-${suffix}`.slice(0, 320),
          parentSku: null,
          status: "ARCHIVED",
          isSearchable: false,
          updatedBy: userId || null,
        },
        { transaction }
      );

      await ProductChannel.update(
        { isVisible: false },
        {
          where: { companyId, productId: product.id },
          transaction,
        }
      );
    }

    await parentProduct.update(
      {
        name: normalized.parent.name,
        slug: normalized.parent.slug,
        parentSku: normalized.parent.parentSku,
        productType: "VARIABLE",
        status: "ACTIVE",
        isSearchable: true,
        updatedBy: userId || null,
      },
      { transaction }
    );

    await copyCategoriesToParent({
      companyId,
      products,
      parentProduct,
      transaction,
    });

    await copyCollectionsToParent({
      companyId,
      userId,
      products,
      parentProduct,
      transaction,
    });

    const defaultVariantId =
      normalized.defaultVariantId ||
      parentProduct.variants?.[0]?.id ||
      allVariants[0]?.id;

    const movedVariantIds = [];

    for (let index = 0; index < allVariants.length; index += 1) {
      const variant = allVariants[index];
      const originalProductId = variant.productId;
      const mapping = mappingByVariantId.get(variant.id);

      if (!mapping) {
        throw createError(
          `Missing mapping for variant ${variant.id}.`,
          422,
          "PRODUCT_MERGE_MAPPING_MISSING"
        );
      }

      const variantKey = buildVariantKey(mapping.attributes);

      await variant.update(
        {
          productId: parentProduct.id,
          variantKey,
          isDefault: variant.id === defaultVariantId,
          sortOrder: index,
          updatedBy: userId || null,
        },
        { transaction }
      );

      await ProductVariantAttributeValue.destroy({
        where: {
          companyId,
          productVariantId: variant.id,
        },
        transaction,
      });

      for (let attrIndex = 0; attrIndex < mapping.attributes.length; attrIndex += 1) {
        const item = mapping.attributes[attrIndex];
        const option = attributeLookup.options.get(item.optionId);

        await ProductVariantAttributeValue.create(
          {
            companyId,
            productVariantId: variant.id,
            attributeId: item.attributeId,
            optionId: item.optionId,
            displayValue: option.label,
            sortOrder: Number.isFinite(Number(item.sortOrder))
              ? Number(item.sortOrder)
              : attrIndex,
          },
          { transaction }
        );
      }

      /* Existing variant-level images must point to the new parent product. */
      await ProductImage.update(
        { productId: parentProduct.id },
        {
          where: { companyId, variantId: variant.id },
          transaction,
        }
      );

      /* Convert each old one-SKU product's product media into child-variant media. */
      if (originalProductId !== parentProduct.id) {
        await moveSourceProductImagesToVariant({
          companyId,
          sourceProductId: originalProductId,
          parentProductId: parentProduct.id,
          variantId: variant.id,
          transaction,
        });
      }

      movedVariantIds.push(variant.id);
    }

    /* Historical OrderItem.productId values are intentionally not changed. */

    return {
      success: true,
      message: "Products merged successfully.",
      data: {
        parentProductId: parentProduct.id,
        parentName: normalized.parent.name,
        parentSlug: normalized.parent.slug,
        parentSku: normalized.parent.parentSku,
        defaultVariantId,
        movedVariantIds,
        archivedProductIds: redundantProducts.map((product) => product.id),
        warnings: validated.warnings,
      },
    };
  });
