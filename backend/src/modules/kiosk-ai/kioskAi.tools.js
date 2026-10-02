const publicSearchService =
  require(
    "../public-storefront/publicSearch.service"
  );


/*
|--------------------------------------------------------------------------
| OpenAI tool definitions
|--------------------------------------------------------------------------
*/

const TOOL_DEFINITIONS = [
  {
    type:
      "function",

    name:
      "search_products",

    description:
      "Search the live MyShops product catalog. ALWAYS use this when the customer asks to find or see products, mentions a brand, model, category or product type, or asks for discounted products, promotions, offers, deals, sale products or special prices. Put brand/category/model/product wording into query. Set discountedOnly=true for discount, promotion, offer, deal, sale or special-price requests.",

    parameters: {
      type:
        "object",

      properties: {
        query: {
          type:
            "string",

          description:
            "The customer's product search, brand, model or product type. Examples: Samsung, iPhone 17 Pro, televisions, washing machines.",
        },

        brand: {
          type:
            "string",

          description:
            "Optional brand name when the customer specifies a brand. Examples: Ariston, Samsung, Bosch, Apple. Do not include the brand again in query when this parameter is used.",
        },

        discountedOnly: {
          type:
            "boolean",

          description:
            "Set true when the customer asks for discounted products, promotions, offers, deals, sale items or special prices.",
        },

        limit: {
          type:
            "integer",

          minimum:
            1,

          maximum:
            10,

          description:
            "Maximum number of products to return. Default 5.",
        },
      },

      required: [],

      additionalProperties:
        false,
    },
  },
];


/*
|--------------------------------------------------------------------------
| Argument parser
|--------------------------------------------------------------------------
*/

const parseArguments =
  value => {

    if (
      value &&
      typeof value ===
        "object"
    ) {
      return value;
    }


    if (
      typeof value !==
      "string"
    ) {
      return {};
    }


    try {

      return JSON.parse(
        value
      );

    } catch (
      error
    ) {

      const invalid =
        new Error(
          "Invalid AI tool arguments."
        );

      invalid.statusCode =
        400;

      throw invalid;
    }
  };


/*
|--------------------------------------------------------------------------
| AI product-search normalization
|--------------------------------------------------------------------------
|
| The storefront search intentionally performs literal matching.
| Customers speaking to the kiosk naturally use plural product
| types such as "washing machines" or "televisions".
|
| Normalize only the AI query so website search behaviour remains
| completely unchanged.
*/

const normalizeAiProductSearch =
  value => {

    const search =
      String(
        value ||
        ""
      )
        .trim();

    if (
      !search
    ) {
      return "";
    }

    const words =
      search.split(
        /\s+/
      );

    const lastIndex =
      words.length - 1;

    const lastWord =
      words[lastIndex];

    /*
     * Conservative plural normalization.
     *
     * Avoid changing short words or words ending in "ss".
     */
    if (
      lastWord &&
      lastWord.length >
        3 &&
      /s$/i.test(
        lastWord
      ) &&
      !/ss$/i.test(
        lastWord
      )
    ) {
      words[lastIndex] =
        lastWord.slice(
          0,
          -1
        );
    }

    return words.join(
      " "
    );
  };


/*
|--------------------------------------------------------------------------
| search_products
|--------------------------------------------------------------------------
*/

