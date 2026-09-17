const db = require(
    "../../../models"
  );
  
  const {
    clean,
    cleanUpper,
  } = require(
    "../productImport.utils"
  );
  
  /*
  |--------------------------------------------------------------------------
  | Constants
  |--------------------------------------------------------------------------
  */
  
  const EXECUTABLE_ACTIONS = [
    "CREATE",
    "UPDATE",
  ];
  
  /*
  |--------------------------------------------------------------------------
  | Generic Helpers
  |--------------------------------------------------------------------------
  */
  
  const hasValue = (
    value
  ) =>
    value !== undefined &&
    value !== null &&
    String(value).trim() !== "";

  const normalizeMediaImportMode = (value) => {
    const mode = cleanUpper(value || "MERGE");

    return mode === "REPLACE"
      ? "REPLACE"
      : "MERGE";
  };
  
  const createExecutionError = (
    message,
    code,
    statusCode = 400,
    details = null
  ) => {
    const error =
      new Error(message);
  
    error.code =
      code;
  
    error.statusCode =
      statusCode;
  
    error.details =
      details;
  
    return error;
  };
  
  const serializeError = (
    error
  ) => ({
    message:
      error?.message ||
      "Unknown execution error.",
  
    name:
      error?.name ||
      "Error",
  
    code:
      error?.code ||
      null,
  
    fields:
      error?.fields ||
      null,
  
    errors:
      Array.isArray(
        error?.errors
      )
        ? error.errors.map(
            (item) => ({
              message:
                item.message,
  
              path:
                item.path,
  
              value:
                item.value,
  
              type:
                item.type,
            })
          )
        : [],
  });
  
  /*
  |--------------------------------------------------------------------------
  | Product Payload Sanitization
  |--------------------------------------------------------------------------
  */
  
  const buildProductModelPayload = ({
    payload,
    companyId,
    userId,
    isCreate,
  }) => ({
    companyId,
  
    brandId:
      payload.brandId ||
      null,
  
    primaryCategoryId:
      payload.primaryCategoryId ||
      null,
  
    name:
      clean(
        payload.name
      ),
  
    slug:
      clean(
        payload.slug
      ),
  
    productType:
      cleanUpper(
        payload.productType ||
        "SIMPLE"
      ),
  
    status:
      cleanUpper(
        payload.status ||
        "DRAFT"
      ),
  
    parentSku:
      cleanUpper(
        payload.parentSku
      ) || null,
  

    erpId:
      clean(
        payload.erpId
      ) || null,

    isDirectDelivery:
      payload.isDirectDelivery ===
      true,

    directDeliverySupplierId:
      payload.isDirectDelivery ===
      true
        ? payload.directDeliverySupplierId ||
          null
        : null,

    directDeliveryLeadTimeDays:
      payload.isDirectDelivery ===
        true &&
      payload.directDeliveryLeadTimeDays !==
        null &&
      payload.directDeliveryLeadTimeDays !==
        undefined
        ? Number(
            payload.directDeliveryLeadTimeDays
          )
        : null,

    directDeliveryNote:
      payload.isDirectDelivery ===
      true
        ? clean(
            payload.directDeliveryNote
          ) || null
        : null,

    expressDeliveryEnabled:
      payload.expressDeliveryEnabled ===
      true,

    expressDeliveryHours:
      payload.expressDeliveryEnabled ===
      true
        ? Number(
            payload.expressDeliveryHours ||
            4
          )
        : null,

    deliveryMinDays:
      payload.deliveryMinDays ??
      null,

    deliveryMaxDays:
      payload.deliveryMaxDays ??
      null,

    deliveryNote:
      clean(
        payload.deliveryNote
      ) || null,

    shortDescription:
      payload.shortDescription ||
      null,
  
    description:
      payload.description ||
      null,
  
    features:
      Array.isArray(
        payload.features
      )
        ? payload.features
        : [],
  
    whatsInTheBox:
      Array.isArray(
        payload.whatsInTheBox
      )
        ? payload.whatsInTheBox
        : [],
  
    warrantyText:
      payload.warrantyText ||
      null,
  
    taxCode:
      payload.taxCode ||
      null,
  
    taxPercent:
      payload.taxPercent ??
      0,
  
    sortOrder:
      payload.sortOrder ??
      0,
  
    isFeatured:
      payload.isFeatured ??
      false,
  
    isSearchable:
      payload.isSearchable ??
      true,
  
    metaTitle:
      payload.metaTitle ||
      null,
  
    metaDescription:
      payload.metaDescription ||
      null,
  
    metaKeywords:
      payload.metaKeywords ||
      null,
  
    canonicalUrl:
      payload.canonicalUrl ||
      null,
  
    ...(isCreate
      ? {
          createdBy:
            userId,
        }
      : {}),
  
    updatedBy:
      userId,
  });
  
  /*
  |--------------------------------------------------------------------------
  | Variant Payload Sanitization
  |--------------------------------------------------------------------------
  */
  
  const buildVariantModelPayload = ({
    variant,
    companyId,
    productId,
    userId,
    isCreate,
  }) => ({
    companyId,
  
    productId,
  
    sku:
      cleanUpper(
        variant.sku
      ),
  
    barcode:
      clean(
        variant.barcode
      ) || null,
  
    name:
      clean(
        variant.name
      ),
  
    variantKey:
      clean(
        variant.variantKey ||
        "DEFAULT"
      ),
  
    isDefault:
      variant.isDefault ??
      false,
  
    status:
      cleanUpper(
        variant.status ||
        "DRAFT"
      ),
  
    weight:
      variant.weight ??
      null,
  
    weightUnit:
      cleanUpper(
        variant.weightUnit
      ) || null,
  
    length:
      variant.length ??
      null,
  
    width:
      variant.width ??
      null,
  
    height:
      variant.height ??
      null,
  
    dimensionUnit:
      cleanUpper(
        variant.dimensionUnit
      ) || null,
  
    sortOrder:
      variant.sortOrder ??
      0,
  
    ...(isCreate
      ? {
          createdBy:
            userId,
        }
      : {}),
  
    updatedBy:
      userId,
  });
  
  /*
  |--------------------------------------------------------------------------
  | Product Create / Update
  |--------------------------------------------------------------------------
  */
  
  const findExistingProduct = async ({
    companyId,
    parentSku,
    transaction,
  }) => {
    if (!parentSku) {
      return null;
    }
  
    return db.Product.findOne({
      where: {
        companyId,
        parentSku,
      },
  
      transaction,
  
      lock:
        transaction.LOCK.UPDATE,
    });
  };
  
  const createProduct = async ({
    companyId,
    userId,
    payload,
    transaction,
  }) =>
    db.Product.create(
      buildProductModelPayload({
        payload,
        companyId,
        userId,
        isCreate:
          true,
      }),
      {
        transaction,
      }
    );
  
  const updateProduct = async ({
    product,
    companyId,
    userId,
    payload,
    transaction,
  }) => {
    const updateValues = {
      ...payload,
      updatedBy:
        userId,
    };

    delete updateValues.companyId;
    delete updateValues.categoryIds;
    delete updateValues.categories;
    delete updateValues.collectionIds;
    delete updateValues.collections;
    delete updateValues.channels;
    delete updateValues.attributeValues;
    delete updateValues.mediaImportMode;
    delete updateValues.images;
    delete updateValues.variants;

    await product.update(
      updateValues,
      {
        transaction,
      }
    );
  
    return product;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Product Categories
  |--------------------------------------------------------------------------
  */
  
  const replaceProductCategories =
    async ({
      companyId,
      productId,
      categories,
      transaction,
    }) => {
      await db.ProductCategory.destroy({
        where: {
          companyId,
          productId,
        },
  
        transaction,
      });
  
      if (
        !Array.isArray(
          categories
        ) ||
        categories.length ===
          0
      ) {
        return [];
      }
  
      const rows =
        categories.map(
          (
            category,
            index
          ) => ({
            companyId,
  
            productId,
  
            categoryId:
              category.categoryId,
  
            isPrimary:
              category.isPrimary ??
              false,
  
            /*
             * ProductCategory model uses displayOrder,
             * not sortOrder.
             */
            displayOrder:
              category.displayOrder ??
              category.sortOrder ??
              index,
          })
        );
  
      return db.ProductCategory.bulkCreate(
        rows,
        {
          transaction,
        }
      );
    };
  
  /*
  |--------------------------------------------------------------------------
  | Product Collections
  |--------------------------------------------------------------------------
  */
  
  const replaceProductCollections =
    async ({
      companyId,
      productId,
      collections,
      userId,
      transaction,
    }) => {
      await db.ProductCollection.destroy({
        where: {
          companyId,
          productId,
        },
  
        transaction,
      });
  
      if (
        !Array.isArray(
          collections
        ) ||
        collections.length ===
          0
      ) {
        return [];
      }
  
      const rows =
        collections.map(
          (
            collection,
            index
          ) => ({
            companyId,
  
            productId,
  
            collectionId:
              collection.collectionId,
  
            sortOrder:
              collection.sortOrder ??
              index,
  
            createdBy:
              userId,
  
            updatedBy:
              userId,
          })
        );
  
      return db.ProductCollection.bulkCreate(
        rows,
        {
          transaction,
        }
      );
    };
  
  /*
  |--------------------------------------------------------------------------
  | Product Attribute Values
  |--------------------------------------------------------------------------
  */
  
  const replaceProductAttributeValues =
    async ({
      companyId,
      productId,
      attributeValues,
      transaction,
    }) => {
      await db.ProductAttributeValue.destroy({
        where: {
          companyId,
          productId,
        },
  
        transaction,
      });
  
      if (
        !Array.isArray(
          attributeValues
        ) ||
        attributeValues.length ===
          0
      ) {
        return [];
      }
  
      const rows =
        attributeValues.map(
          (value) => ({
            companyId,
  
            productId,
  
            attributeId:
              value.attributeId,
  
            optionId:
              value.optionId ||
              null,
  
            textValue:
              value.textValue ??
              null,
  
            numberValue:
              value.numberValue ??
              null,
  
            booleanValue:
              value.booleanValue ??
              null,
  
            dateValue:
              value.dateValue ??
              null,
  
            jsonValue:
              value.jsonValue ??
              null,
  
            displayValue:
              value.displayValue ??
              null,
          })
        );
  
      return db.ProductAttributeValue.bulkCreate(
        rows,
        {
          transaction,
        }
      );
    };
  
  /*
  |--------------------------------------------------------------------------
  | Product Channels
  |--------------------------------------------------------------------------
  */
  
  const replaceProductChannels =
    async ({
      companyId,
      productId,
      channels,
      transaction,
    }) => {
      await db.ProductChannel.destroy({
        where: {
          companyId,
          productId,
        },
  
        transaction,
      });
  
      if (
        !Array.isArray(
          channels
        ) ||
        channels.length ===
          0
      ) {
        return [];
      }
  
      const rows =
        channels.map(
          (channel) => ({
            companyId,
  
            productId,
  
            channelCode:
              cleanUpper(
                channel.channelCode
              ),
  
            isVisible:
              channel.isVisible ??
              true,
  
            publishStatus:
              cleanUpper(
                channel.publishStatus ||
                "DRAFT"
              ),
  
            publishedAt:
              cleanUpper(
                channel.publishStatus
              ) === "PUBLISHED"
                ? (
                    channel.publishedAt ||
                    new Date()
                  )
                : null,
  
            channelTitle:
              channel.channelTitle ||
              null,
  
            channelDescription:
              channel.channelDescription ||
              null,
          })
        );
  
      return db.ProductChannel.bulkCreate(
        rows,
        {
          transaction,
        }
      );
    };


    /*
|--------------------------------------------------------------------------
| Product Images
|--------------------------------------------------------------------------
*/

const syncProductImages =
  async ({
    companyId,
    productId,
    images,
    mediaImportMode = "MERGE",
    transaction,
  }) => {
    const mode =
      normalizeMediaImportMode(
        mediaImportMode
      );

    const normalizedImages =
      Array.isArray(images)
        ? images.filter(
            (image) =>
              image &&
              image.mediaAssetId
          )
        : [];

    if (mode === "REPLACE") {
      await db.ProductImage.destroy({
        where: {
          companyId,
          productId,
          variantId: null,
        },
        transaction,
      });

      if (
        normalizedImages.length === 0
      ) {
        return [];
      }

      return db.ProductImage.bulkCreate(
        normalizedImages.map(
          (image) => ({
            companyId,
            productId,
            variantId: null,
            mediaAssetId:
              image.mediaAssetId,
            imageRole:
              cleanUpper(
                image.imageRole ||
                "GALLERY"
              ),
            title:
              image.title || null,
            altText:
              image.altText || null,
            displayOrder:
              image.displayOrder ?? 0,
          })
        ),
        { transaction }
      );
    }

    if (
      normalizedImages.length === 0
    ) {
      return [];
    }

    const results = [];

    for (
      const image of normalizedImages
    ) {
      const existingImage =
        await db.ProductImage.findOne({
          where: {
            companyId,
            productId,
            variantId: null,
            mediaAssetId:
              image.mediaAssetId,
          },
          transaction,
          lock:
            transaction?.LOCK?.UPDATE,
        });

      const imagePayload = {
        companyId,
        productId,
        variantId: null,
        mediaAssetId:
          image.mediaAssetId,
        imageRole:
          cleanUpper(
            image.imageRole ||
            "GALLERY"
          ),
        title:
          image.title || null,
        altText:
          image.altText || null,
        displayOrder:
          image.displayOrder ?? 0,
      };

      if (existingImage) {
        await existingImage.update(
          imagePayload,
          { transaction }
        );

        results.push(existingImage);
      } else {
        results.push(
          await db.ProductImage.create(
            imagePayload,
            { transaction }
          )
        );
      }
    }

    return results;
  };

const replaceProductImages =
  async (args) =>
    syncProductImages({
      ...args,
      mediaImportMode: "REPLACE",
    });

  /*
  |--------------------------------------------------------------------------
  | Existing Variant Resolution
  |--------------------------------------------------------------------------
  */
  
  const findExistingVariant = async ({
    companyId,
    productId,
    sku,
    transaction,
  }) => {
    if (!sku) {
      return null;
    }
  
    return db.ProductVariant.findOne({
      where: {
        companyId,
        productId,
        sku,
      },
  
      transaction,
  
      lock:
        transaction.LOCK.UPDATE,
    });
  };
  
  /*
  |--------------------------------------------------------------------------
  | Variant Attribute Values
  |--------------------------------------------------------------------------
  */
  
  const replaceVariantAttributeValues =
    async ({
      companyId,
      productVariantId,
      attributeValues,
      transaction,
    }) => {
      await db.ProductVariantAttributeValue.destroy({
        where: {
          companyId,
          productVariantId,
        },
  
        transaction,
      });
  
      if (
        !Array.isArray(
          attributeValues
        ) ||
        attributeValues.length ===
          0
      ) {
        return [];
      }
  
      const rows =
        attributeValues.map(
          (
            value,
            index
          ) => ({
            companyId,
  
            productVariantId,
  
            attributeId:
              value.attributeId,
  
            optionId:
              value.optionId,
  
            displayValue:
              value.displayValue,
  
            sortOrder:
              value.sortOrder ??
              index,
          })
        );
  
      return db
        .ProductVariantAttributeValue
        .bulkCreate(
          rows,
          {
            transaction,
          }
        );
    };
  
  /*
  |--------------------------------------------------------------------------
  | Variant Channels
  |--------------------------------------------------------------------------
  */
  
  const replaceVariantChannels =
    async ({
      companyId,
      productVariantId,
      channels,
      transaction,
    }) => {
      await db.ProductVariantChannel.destroy({
        where: {
          companyId,
          productVariantId,
        },
  
        transaction,
      });
  
      if (
        !Array.isArray(
          channels
        ) ||
        channels.length ===
          0
      ) {
        return [];
      }
  
      const rows =
        channels.map(
          (channel) => ({
            companyId,
  
            productVariantId,
  
            channelCode:
              cleanUpper(
                channel.channelCode
              ),
  
            isVisible:
              channel.isVisible ??
              true,
          })
        );
  
      return db.ProductVariantChannel.bulkCreate(
        rows,
        {
          transaction,
        }
      );
    };
  
  /*
  |--------------------------------------------------------------------------
  | Variant Prices
  |--------------------------------------------------------------------------
  */
  
  const replaceVariantPrices =
    async ({
      companyId,
      productVariantId,
      prices,
      userId,
      transaction,
    }) => {
      /*
       * CSV controls the imported price rows for this variant.
       * Existing rows for the variant are replaced.
       */
      await db.ProductVariantPrice.destroy({
        where: {
          companyId,
          productVariantId,
        },
  
        transaction,
      });
  
      if (
        !Array.isArray(
          prices
        ) ||
        prices.length ===
          0
      ) {
        return [];
      }
  
      const rows =
        prices.map(
          (price) => ({
            companyId,
  
            productVariantId,
  
            priceListId:
              price.priceListId,
  
            regularPrice:
              price.regularPrice,
  
            sellingPrice:
              price.sellingPrice,
  
            compareAtPrice:
              price.compareAtPrice ??
              null,
  
            costPrice:
              price.costPrice ??
              null,
  
            minimumQuantity:
              price.minimumQuantity ??
              1,
  
            maximumQuantity:
              price.maximumQuantity ??
              null,
  
            validFrom:
              price.validFrom ??
              null,
  
            validUntil:
              price.validUntil ??
              null,
  
            priority:
              price.priority ??
              100,
  
            isActive:
              price.isActive ??
              true,
  
            createdBy:
              userId,
  
            updatedBy:
              userId,
          })
        );
  
      return db.ProductVariantPrice.bulkCreate(
        rows,
        {
          transaction,
        }
      );
    };


    /*
|--------------------------------------------------------------------------
| Variant Images
|--------------------------------------------------------------------------
*/

const syncVariantImages =
  async ({
    companyId,
    productVariantId,
    productId,
    images,
    mediaImportMode = "MERGE",
    transaction,
  }) => {
    const mode =
      normalizeMediaImportMode(
        mediaImportMode
      );

    const normalizedImages =
      Array.isArray(images)
        ? images.filter(
            (image) =>
              image &&
              image.mediaAssetId
          )
        : [];

    if (mode === "REPLACE") {
      await db.ProductImage.destroy({
        where: {
          companyId,
          productId,
          variantId:
            productVariantId,
        },
        transaction,
      });

      if (
        normalizedImages.length === 0
      ) {
        return [];
      }

      return db.ProductImage.bulkCreate(
        normalizedImages.map(
          (image) => ({
            companyId,
            productId,
            variantId:
              productVariantId,
            mediaAssetId:
              image.mediaAssetId,
            imageRole:
              cleanUpper(
                image.imageRole ||
                "GALLERY"
              ),
            title:
              image.title || null,
            altText:
              image.altText || null,
            displayOrder:
              image.displayOrder ?? 0,
          })
        ),
        { transaction }
      );
    }

    if (
      normalizedImages.length === 0
    ) {
      return [];
    }

    const results = [];

    for (
      const image of normalizedImages
    ) {
      const existingImage =
        await db.ProductImage.findOne({
          where: {
            companyId,
            productId,
            variantId:
              productVariantId,
            mediaAssetId:
              image.mediaAssetId,
          },
          transaction,
          lock:
            transaction?.LOCK?.UPDATE,
        });

      const imagePayload = {
        companyId,
        productId,
        variantId:
          productVariantId,
        mediaAssetId:
          image.mediaAssetId,
        imageRole:
          cleanUpper(
            image.imageRole ||
            "GALLERY"
          ),
        title:
          image.title || null,
        altText:
          image.altText || null,
        displayOrder:
          image.displayOrder ?? 0,
      };

      if (existingImage) {
        await existingImage.update(
          imagePayload,
          { transaction }
        );

        results.push(existingImage);
      } else {
        results.push(
          await db.ProductImage.create(
            imagePayload,
            { transaction }
          )
        );
      }
    }

    return results;
  };

const replaceVariantImages =
  async (args) =>
    syncVariantImages({
      ...args,
      mediaImportMode: "REPLACE",
    });

  /*
  |--------------------------------------------------------------------------
  | Create / Update One Variant
  |--------------------------------------------------------------------------
  */
  
  const executeVariant = async ({
    companyId,
    productId,
    variantPayload,
    userId,
    mediaImportMode = "MERGE",
    transaction,
  }) => {
    const sku =
      cleanUpper(
        variantPayload.sku
      );
  
    if (!sku) {
      throw createExecutionError(
        "Variant SKU is required during import execution.",
        "VARIANT_SKU_REQUIRED"
      );
    }
  
    const existingVariant =
      await findExistingVariant({
        companyId,
        productId,
        sku,
        transaction,
      });
  
    let variant;
  
    if (existingVariant) {
      await existingVariant.update(
        buildVariantModelPayload({
          variant:
            variantPayload,
  
          companyId,
  
          productId,
  
          userId,
  
          isCreate:
            false,
        }),
        {
          transaction,
        }
      );
  
      variant =
        existingVariant;
    } else {
      variant =
        await db.ProductVariant.create(
          buildVariantModelPayload({
            variant:
              variantPayload,
  
            companyId,
  
            productId,
  
            userId,
  
            isCreate:
              true,
          }),
          {
            transaction,
          }
        );
    }
  
    if (
      Object.prototype.hasOwnProperty.call(
        variantPayload,
        "attributeValues"
      )
    ) {
    await replaceVariantAttributeValues({
      companyId,
  
      productVariantId:
        variant.id,
  
      attributeValues:
        variantPayload.attributeValues ||
        [],
  
      transaction,
    });
    }
  
    if (
      Object.prototype.hasOwnProperty.call(
        variantPayload,
        "channels"
      )
    ) {
    await replaceVariantChannels({
      companyId,
  
      productVariantId:
        variant.id,
  
      channels:
        variantPayload.channels ||
        [],
  
      transaction,
    });
    }
  
    if (
      Object.prototype.hasOwnProperty.call(
        variantPayload,
        "prices"
      )
    ) {
    await replaceVariantPrices({
      companyId,
  
      productVariantId:
        variant.id,
  
      prices:
        variantPayload.prices ||
        [],
  
      userId,
  
      transaction,
    });
    }

    const variantMediaImportMode =


      normalizeMediaImportMode(


        variantPayload.mediaImportMode ||


        mediaImportMode ||


        "MERGE"


      );



    if (
      Object.prototype.hasOwnProperty.call(
        variantPayload,
        "images"
      )
    ) {
    await syncVariantImages({


      companyId,


      productVariantId:


        variant.id,


      productId,


      images:


        variantPayload.images || [],


      mediaImportMode:


        variantMediaImportMode,


      transaction,


    });
    }


    
  
    return {
      id:
        variant.id,
  
      sku:
        variant.sku,
  
      action:
        existingVariant
          ? "UPDATE"
          : "CREATE",
  
      attributeValueCount:
        variantPayload
          .attributeValues
          ?.length || 0,
  
      channelCount:
        variantPayload
          .channels
          ?.length || 0,
  
      priceCount:
        variantPayload
          .prices
          ?.length || 0,
    };
  };
  
  /*
  |--------------------------------------------------------------------------
  | Execute Variants
  |--------------------------------------------------------------------------
  */
  
  const executeVariants = async ({
    companyId,
    productId,
    variants,
    userId,
    mediaImportMode = "MERGE",
    transaction,
  }) => {
    const results = [];
  
    for (
      const variantPayload of
      variants || []
    ) {
      const result =
        await executeVariant({
          companyId,
  
          productId,
  
          variantPayload,
  
          userId,

          mediaImportMode,
  
          transaction,
        });
  
      results.push(
        result
      );
    }
  
    return results;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Execute One Product
  |--------------------------------------------------------------------------
  */
  
  const executeProductImport = async ({
    companyId,
    userId,
    productImport,
    transaction,
  }) => {
    const parentSku =
      cleanUpper(
        productImport.parentSku
      );
  
    if (
      productImport.valid !==
      true
    ) {
      return {
        parentSku,
  
        success:
          false,
  
        skipped:
          true,
  
        action:
          "SKIP",
  
        errors:
          productImport.validation
            ?.errors || [
            "Product is invalid.",
          ],
  
        warnings:
          productImport.validation
            ?.warnings || [],
      };
    }
  
    if (
      !EXECUTABLE_ACTIONS.includes(
        productImport.action
      )
    ) {
      return {
        parentSku,
  
        success:
          true,
  
        skipped:
          true,
  
        action:
          productImport.action ||
          "SKIP",
  
        errors:
          [],
  
        warnings:
          productImport.validation
            ?.warnings || [],
      };
    }
  
    const payload =
      productImport.action ===
      "UPDATE"
        ? productImport.updatePayload
        : productImport.createPayload;
  
    if (!payload) {
      throw createExecutionError(
        `Execution payload is missing for product "${parentSku}".`,
        "PRODUCT_PAYLOAD_MISSING"
      );
    }
  
    let product;
  
    let actualAction =
      productImport.action;
  
    if (
      productImport.action ===
      "UPDATE"
    ) {
      product =
        await findExistingProduct({
          companyId,
          parentSku,
          transaction,
        });
  
      if (!product) {
        throw createExecutionError(
          `Product "${parentSku}" no longer exists and cannot be updated.`,
          "PRODUCT_NOT_FOUND",
          409
        );
      }
  
      product =
        await updateProduct({
          product,
  
          companyId,
  
          userId,
  
          payload,
  
          transaction,
        });
    } else {
      const existingProduct =
        await findExistingProduct({
          companyId,
          parentSku,
          transaction,
        });
  
      if (existingProduct) {
        throw createExecutionError(
          `Product "${parentSku}" was created after preview and now already exists.`,
          "PRODUCT_ALREADY_EXISTS",
          409
        );
      }
  
      product =
        await createProduct({
          companyId,
  
          userId,
  
          payload,
  
          transaction,
        });
  
      actualAction =
        "CREATE";
    }
  
    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "categories"
      )
    ) {
    await replaceProductCategories({
      companyId,
  
      productId:
        product.id,
  
      categories:
        payload.categories ||
        productImport.associations
          ?.categories ||
        [],
  
      transaction,
    });
    }
  
    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "collections"
      )
    ) {
    await replaceProductCollections({
      companyId,
  
      productId:
        product.id,
  
      collections:
        payload.collections ||
        productImport.associations
          ?.collections ||
        [],
  
      userId,
  
      transaction,
    });
    }
  
    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "attributeValues"
      )
    ) {
    await replaceProductAttributeValues({
      companyId,
  
      productId:
        product.id,
  
      attributeValues:
        payload.attributeValues ||
        [],
  
      transaction,
    });
    }
  
    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "channels"
      )
    ) {
    await replaceProductChannels({
      companyId,
  
      productId:
        product.id,
  
      channels:
        payload.channels ||
        [],
  
      transaction,
    });
    }


    const mediaImportMode =
      normalizeMediaImportMode(
        payload.mediaImportMode ||
        "MERGE"
      );

    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "images"
      )
    ) {
    await syncProductImages({
      companyId,
      productId:
        product.id,
      images:
        payload.images || [],
      mediaImportMode,
      transaction,
    });
    }
  
    const variantResults =
      await executeVariants({
        companyId,
  
        productId:
          product.id,
  
        variants:
          payload.variants ||
          [],
  
        userId,

        mediaImportMode,
  
        transaction,
      });
  
    return {
      parentSku,
  
      productId:
        product.id,
  
      success:
        true,
  
      skipped:
        false,
  
      action:
        actualAction,
  
      variantCount:
        variantResults.length,
  
      variants:
        variantResults,
  
      categoryCount:
        (
          payload.categories ||
          productImport.associations
            ?.categories ||
          []
        ).length,
  
      collectionCount:
        (
          payload.collections ||
          productImport.associations
            ?.collections ||
          []
        ).length,
  
      channelCount:
        payload.channels
          ?.length || 0,
  
      attributeValueCount:
        payload.attributeValues
          ?.length || 0,
  
      priceCount:
        variantResults.reduce(
          (
            total,
            variant
          ) =>
            total +
            (
              variant.priceCount ||
              0
            ),
          0
        ),
  
      errors:
        [],
  
      warnings:
        productImport.validation
          ?.warnings || [],
    };
  };
  
  /*
  |--------------------------------------------------------------------------
  | Execution Preconditions
  |--------------------------------------------------------------------------
  */
  
  const validateExecutionRequest = ({
    companyId,
    userId,
    preview,
  }) => {
    const errors = [];
  
    if (!companyId) {
      errors.push(
        "companyId is required."
      );
    }
  
    if (!userId) {
      errors.push(
        "userId is required."
      );
    }
  
    if (
      !preview ||
      typeof preview !==
        "object"
    ) {
      errors.push(
        "A valid product import preview is required."
      );
  
      return errors;
    }
  
    if (
      !Array.isArray(
        preview.products
      )
    ) {
      errors.push(
        "Preview products must be an array."
      );
    }
  
    if (
      preview.companyId &&
      preview.companyId !==
        companyId
    ) {
      errors.push(
        "The preview belongs to another company."
      );
    }
  
    if (
      preview.validation
        ?.errors
        ?.length
    ) {
      errors.push(
        "The preview contains global validation errors and cannot be executed."
      );
    }
  
    return errors;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Execution Summary
  |--------------------------------------------------------------------------
  */
  
  const buildExecutionSummary = (
    results
  ) =>
    results.reduce(
      (
        summary,
        result
      ) => {
        summary.total +=
          1;
  
        if (
          result.success &&
          !result.skipped
        ) {
          summary.succeeded +=
            1;
        }
  
        if (
          result.skipped
        ) {
          summary.skipped +=
            1;
        }
  
        if (
          !result.success &&
          !result.skipped
        ) {
          summary.failed +=
            1;
        }
  
        if (
          result.action ===
          "CREATE" &&
          result.success
        ) {
          summary.created +=
            1;
        }
  
        if (
          result.action ===
          "UPDATE" &&
          result.success
        ) {
          summary.updated +=
            1;
        }
  
        summary.variants +=
          result.variantCount ||
          0;
  
        summary.prices +=
          result.priceCount ||
          0;
  
        summary.errors +=
          result.errors
            ?.length || 0;
  
        summary.warnings +=
          result.warnings
            ?.length || 0;
  
        return summary;
      },
      {
        total:
          0,
  
        succeeded:
          0,
  
        failed:
          0,
  
        skipped:
          0,
  
        created:
          0,
  
        updated:
          0,
  
        variants:
          0,
  
        prices:
          0,
  
        errors:
          0,
  
        warnings:
          0,
      }
    );
  
  /*
  |--------------------------------------------------------------------------
  | Main Execution Service
  |--------------------------------------------------------------------------
  */
  
  const executeProductImportPreview =
    async ({
      companyId,
  
      userId,
  
      preview,
  
      continueOnError =
        true,
    }) => {
      const requestErrors =
        validateExecutionRequest({
          companyId,
          userId,
          preview,
        });
  
      if (
        requestErrors.length
      ) {
        throw createExecutionError(
          requestErrors.join(
            " "
          ),
          "INVALID_PRODUCT_IMPORT_EXECUTION_REQUEST",
          400,
          requestErrors
        );
      }
  
      const results = [];
  
      for (
        const productImport of
        preview.products
      ) {
        /*
         * Invalid or non-executable records do not require a
         * database transaction.
         */
        if (
          productImport.valid !==
            true ||
          !EXECUTABLE_ACTIONS.includes(
            productImport.action
          )
        ) {
          const skippedResult =
            await executeProductImport({
              companyId,
  
              userId,
  
              productImport,
  
              transaction:
                null,
            });
  
          results.push(
            skippedResult
          );
  
          continue;
        }
  
        try {
          /*
           * One transaction per product means a failed product
           * rolls back fully without undoing successful products
           * when continueOnError is enabled.
           */
          const result =
            await db.sequelize.transaction(
              async (
                transaction
              ) =>
                executeProductImport({
                  companyId,
  
                  userId,
  
                  productImport,
  
                  transaction,
                })
            );
  
          results.push(
            result
          );
        } catch (
          error
        ) {
          const failedResult = {
            parentSku:
              productImport.parentSku,
  
            productId:
              null,
  
            success:
              false,
  
            skipped:
              false,
  
            action:
              productImport.action,
  
            variantCount:
              0,
  
            variants:
              [],
  
            categoryCount:
              0,
  
            collectionCount:
              0,
  
            channelCount:
              0,
  
            attributeValueCount:
              0,
  
            priceCount:
              0,
  
            errors: [
              serializeError(
                error
              ),
            ],
  
            warnings:
              productImport
                .validation
                ?.warnings || [],
          };
  
          results.push(
            failedResult
          );
  
          if (
            continueOnError !==
            true
          ) {
            throw createExecutionError(
              `Product import stopped at "${productImport.parentSku}".`,
              "PRODUCT_IMPORT_EXECUTION_FAILED",
              500,
              {
                failedProduct:
                  failedResult,
  
                completedProducts:
                  results,
              }
            );
          }
        }
      }
  
      const summary =
        buildExecutionSummary(
          results
        );
  
      return {
        success:
          summary.failed ===
          0,
  
        partiallySuccessful:
          summary.succeeded >
            0 &&
          summary.failed >
            0,
  
        companyId,
  
        importMode:
          preview.importMode,
  
        continueOnError,
  
        executedAt:
          new Date(),
  
        summary,
  
        products:
          results,
      };
    };
  
  /*
  |--------------------------------------------------------------------------
  | Exports
  |--------------------------------------------------------------------------
  */
  
  module.exports = {
    executeProductImportPreview,
  
    executeProductImport,
  
    executeVariants,
  
    executeVariant,
  
    createProduct,
  
    updateProduct,
  
    findExistingProduct,
  
    findExistingVariant,
  
    replaceProductCategories,
  
    replaceProductCollections,
  
    replaceProductAttributeValues,
  
    replaceProductChannels,
  
    replaceVariantAttributeValues,
  
    replaceVariantChannels,
  
    replaceVariantPrices,
  
    buildProductModelPayload,
  
    buildVariantModelPayload,
  
    buildExecutionSummary,
  
    validateExecutionRequest,
  
    serializeError,

    replaceProductImages,

    replaceVariantImages,

    syncProductImages,

    syncVariantImages,

    normalizeMediaImportMode,

  };