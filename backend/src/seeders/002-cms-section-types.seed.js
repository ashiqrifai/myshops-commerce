const sectionTypes = [
  {
    name: "Announcement Bar",
  
    code: "ANNOUNCEMENT_BAR",
  
    description:
      "Global announcement strip displayed above the storefront header.",
  
    category: "GLOBAL",
  
    icon: "Megaphone",
  
    supportedChannels: [
      "WEBSITE",
    ],
  
    displayOrder: 10,
  
    defaultSettings: {
      backgroundColor: "#28ABB5",
  
      textColor: "#FFFFFF",
  
      height: 34,
  
      alignment: "DISTRIBUTED",
  
      behavior: "STATIC",
  
      dismissible: false,
  
      desktopColumns: 4,
  
      hideOnMobile: false,
    },
  
    defaultContent: {
      items: [
        {
          id: "delivery",
          text:
            "Free Delivery in Dubai, Abu Dhabi & Sharjah",
          linkText: "",
          linkUrl: "",
          isActive: true,
        },
        {
          id: "offer",
          text:
            "Use code SAVE10 for 10% off mobiles",
          linkText: "",
          linkUrl: "",
          isActive: true,
        },
        {
          id: "uae-pride",
          text:
            "🇦🇪 OUR PRIDE OUR UAE",
          linkText: "",
          linkUrl: "",
          isActive: true,
        },
        {
          id: "express",
          text:
            "2-Hour Delivery",
          linkText: "",
          linkUrl: "",
          isActive: true,
        },
      ],
    },
  },
  
    {
      name: "Header",
    
      code: "HEADER",
    
      description:
        "Global storefront header containing logo, category selector, search and customer actions.",
    
      category: "GLOBAL",
    
      icon: "PanelTop",
    
      supportedChannels: [
        "WEBSITE",
      ],
    
      displayOrder: 20,
    
      defaultSettings: {
        sticky: true,
    
        transparent: false,
    
        showLogo: true,
    
        showCategorySelector: true,
    
        showSearch: true,
    
        showLogin: true,
    
        showOrders: true,
    
        showWishlist: true,
    
        showCart: true,
    
        showActionLabels: true,
    
        showMobileSearch: true,
    
        desktopHeight: 72,
    
        mobileHeight: 64,
    
        logoWidth: 150,
    
        contentMaxWidth: 1440,
    
        backgroundColor: "#FFFFFF",
    
        textColor: "#111318",
    
        borderColor: "#D8DEE3",
    
        searchBackgroundColor: "#E8F7F8",
    
        searchButtonColor: "#28ABB5",
    
        stickyOffset: 0,
      },
    
      defaultContent: {
        searchPlaceholder:
          "Search products, brands and categories",
    
        categorySelectorLabel:
          "All",
    
        loginLabel:
          "Log in",
    
        ordersLabel:
          "Orders",
    
        wishlistLabel:
          "Wishlist",
    
        cartLabel:
          "Cart",
    
        accountUrl:
          "/account",
    
        ordersUrl:
          "/account/orders",
    
        wishlistUrl:
          "/wishlist",
    
        cartUrl:
          "/cart",
      },
    },
  
    {
      name:
        "Navigation",
  
      code:
        "NAVIGATION",
  
      description:
        "Configurable simple, dropdown or mega-menu navigation.",
  
      category:
        "GLOBAL",
  
      icon:
        "Menu",
  
      supportedChannels: [
        "WEBSITE",
        "KIOSK",
      ],
  
      displayOrder: 30,
  
      defaultSettings: {
        menuType:
          "MEGA_MENU",
  
        sticky: false,
  
        showImages:
          true,
  
        showIcons:
          true,
  
        columns: 4,
      },
  
      defaultContent: {
        menuId: null,
      },
    },
  
    {
      name:
        "Hero Carousel",
  
      code:
        "HERO_CAROUSEL",
  
      description:
        "Large responsive carousel with separate website, mobile and kiosk media.",
  
      category:
        "HERO",
  
      icon:
        "GalleryHorizontal",
  
      supportedChannels: [
        "WEBSITE",
        "KIOSK",
      ],
  
      displayOrder: 40,
  
      defaultSettings: {
        autoplay: true,
  
        autoplayInterval:
          5000,
  
        showArrows:
          true,
  
        showDots:
          true,
  
        loop: true,
  
        desktopHeight:
          560,
  
        tabletHeight:
          500,
  
        mobileHeight:
          520,
  
        smallMobileHeight:
          480,
  
        desktopOverlayOpacity:
          0.3,
  
        mobileOverlayOpacity:
          0.42,
  
        contentMaxWidth:
          720,
      },
  
      defaultContent: {
        slides: [],
      },
    },
  
    {
      name:
        "Hero Banner",

      code:
        "HERO_BANNER",

      description:
        "Single responsive hero banner for products, categories, brands or campaigns.",

      category:
        "HERO",

      icon:
        "Image",

      supportedChannels: [
        "WEBSITE",
        "KIOSK",
      ],

      displayOrder: 50,

      defaultSettings: {
        contentAlignment:
          "LEFT",

        overlayEnabled:
          false,

        overlayOpacity:
          0.25,

        desktopHeight:
          560,

        mobileHeight:
          420,

        kioskHeight:
          720,
      },

      defaultContent: {
        desktopAssetId:
          null,

        mobileAssetId:
          null,

        kioskAssetId:
          null,

        title: "",

        subtitle: "",

        description: "",

        buttonLabel: "",

        buttonUrl: "",
      },
    },

    {
      name:
        "Category Grid",

      code:
        "CATEGORY_GRID",

      description:
        "Grid of manually selected or dynamically loaded product categories.",

      category:
        "CATALOG",

      icon:
        "LayoutGrid",

      supportedChannels: [
        "WEBSITE",
        "KIOSK",
      ],

      displayOrder: 60,

      defaultSettings: {
        sourceType:
          "MANUAL",

        columnsDesktop:
          6,

        columnsTablet:
          4,

        columnsMobile:
          2,

        columnsKiosk:
          3,

        showImage:
          true,

        showName:
          true,

        showProductCount:
          false,

        cardStyle:
          "ROUNDED",
      },

      defaultContent: {
        title:
          "Shop by Category",

        subtitle:
          "",

        categoryIds:
          [],
      },
    },

    /*
 * Add this object to your CMS section-type seed array.
 */
{
  name: "Promotion Banner Grid",
  code: "PROMOTION_BANNER_GRID",
  description:
    "Responsive promotional artwork arranged with a dynamic 12-column grid.",
  category: "MARKETING",
  icon: "Grid3X3",
  supportedChannels: [
    "WEBSITE",
    "KIOSK",
  ],
  displayOrder: 15,

  defaultSettings: {
    layoutPreset: "FEATURED_LEFT",
    heightMode: "UNIFORM",
    mobileDisplayMode: "STACK",

    desktopGap: 24,
    tabletGap: 16,
    mobileGap: 12,

    desktopHeight: 420,
    tabletHeight: 320,
    mobileHeight: 280,

    borderRadius: 16,
    sectionPaddingTop: 24,
    sectionPaddingBottom: 24,
  },

  defaultContent: {
    title: "",
    subtitle: "",

    items: [
      {
        id: "banner-1",
        desktopAssetId: null,
        tabletAssetId: null,
        mobileAssetId: null,
        altText: "",
        linkUrl: "",
        openInNewTab: false,
        desktopSpan: 6,
        tabletSpan: 6,
        mobileSpan: 1,
        desktopHeight: 420,
        tabletHeight: 320,
        mobileHeight: 280,
        imageFit: "COVER",
        imagePosition: "CENTER",
      },

      {
        id: "banner-2",
        desktopAssetId: null,
        tabletAssetId: null,
        mobileAssetId: null,
        altText: "",
        linkUrl: "",
        openInNewTab: false,
        desktopSpan: 3,
        tabletSpan: 3,
        mobileSpan: 1,
        desktopHeight: 420,
        tabletHeight: 320,
        mobileHeight: 280,
        imageFit: "COVER",
        imagePosition: "CENTER",
      },

      {
        id: "banner-3",
        desktopAssetId: null,
        tabletAssetId: null,
        mobileAssetId: null,
        altText: "",
        linkUrl: "",
        openInNewTab: false,
        desktopSpan: 3,
        tabletSpan: 3,
        mobileSpan: 1,
        desktopHeight: 420,
        tabletHeight: 320,
        mobileHeight: 280,
        imageFit: "COVER",
        imagePosition: "CENTER",
      },
    ],
  },
},

{
  name: "Pre-Booking",
  code: "PRE_BOOKING",
  description: "Premium pre-booking section for upcoming products, launch dates, deposits and countdowns.",
  category: "CATALOG",
  icon: "CalendarClock",
  supportedChannels: ["WEBSITE", "KIOSK"],
  displayOrder: 95,
  defaultSettings: {
    sourceType: "MANUAL",
    layout: "SIDE_BANNER",
    showLaunchDate: true,
    showBookingDeadline: true,
    showDeposit: true,
    showCountdown: true,
    showAvailabilityBadge: true,
    showNavigation: true,
    itemsDesktop: 4,
    itemsTablet: 3,
    itemsMobile: 1,
    itemsKiosk: 4,
    maximumProducts: 8,
    bannerPosition: "LEFT",
    backgroundColor: "#F4F7FA",
    textColor: "#111827",
    accentColor: "#28ABB5",
    borderRadius: 18
  },
  defaultContent: {
    badge: "Coming Soon",
    title: "Pre-Book the Latest Devices",
    subtitle: "Reserve upcoming products before official launch.",
    buttonLabel: "View all pre-booking products",
    buttonUrl: "/pre-booking",
    openInNewTab: false,
    desktopAssetId: null,
    mobileAssetId: null,
    productIds: [],
    categoryId: null,
    brandId: null,
    bookingStartAt: null,
    bookingEndAt: null
  }
},
    {
      name:
        "Featured Product Grid",

      code:
        "FEATURED_PRODUCT_GRID",

      description:
        "Responsive product grid populated manually or from featured, new arrival, sale, category or brand sources.",

      category:
        "CATALOG",

      icon:
        "PackageSearch",

      supportedChannels: [
        "WEBSITE",
        "KIOSK",
      ],

      displayOrder: 70,

      defaultSettings: {
        sourceType:
          "MANUAL",

        sortBy:
          "MANUAL",

        maximumProducts:
          10,

        columnsDesktop:
          5,

        columnsTablet:
          3,

        columnsMobile:
          2,

        columnsKiosk:
          4,

        showImage:
          true,

        showBrand:
          true,

        showProductName:
          true,

        showPrice:
          true,

        showOriginalPrice:
          true,

        showDiscountBadge:
          true,

        showRating:
          false,

        showWishlist:
          true,

        showAddToCart:
          true,

        showStockStatus:
          false,

        cardStyle:
          "ROUNDED",
      },

      defaultContent: {
        title:
          "Featured Products",

        subtitle:
          "",

        productIds:
          [],

        categoryId:
          null,

        brandId:
          null,
      },
    },
    {
      name:
        "Collection Grid",
    
      code:
        "COLLECTION_GRID",
    
      description:
        "Grid of manually selected product collections such as Flash Deals, New Arrivals, Best Sellers and Gaming.",
    
      category:
        "CATALOG",
    
      icon:
        "LayoutGrid",
    
      supportedChannels: [
        "WEBSITE",
        "KIOSK",
      ],
    
      displayOrder:
        65,
    
      defaultSettings: {
        sourceType:
          "MANUAL",
    
        columnsDesktop:
          4,
    
        columnsTablet:
          3,
    
        columnsMobile:
          2,
    
        columnsKiosk:
          4,
    
        showImage:
          true,
    
        showName:
          true,
    
        showDescription:
          false,
    
        showProductCount:
          true,
    
        cardStyle:
          "ROUNDED",
    
        imageFit:
          "COVER",
    
        sectionBackgroundColor:
          "transparent",
    
        cardBackgroundColor:
          "#FFFFFF",
    
        cardTextColor:
          "#111111",
      },
    
      defaultContent: {
        title:
          "Shop Collections",
    
        subtitle:
          "Explore our latest collections",
    
        collectionIds:
          [],
      },
    },
  ];
  
  const seedSectionType = async ({
    db,
    company,
    sectionType,
  }) => {
    const where = {
      companyId: company.id,
      code:
        sectionType.code,
    };
  
    const values = {
      companyId:
        company.id,
  
      ...sectionType,
  
      isActive:
        sectionType.isActive !==
        false,
    };
  
    const [
      existing,
      created,
    ] =
      await db.CmsSectionType.findOrCreate({
        where,
        defaults: values,
      });
  
    if (!created) {
      await existing.update(values);
    }
  
    return created
      ? "CREATED"
      : "UPDATED";
  };
  
  module.exports = {
    order: 20,
  
    name:
      "CMS section types",
  
    run: async ({
      db,
      context,
    }) => {
      const companyCode = String(
        context.companyCode ||
        "MYSHOPS"
      )
        .trim()
        .toUpperCase();
  
      const company =
        await db.Company.findOne({
          where: {
            code: companyCode,
            isActive: true,
          },
        });
  
      if (!company) {
        throw new Error(
          `Active company ${companyCode} was not found.`
        );
      }
  
      let createdCount = 0;
      let updatedCount = 0;
  
      for (
        const sectionType of
        sectionTypes
      ) {
        const status =
          await seedSectionType({
            db,
            company,
            sectionType,
          });
  
        if (
          status === "CREATED"
        ) {
          createdCount += 1;
        } else {
          updatedCount += 1;
        }
      }
  
      return {
        company:
          company.code,
  
        total:
          sectionTypes.length,
  
        created:
          createdCount,
  
        updated:
          updatedCount,
      };
    },
  };