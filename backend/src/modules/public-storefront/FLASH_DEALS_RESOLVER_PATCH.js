/*
 * FLASH DEALS RESOLVER PATCH
 * ==========================
 *
 * Add this block to publicStorefront.service.js AFTER the
 * PRODUCT_CAROUSEL helper functions and BEFORE:
 *
 *   const getPublicStorefrontPage = async ({
 *
 * This resolver intentionally reuses the Product Carousel helpers:
 *
 *   findStorefrontPriceList()
 *   findProductCarouselProducts()
 *   buildPublicProduct()
 *   toPlainObject()
 *
 * Therefore, apply the Product Carousel homepage package first.
 */

const resolveFlashDealsSections =
  async ({
    sections,
    companyId,
    channel,
    apiBaseUrl,
    now,
  }) => {
    const hasFlashDeals =
      (sections || []).some(
        (section) =>
          String(
            section?.type?.code ||
              ""
          )
            .trim()
            .toUpperCase() ===
          "FLASH_DEALS"
      );

    if (!hasFlashDeals) {
      return sections || [];
    }

    const priceListModel =
      await findStorefrontPriceList({
        companyId,
        channel,
        now,
      });

    const priceList =
      priceListModel
        ? toPlainObject(
            priceListModel
          )
        : null;

    const resolvedSections = [];

    for (
      const section of
      sections || []
    ) {
      const sectionTypeCode =
        String(
          section?.type?.code ||
            ""
        )
          .trim()
          .toUpperCase();

      if (
        sectionTypeCode !==
        "FLASH_DEALS"
      ) {
        resolvedSections.push(
          section
        );

        continue;
      }

      const content =
        section.content &&
        typeof section.content ===
          "object" &&
        !Array.isArray(
          section.content
        )
          ? section.content
          : {};

      const settings =
        section.settings &&
        typeof section.settings ===
          "object" &&
        !Array.isArray(
          section.settings
        )
          ? section.settings
          : {};

      const startAt =
        content.startAt
          ? new Date(
              content.startAt
            )
          : null;

      const endAt =
        content.endAt
          ? new Date(
              content.endAt
            )
          : null;

      const hasValidStart =
        startAt &&
        !Number.isNaN(
          startAt.getTime()
        );

      const hasValidEnd =
        endAt &&
        !Number.isNaN(
          endAt.getTime()
        );

      const dealStatus =
        hasValidEnd &&
        endAt.getTime() <=
          now.getTime()
          ? "ENDED"
          : hasValidStart &&
              startAt.getTime() >
                now.getTime()
            ? "UPCOMING"
            : "ACTIVE";

      /*
       * Promotion source remains isolated until PromotionPicker
       * and promotion-product resolution are implemented.
       */
      const sourceType =
        String(
          settings.sourceType ||
            "MANUAL"
        )
          .trim()
          .toUpperCase();

      const productModels =
        sourceType ===
        "PROMOTION"
          ? []
          : await findProductCarouselProducts({
              companyId,
              content,
              settings: {
                ...settings,

                sourceType,
              },

              priceListId:
                priceList?.id ||
                null,

              now,
            });

      const products =
        productModels.map(
          (productModel) =>
            buildPublicProduct(
              productModel,
              apiBaseUrl
            )
        );

      resolvedSections.push({
        ...section,

        content: {
          ...content,

          productIdsResolved:
            products,

          dealStatus,

          startAt:
            hasValidStart
              ? startAt.toISOString()
              : null,

          endAt:
            hasValidEnd
              ? endAt.toISOString()
              : null,

          resolvedPriceList:
            priceList
              ? {
                  id:
                    priceList.id,

                  code:
                    priceList.code,

                  name:
                    priceList.name,

                  currencyCode:
                    priceList.currencyCode,

                  isTaxInclusive:
                    priceList.isTaxInclusive,
                }
              : null,
        },
      });
    }

    return resolvedSections;
  };

/*
 * PIPELINE CHANGE
 * ===============
 *
 * Replace the final Product Carousel resolver:
 *
 *   const sections =
 *     await resolveProductCarouselSections(...)
 *
 * with:
 *
 *   const productCarouselResolvedSections =
 *     await resolveProductCarouselSections({
 *       sections: featuredResolvedSections,
 *       companyId: company.id,
 *       channel: normalizedChannel,
 *       apiBaseUrl,
 *       now,
 *     });
 *
 *   console.log("Product carousels resolved");
 *
 *   const sections =
 *     await resolveFlashDealsSections({
 *       sections: productCarouselResolvedSections,
 *       companyId: company.id,
 *       channel: normalizedChannel,
 *       apiBaseUrl,
 *       now,
 *     });
 *
 *   console.log("Flash deals resolved");
 */