const executeSearchProducts =
  async ({
    arguments:
      rawArguments,

    apiBaseUrl,
    companyCode =
      "MYSHOPS",
  }) => {

    const args =
      parseArguments(
        rawArguments
      );


    const originalSearch =
      String(
        args.query ||
        ""
      )
        .trim();

    const search =
      normalizeAiProductSearch(
        originalSearch
      );


    const requestedBrand =
      String(
        args.brand ||
        ""
      )
        .trim();


    const discountedOnly =
      args.discountedOnly ===
      true;

    if (
      !search &&
      !requestedBrand &&
      !discountedOnly
    ) {

      const error =
        new Error(
          "Product search requires a query, brand or discountedOnly=true."
        );

      error.statusCode =
        400;

      throw error;
    }


    const limit =
      Math.min(
        Math.max(
          Number(
            args.limit ||
            5
          ),
          1
        ),
        10
      );


    const resolvedBrand =
      requestedBrand
        ? await publicSearchService
            .resolveBrandId({
              companyCode,
              brandName:
                requestedBrand,
            })
        : null;


    /*
     * A customer explicitly requested a brand that does
     * not exist in the live MyShops catalogue.
     *
     * Return an empty result rather than silently dropping
     * the brand filter and showing unrelated products.
     */
    if (
      requestedBrand &&
      !resolvedBrand
    ) {
      return {
        query:
          originalSearch,

        normalizedQuery:
          search,

        brand:
          requestedBrand,

        resolvedBrand:
          null,

        totalItems:
          0,

        shownCount:
          0,

        products:
          [],
      };
    }


    const result =
      await publicSearchService
        .searchProducts({
          companyCode,

          channel:
            "KIOSK",

          query: {
            q:
              search,

            page:
              1,

            pageSize:
              limit,

            discountedOnly,

            brandIds:
              resolvedBrand
                ?.id ||
              undefined,

            sort:
              "RELEVANCE",
          },

          apiBaseUrl,
        });


    const products =
      Array.isArray(
        result?.products
      )
        ? result.products
        : [];


    /*
     * Keep the model payload bounded.
     *
     * Return the product objects supplied by the
     * storefront search, but only for the requested
     * small result set.
     */
    const totalItems =
      Number(
        result
          ?.pagination
          ?.totalItems ??
        products.length
      );


    const compactProducts =
      products.map(
        product => {

          const media =
            product
              ?.image
              ?.mediaAsset;


          const kioskImage =
            Array.isArray(
              media
                ?.variants
            )
              ? media.variants.find(
                  variant =>
                    variant.variantType ===
                      "KIOSK" &&
                    variant.format ===
                      "webp"
                )
              : null;


          return {
            id:
              product.id,

            name:
              product.name,

            slug:
              product.slug,

            brand:
              product
                ?.brand
                ?.name ||
              null,

            category:
              product
                ?.primaryCategory
                ?.name ||
              null,

            price:
              product
                ?.price
                ?.sellingPrice ??
              null,

            regularPrice:
              product
                ?.price
                ?.regularPrice ??
              null,

            currency:
              product
                ?.price
                ?.currencyCode ||
              "AED",

            availability:
              product
                ?.availability
                ?.status ||
              null,

            availabilityMessage:
              product
                ?.availability
                ?.message ||
              null,

            quantity:
              product
                ?.availability
                ?.quantity ??
              null,

            imageUrl:
              kioskImage
                ?.publicUrl ||
              media
                ?.previewUrl ||
              media
                ?.thumbnailUrl ||
              media
                ?.publicUrl ||
              null,

            productUrl:
              product
                ?.productUrl ||
              `/products/${product.slug}`,
          };
        }
      );


    return {
      query:
        originalSearch,

      normalizedQuery:
        search,

      brand:
        requestedBrand ||
        null,

      resolvedBrand:
        resolvedBrand
          ? {
              id:
                resolvedBrand.id,

              name:
                resolvedBrand.name,

              slug:
                resolvedBrand.slug,
            }
          : null,

      totalItems,

      shownCount:
        compactProducts.length,

      hasMore:
        totalItems >
        compactProducts.length,

      products:
        compactProducts,

      viewAll: {
        query:
          search,

        label:
          totalItems >
          compactProducts.length
            ? `View all ${totalItems} products`
            : null,
      },
    };
  };


/*
|--------------------------------------------------------------------------
| Tool dispatcher
|--------------------------------------------------------------------------
*/

const executeTool =
  async ({
    name,
    arguments:
      rawArguments,
    apiBaseUrl,
    companyCode =
      "MYSHOPS",
  }) => {

    switch (
      name
    ) {

      case "search_products":

        return executeSearchProducts({
          arguments:
            rawArguments,

          apiBaseUrl,

          companyCode,
        });


      default: {

        const error =
          new Error(
            `Unknown AI tool: ${name}`
          );

        error.statusCode =
          400;

        throw error;
      }
    }
  };


module.exports = {
  TOOL_DEFINITIONS,
  executeTool,
};
