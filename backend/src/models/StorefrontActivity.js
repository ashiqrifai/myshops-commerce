const {
    DataTypes,
  } =
    require("sequelize");
  
  const sequelize =
    require("../config/database");
  
  /*
  |--------------------------------------------------------------------------
  | Storefront Activity
  |--------------------------------------------------------------------------
  |
  | Records customer/visitor behaviour used for:
  |
  | - Products For You
  | - Recently Viewed
  | - Brand preferences
  | - Category preferences
  | - Search intent
  | - Cart intent
  | - Wishlist intent
  | - Purchase preferences
  |
  |--------------------------------------------------------------------------
  */
  
  const StorefrontActivity =
    sequelize.define(
      "StorefrontActivity",
      {
        /*
        |--------------------------------------------------------------------------
        | Primary Key
        |--------------------------------------------------------------------------
        */
  
        id: {
          type:
            DataTypes.UUID,
  
          defaultValue:
            DataTypes.UUIDV4,
  
          primaryKey:
            true,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Company
        |--------------------------------------------------------------------------
        */
  
        companyId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            false,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Logged-in Customer
        |--------------------------------------------------------------------------
        |
        | Null when customer is browsing as guest.
        |
        |--------------------------------------------------------------------------
        */
  
        customerId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            true,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Anonymous Browser Visitor
        |--------------------------------------------------------------------------
        */
  
        visitorId: {
          type:
            DataTypes.STRING(
              120
            ),
  
          allowNull:
            true,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Activity Type
        |--------------------------------------------------------------------------
        */
  
        activityType: {
          type:
            DataTypes.ENUM(
              "SEARCH",
              "VIEW_PRODUCT",
              "VIEW_CATEGORY",
              "VIEW_BRAND",
              "VIEW_COLLECTION",
              "ADD_TO_CART",
              "ADD_TO_WISHLIST",
              "PURCHASE"
            ),
  
          allowNull:
            false,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Product
        |--------------------------------------------------------------------------
        */
  
        productId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            true,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Product Variant
        |--------------------------------------------------------------------------
        */
  
        variantId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            true,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Category
        |--------------------------------------------------------------------------
        */
  
        categoryId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            true,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Brand
        |--------------------------------------------------------------------------
        */
  
        brandId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            true,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Collection
        |--------------------------------------------------------------------------
        */
  
        collectionId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            true,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Search Query
        |--------------------------------------------------------------------------
        |
        | Example:
        | samsung s26 ultra
        |
        |--------------------------------------------------------------------------
        */
  
        searchQuery: {
          type:
            DataTypes.STRING(
              500
            ),
  
          allowNull:
            true,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Quantity
        |--------------------------------------------------------------------------
        |
        | Useful for cart / purchase behaviour.
        |
        |--------------------------------------------------------------------------
        */
  
        quantity: {
          type:
            DataTypes.INTEGER,
  
          allowNull:
            true,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Source
        |--------------------------------------------------------------------------
        |
        | Examples:
        |
        | HEADER_SEARCH
        | PRODUCT_PAGE
        | CATEGORY_PAGE
        | HOMEPAGE
        | CART
        | WISHLIST
        | CHECKOUT
        |
        |--------------------------------------------------------------------------
        */
  
        source: {
          type:
            DataTypes.STRING(
              100
            ),
  
          allowNull:
            true,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Page URL
        |--------------------------------------------------------------------------
        */
  
        pageUrl: {
          type:
            DataTypes.STRING(
              1000
            ),
  
          allowNull:
            true,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Referrer
        |--------------------------------------------------------------------------
        |
        | Useful later for campaign / traffic analysis.
        |
        |--------------------------------------------------------------------------
        */
  
        referrer: {
          type:
            DataTypes.STRING(
              1000
            ),
  
          allowNull:
            true,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Channel
        |--------------------------------------------------------------------------
        */
  
        channel: {
          type:
            DataTypes.STRING(
              30
            ),
  
          allowNull:
            false,
  
          defaultValue:
            "WEBSITE",
        },
  
        /*
        |--------------------------------------------------------------------------
        | Additional Metadata
        |--------------------------------------------------------------------------
        */
  
        metadata: {
          type:
            DataTypes.JSONB,
  
          allowNull:
            false,
  
          defaultValue:
            {},
        },
      },
      {
        tableName:
          "storefront_activities",
  
        timestamps:
          true,
  
        indexes: [
          /*
           * General company activity.
           */
          {
            fields: [
              "companyId",
            ],
          },
  
          /*
           * Logged-in customer activity.
           */
          {
            fields: [
              "customerId",
            ],
          },
  
          /*
           * Anonymous visitor activity.
           */
          {
            fields: [
              "visitorId",
            ],
          },
  
          /*
           * Activity type analytics.
           */
          {
            fields: [
              "activityType",
            ],
          },
  
          /*
           * Product preference.
           */
          {
            fields: [
              "productId",
            ],
          },
  
          /*
           * Variant preference.
           */
          {
            fields: [
              "variantId",
            ],
          },
  
          /*
           * Category preference.
           */
          {
            fields: [
              "categoryId",
            ],
          },
  
          /*
           * Brand preference.
           */
          {
            fields: [
              "brandId",
            ],
          },
  
          /*
           * Collection preference.
           */
          {
            fields: [
              "collectionId",
            ],
          },
  
          /*
           * Date based recommendation queries.
           */
          {
            fields: [
              "createdAt",
            ],
          },
  
          /*
           * Fast guest recommendation lookup.
           */
          {
            fields: [
              "companyId",
              "visitorId",
              "createdAt",
            ],
          },
  
          /*
           * Fast customer recommendation lookup.
           */
          {
            fields: [
              "companyId",
              "customerId",
              "createdAt",
            ],
          },
  
          /*
           * Product behaviour analytics.
           */
          {
            fields: [
              "companyId",
              "productId",
              "activityType",
            ],
          },
        ],
      }
    );
  
  module.exports =
    StorefrontActivity;