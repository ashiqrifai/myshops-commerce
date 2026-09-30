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
      "Search the live MyShops product catalog. Use this whenever the customer asks what products MyShops has, asks to see products, mentions a brand or product type, or asks for product availability options.",

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

      required: [
        "query",
      ],

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


    const search =
      String(
        args.query ||
        ""
      )
        .trim();


    if (
      !search
    ) {

      const error =
        new Error(
          "Product search query is required."
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
        search,

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
