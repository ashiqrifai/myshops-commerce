const db =
  require(
    "../../models"
  );

const AppError =
  require(
    "../../utils/AppError"
  );

const ALLOWED_ACTIVITY_TYPES =
  new Set([
    "SEARCH",
    "VIEW_PRODUCT",
    "VIEW_CATEGORY",
    "VIEW_BRAND",
    "VIEW_COLLECTION",
    "ADD_TO_CART",
    "ADD_TO_WISHLIST",
    "PURCHASE",
  ]);

const getCompanyByCode =
  async (
    companyCode
  ) => {
    const code =
      String(
        companyCode ||
          ""
      )
        .trim()
        .toUpperCase();

    if (!code) {
      throw new AppError(
        "Company code is required.",
        400,
        "COMPANY_CODE_REQUIRED"
      );
    }

    const company =
      await db.Company.findOne({
        where: {
          code,
          isActive:
            true,
        },
      });

    if (!company) {
      throw new AppError(
        "Storefront company was not found.",
        404,
        "STOREFRONT_COMPANY_NOT_FOUND"
      );
    }

    return company;
  };

const trackStorefrontActivity =
  async ({
    companyCode,
    customerId = null,
    visitorId = null,
    activityType,
    productId = null,
    variantId = null,
    categoryId = null,
    brandId = null,
    collectionId = null,
    searchQuery = null,
    quantity = null,
    source = null,
    pageUrl = null,
    referrer = null,
    channel = "WEBSITE",
    metadata = {},
  }) => {
    const company =
      await getCompanyByCode(
        companyCode
      );

    const normalizedActivityType =
      String(
        activityType ||
          ""
      )
        .trim()
        .toUpperCase();

    if (
      !ALLOWED_ACTIVITY_TYPES.has(
        normalizedActivityType
      )
    ) {
      throw new AppError(
        "Invalid storefront activity type.",
        400,
        "INVALID_STOREFRONT_ACTIVITY_TYPE"
      );
    }

    if (
      !customerId &&
      !visitorId
    ) {
      throw new AppError(
        "visitorId or customerId is required.",
        400,
        "VISITOR_OR_CUSTOMER_REQUIRED"
      );
    }

    const normalizedVisitorId =
      visitorId
        ? String(
            visitorId
          )
            .trim()
            .slice(
              0,
              120
            )
        : null;

    const normalizedSearchQuery =
      searchQuery
        ? String(
            searchQuery
          )
            .trim()
            .slice(
              0,
              500
            )
        : null;

    const normalizedSource =
      source
        ? String(
            source
          )
            .trim()
            .slice(
              0,
              100
            )
        : null;

    const normalizedPageUrl =
      pageUrl
        ? String(
            pageUrl
          )
            .trim()
            .slice(
              0,
              1000
            )
        : null;

    const normalizedReferrer =
      referrer
        ? String(
            referrer
          )
            .trim()
            .slice(
              0,
              1000
            )
        : null;

    const normalizedChannel =
      String(
        channel ||
          "WEBSITE"
      )
        .trim()
        .toUpperCase();

    return db.StorefrontActivity.create({
      companyId:
        company.id,

      customerId:
        customerId ||
        null,

      visitorId:
        normalizedVisitorId,

      activityType:
        normalizedActivityType,

      productId:
        productId ||
        null,

      variantId:
        variantId ||
        null,

      categoryId:
        categoryId ||
        null,

      brandId:
        brandId ||
        null,

      collectionId:
        collectionId ||
        null,

      searchQuery:
        normalizedSearchQuery,

      quantity:
        Number.isFinite(
          Number(
            quantity
          )
        )
          ? Number(
              quantity
            )
          : null,

      source:
        normalizedSource,

      pageUrl:
        normalizedPageUrl,

      referrer:
        normalizedReferrer,

      channel:
        normalizedChannel,

      metadata:
        metadata &&
        typeof metadata ===
          "object" &&
        !Array.isArray(
          metadata
        )
          ? metadata
          : {},
    });
  };

module.exports = {
  trackStorefrontActivity,
};