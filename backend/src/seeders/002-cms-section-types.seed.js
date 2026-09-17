const sectionTypes = [
  {
    name: "AI Banner",
    code: "AI_BANNER",
    description: "Promotional entry point for the MyShops AI product assistant.",
    category: "AI",
    icon: "Bot",
    supportedChannels: [
      "WEBSITE",
      "KIOSK"
    ],
    defaultSettings: {
      "style": "CARD",
      "showVoiceButton": true,
      "showSuggestedPrompts": true
    },
    defaultContent: {
      "title": "Ask MyShops AI",
      "subtitle": "Tell us what you need and we’ll help you find the right electronics.",
      "buttonText": "Ask AI",
      "suggestedPrompts": []
    },
    validationSchema: null,
    isSystemType: true,
    displayOrder: 10,
    isActive: true,
  },
  {
    name: "Announcement Bar",
    code: "ANNOUNCEMENT_BAR",
    description:
      "Carousel-style announcement strip displayed above the storefront header.",
    category: "GLOBAL",
    icon: "Megaphone",
    supportedChannels: ["WEBSITE", "KIOSK"],
    displayOrder: 10,
    defaultSettings: {
      enabled: true,
      autoplay: true,
      autoplayDelayMs: 4000,
      transition: "FADE",
      height: 36,
      mobileHeight: 36,
      backgroundColor: "#28ABB5",
      textColor: "#FFFFFF",
      hideOnMobile: false,
    },
    defaultContent: {
      slides: [
        {
          id: "announcement-1",
          text: "Free Delivery in Dubai, Abu Dhabi & Sharjah",
          linkText: "",
          linkUrl: "",
          desktopImageUrl: "",
          mobileImageUrl: "",
          backgroundColor: "#28ABB5",
          textColor: "#FFFFFF",
          isActive: true,
        },
        {
          id: "announcement-2",
          text: "Use code SAVE10 for 10% off mobiles",
          linkText: "",
          linkUrl: "",
          desktopImageUrl: "",
          mobileImageUrl: "",
          backgroundColor: "#28ABB5",
          textColor: "#FFFFFF",
          isActive: true,
        },
      ],
    },
  },

  {
    name: "Kiosk AI Welcome",
    code: "KIOSK_AI_WELCOME",
    description: "Large touch-optimized AI welcome panel for the Android kiosk.",
    category: "KIOSK",
    icon: "MessageCircle",
    supportedChannels: [
      "KIOSK"
    ],
    defaultSettings: {
      "style": "LARGE_CARD",
      "showVoiceButton": true,
      "showKeyboardButton": true,
      "showSuggestedPrompts": true
    },
    defaultContent: {
      "title": "How can I help you today?",
      "subtitle": "Ask about products, features, compatibility or availability.",
      "suggestedPrompts": []
    },
    validationSchema: null,
    isSystemType: true,
    displayOrder: 10,
    isActive: true,
  },
  {
    name: "Promotion Banner",
    code: "PROMOTION_BANNER",
    description: "Responsive promotional banner with optional campaign link.",
    category: "MARKETING",
    icon: "RectangleHorizontal",
    supportedChannels: [
      "WEBSITE",
      "KIOSK"
    ],
    defaultSettings: {
      "width": "FULL",
      "borderRadius": 16,
      "contentAlignment": "LEFT"
    },
    defaultContent: {
      "title": "",
      "subtitle": "",
      "buttonUrl": "",
      "buttonText": "",
      "kioskImageAssetId": null,
      "mobileImageAssetId": null,
      "desktopImageAssetId": null
    },
    validationSchema: null,
    isSystemType: true,
    displayOrder: 10,
    isActive: true,
  },
  {
    name: "Promotion Banner Grid",
    code: "PROMOTION_BANNER_GRID",
    description: "Responsive promotional artwork arranged with a dynamic 12-column grid.",
    category: "MARKETING",
    icon: "Grid3X3",
    supportedChannels: [
      "WEBSITE",
      "KIOSK"
    ],
    defaultSettings: {
      "mobileGap": 12,
      "tabletGap": 16,
      "desktopGap": 24,
      "heightMode": "UNIFORM",
      "borderRadius": 16,
      "layoutPreset": "FEATURED_LEFT",
      "mobileHeight": 280,
      "tabletHeight": 320,
      "desktopHeight": 420,
      "mobileDisplayMode": "STACK",
      "sectionPaddingTop": 24,
      "sectionPaddingBottom": 24
    },
    defaultContent: {
      "items": [
        {
          "id": "banner-1",
          "altText": "",
          "linkUrl": "",
          "imageFit": "COVER",
          "mobileSpan": 1,
          "tabletSpan": 6,
          "desktopSpan": 6,
          "mobileHeight": 280,
          "openInNewTab": false,
          "tabletHeight": 320,
          "desktopHeight": 420,
          "imagePosition": "CENTER",
          "mobileAssetId": null,
          "tabletAssetId": null,
          "desktopAssetId": null
        },
        {
          "id": "banner-2",
          "altText": "",
          "linkUrl": "",
          "imageFit": "COVER",
          "mobileSpan": 1,
          "tabletSpan": 3,
          "desktopSpan": 3,
          "mobileHeight": 280,
          "openInNewTab": false,
          "tabletHeight": 320,
          "desktopHeight": 420,
          "imagePosition": "CENTER",
          "mobileAssetId": null,
          "tabletAssetId": null,
          "desktopAssetId": null
        },
        {
          "id": "banner-3",
          "altText": "",
          "linkUrl": "",
          "imageFit": "COVER",
          "mobileSpan": 1,
          "tabletSpan": 3,
          "desktopSpan": 3,
          "mobileHeight": 280,
          "openInNewTab": false,
          "tabletHeight": 320,
          "desktopHeight": 420,
          "imagePosition": "CENTER",
          "mobileAssetId": null,
          "tabletAssetId": null,
          "desktopAssetId": null
        }
      ],
      "title": "",
      "subtitle": ""
    },
    validationSchema: null,
    isSystemType: true,
    displayOrder: 15,
    isActive: true,
  },
  {
    name: "AI Recommendations",
    code: "AI_RECOMMENDATIONS",
    description: "AI-generated product recommendations for the current session or customer.",
    category: "AI",
    icon: "Sparkles",
    supportedChannels: [
      "WEBSITE",
      "KIOSK"
    ],
    defaultSettings: {
      "itemsKiosk": 3,
      "itemsMobile": 2,
      "itemsDesktop": 4,
      "maximumProducts": 8
    },
    defaultContent: {
      "title": "Recommended for You",
      "subtitle": ""
    },
    validationSchema: null,
    isSystemType: true,
    displayOrder: 20,
    isActive: true,
  },
  {
    name: "Category Carousel",
    code: "CATEGORY_CAROUSEL",
    description: "Horizontally scrolling category cards.",
    category: "CATALOG",
    icon: "PanelsTopLeft",
    supportedChannels: [
      "WEBSITE",
      "KIOSK"
    ],
    defaultSettings: {
      "autoplay": false,
      "showDots": false,
      "itemsKiosk": 3,
      "showArrows": true,
      "sourceType": "MANUAL",
      "itemsMobile": 2,
      "itemsTablet": 4,
      "itemsDesktop": 6
    },
    defaultContent: {
      "title": "Categories",
      "subtitle": "",
      "categoryIds": []
    },
    validationSchema: null,
    isSystemType: true,
    displayOrder: 20,
    isActive: true,
  },
  {
    name: "Header",
    code: "HEADER",
    description: "Global storefront header containing logo, category selector, search and customer actions.",
    category: "GLOBAL",
    icon: "PanelTop",
    supportedChannels: [
      "WEBSITE"
    ],
    defaultSettings: {
      "sticky": true,
      "showCart": true,
      "showLogo": true,
      "logoWidth": 150,
      "showLogin": true,
      "textColor": "#111318",
      "showOrders": true,
      "showSearch": true,
      "borderColor": "#D8DEE3",
      "transparent": false,
      "mobileHeight": 64,
      "showWishlist": true,
      "stickyOffset": 0,
      "desktopHeight": 72,
      "backgroundColor": "#FFFFFF",
      "contentMaxWidth": 1440,
      "showActionLabels": true,
      "showMobileSearch": true,
      "searchButtonColor": "#28ABB5",
      "showCategorySelector": true,
      "searchBackgroundColor": "#E8F7F8"
    },
    defaultContent: {
      "cartUrl": "/cart",
      "cartLabel": "Cart",
      "ordersUrl": "/account/orders",
      "accountUrl": "/account",
      "loginLabel": "Log in",
      "ordersLabel": "Orders",
      "wishlistUrl": "/wishlist",
      "wishlistLabel": "Wishlist",
      "searchPlaceholder": "Search products, brands and categories",
      "categorySelectorLabel": "All"
    },
    validationSchema: null,
    isSystemType: true,
    displayOrder: 20,
    isActive: true,
  },
  {
    name: "Kiosk Assistance Button",
    code: "KIOSK_ASSISTANCE_BUTTON",
    description: "Touch-friendly button for requesting assistance from store staff.",
    category: "KIOSK",
    icon: "BellRing",
    supportedChannels: [
      "KIOSK"
    ],
    defaultSettings: {
      "style": "FLOATING",
      "position": "BOTTOM_RIGHT",
      "requireConfirmation": true
    },
    defaultContent: {
      "buttonText": "Request Assistance",
      "confirmationText": "A salesperson has been notified."
    },
    validationSchema: null,
    isSystemType: true,
    displayOrder: 20,
    isActive: true,
  },
  {
    name: "Rich Text",
    code: "RICH_TEXT",
    description: "Configurable heading, body text and call-to-action content.",
    category: "MARKETING",
    icon: "Text",
    supportedChannels: [
      "WEBSITE",
      "KIOSK"
    ],
    defaultSettings: {
      "maxWidth": "900px",
      "alignment": "LEFT",
      "backgroundColor": "#FFFFFF"
    },
    defaultContent: {
      "html": "",
      "title": "",
      "subtitle": "",
      "buttonUrl": "",
      "buttonText": ""
    },
    validationSchema: null,
    isSystemType: true,
    displayOrder: 20,
    isActive: true,
  },
  {
    name: "Brand Carousel",
    code: "BRAND_CAROUSEL",
    description: "Configurable carousel of electronics brands.",
    category: "CATALOG",
    icon: "Badge",
    supportedChannels: [
      "WEBSITE",
      "KIOSK"
    ],
    defaultSettings: {
      "autoplay": true,
      "showNames": false,
      "itemsKiosk": 4,
      "sourceType": "MANUAL",
      "itemsMobile": 3,
      "itemsTablet": 5,
      "itemsDesktop": 8
    },
    defaultContent: {
      "title": "Top Brands",
      "brandIds": [],
      "subtitle": ""
    },
    validationSchema: null,
    isSystemType: true,
    displayOrder: 30,
    isActive: true,
  },
  {
    name: "Hero Video",
    code: "HERO_VIDEO",
    description: "Full-width hero video with optional text and call-to-action.",
    category: "HERO",
    icon: "Video",
    supportedChannels: [
      "WEBSITE",
      "KIOSK"
    ],
    defaultSettings: {
      "loop": true,
      "muted": true,
      "autoplay": true,
      "showControls": false,
      "contentAlignment": "LEFT"
    },
    defaultContent: {
      "title": "",
      "subtitle": "",
      "buttonUrl": "",
      "buttonText": "",
      "videoAssetId": null,
      "posterImageAssetId": null
    },
    validationSchema: null,
    isSystemType: true,
    displayOrder: 30,
    isActive: true,
  },
  {
    name: "Kiosk QR Handoff",
    code: "KIOSK_QR_HANDOFF",
    description: "Allows the customer to transfer the kiosk session or product selection to mobile.",
    category: "KIOSK",
    icon: "QrCode",
    supportedChannels: [
      "KIOSK"
    ],
    defaultSettings: {
      "expirySeconds": 300,
      "showSessionSummary": true
    },
    defaultContent: {
      "title": "Continue on your phone",
      "subtitle": "Scan the QR code to continue shopping."
    },
    validationSchema: null,
    isSystemType: true,
    displayOrder: 30,
    isActive: true,
  },
  {
    name: "Navigation",
    code: "NAVIGATION",
    description: "Configurable simple, dropdown or mega-menu navigation.",
    category: "GLOBAL",
    icon: "Menu",
    supportedChannels: [
      "WEBSITE",
      "KIOSK"
    ],
    defaultSettings: {
      "sticky": false,
      "columns": 4,
      "menuType": "MEGA_MENU",
      "showIcons": true,
      "showImages": true
    },
    defaultContent: {
      "menuId": null
    },
    validationSchema: null,
    isSystemType: true,
    displayOrder: 30,
    isActive: true,
  },
  {
    name: "Video",
    code: "VIDEO",
    description: "Embedded or uploaded marketing and product video.",
    category: "MARKETING",
    icon: "PlaySquare",
    supportedChannels: [
      "WEBSITE",
      "KIOSK"
    ],
    defaultSettings: {
      "loop": false,
      "muted": false,
      "autoplay": false,
      "provider": "UPLOAD",
      "aspectRatio": "16:9",
      "showControls": true
    },
    defaultContent: {
      "title": "",
      "description": "",
      "videoAssetId": null,
      "posterImageAssetId": null
    },
    validationSchema: null,
    isSystemType: true,
    displayOrder: 30,
    isActive: true,
  },
  {
    name: "Hero Carousel",
    code: "HERO_CAROUSEL",
    description: "Large responsive carousel with separate website, mobile and kiosk media.",
    category: "HERO",
    icon: "GalleryHorizontal",
    supportedChannels: [
      "WEBSITE",
      "KIOSK"
    ],
    defaultSettings: {
      "loop": true,
      "autoplay": true,
      "showDots": true,
      "showArrows": true,
      "mobileHeight": 520,
      "tabletHeight": 500,
      "desktopHeight": 560,
      "contentMaxWidth": 720,
      "autoplayInterval": 5000,
      "smallMobileHeight": 480,
      "mobileOverlayOpacity": 0.42,
      "desktopOverlayOpacity": 0.3
    },
    defaultContent: {
      "slides": []
    },
    validationSchema: null,
    isSystemType: true,
    displayOrder: 40,
    isActive: true,
  },
  {
    name: "Product Carousel",
    code: "PRODUCT_CAROUSEL",
    description: "Carousel populated from featured, category, brand, manual or other product sources.",
    category: "CATALOG",
    icon: "ShoppingBag",
    supportedChannels: [
      "WEBSITE",
      "KIOSK"
    ],
    defaultSettings: {
      "sortBy": "MANUAL",
      "itemsKiosk": 3,
      "showArrows": true,
      "sourceType": "FEATURED",
      "itemsMobile": 2,
      "itemsTablet": 3,
      "itemsDesktop": 5,
      "showWishlist": true,
      "showAddToCart": true,
      "maximumProducts": 12
    },
    defaultContent: {
      "title": "Featured Products",
      "brandId": null,
      "subtitle": "",
      "categoryId": null,
      "productIds": []
    },
    validationSchema: null,
    isSystemType: true,
    displayOrder: 40,
    isActive: true,
  },
  {
    name: "Store Features",
    code: "STORE_FEATURES",
    description: "Displays trust and service benefits such as delivery, payment and warranty.",
    category: "MARKETING",
    icon: "ShieldCheck",
    supportedChannels: [
      "WEBSITE",
      "KIOSK"
    ],
    defaultSettings: {
      "showIcons": true,
      "columnsKiosk": 2,
      "columnsMobile": 2,
      "columnsDesktop": 4
    },
    defaultContent: {
      "items": []
    },
    validationSchema: null,
    isSystemType: true,
    displayOrder: 40,
    isActive: true,
  },
  {
    name: "Flash Deals",
    code: "FLASH_DEALS",
    description: "Time-limited product promotion section with countdown.",
    category: "CATALOG",
    icon: "Zap",
    supportedChannels: [
      "WEBSITE",
      "KIOSK"
    ],
    defaultSettings: {
      "itemsKiosk": 3,
      "itemsMobile": 2,
      "itemsTablet": 3,
      "itemsDesktop": 5,
      "showCountdown": true,
      "maximumProducts": 10
    },
    defaultContent: {
      "endAt": null,
      "title": "Flash Deals",
      "subtitle": "",
      "campaignId": null
    },
    validationSchema: null,
    isSystemType: true,
    displayOrder: 50,
    isActive: true,
  },
  {
    name: "Hero Promo Grid",
    code: "HERO_PROMO_GRID",
    description: "Main carousel with two side promos and brand strip.",
    category: "HERO",
    icon: "PanelsTopLeft",
    supportedChannels: ["WEBSITE", "KIOSK"],
    displayOrder: 15,
    defaultSettings: { autoplay: true, autoplayDelayMs: 5000, showArrows: true, showDots: true, heroHeightDesktop: 450, heroHeightMobile: 300, showBrandStrip: true },
    defaultContent: { slides: [], promoCards: [], brandItems: [] },
  },

  {
    name: "Hero Banner",
    code: "HERO_BANNER",
    description: "Single responsive hero banner for products, categories, brands or campaigns.",
    category: "HERO",
    icon: "Image",
    supportedChannels: [
      "WEBSITE",
      "KIOSK"
    ],
    defaultSettings: {
      "kioskHeight": 720,
      "mobileHeight": 420,
      "desktopHeight": 560,
      "overlayEnabled": false,
      "overlayOpacity": 0.25,
      "contentAlignment": "LEFT"
    },
    defaultContent: {
      "title": "",
      "subtitle": "",
      "buttonUrl": "",
      "buttonLabel": "",
      "description": "",
      "kioskAssetId": null,
      "mobileAssetId": null,
      "desktopAssetId": null
    },
    validationSchema: null,
    isSystemType: true,
    displayOrder: 50,
    isActive: true,
  },
  {
    name: "Newsletter",
    code: "NEWSLETTER",
    description: "Customer newsletter subscription section.",
    category: "MARKETING",
    icon: "Mail",
    supportedChannels: [
      "WEBSITE"
    ],
    defaultSettings: {
      "alignment": "CENTER",
      "showNameField": false,
      "backgroundColor": "#F4F4F4"
    },
    defaultContent: {
      "title": "Stay updated",
      "subtitle": "Receive the latest products, offers and electronics news.",
      "buttonText": "Subscribe"
    },
    validationSchema: null,
    isSystemType: true,
    displayOrder: 50,
    isActive: true,
  },

  {
    name:
      "Visit a MyShops Store",
  
    code:
      "STORE_VISIT_CAROUSEL",
  
    description:
      "Fixed store-visit content panel with a responsive carousel of MyShops store images and locations.",
  
    category:
      "MARKETING",
  
    icon:
      "Store",
  
    supportedChannels: [
      "WEBSITE",
      "KIOSK",
    ],
  
    defaultSettings: {
      autoplay:
        true,
  
      autoplayInterval:
        5000,
  
      showArrows:
        true,
  
      showDots:
        true,
  
      loop:
        true,
  
      desktopHeight:
        430,
  
      mobileImageHeight:
        280,
  
      leftWidthPercent:
        32,
  
      borderRadius:
        16,
  
      backgroundColor:
        "#F4F5F5",
  
      textColor:
        "#111111",
  
      imageFit:
        "COVER",
    },
  
    defaultContent: {
      eyebrow:
        "VISIT US",
  
      title:
        "Visit a MyShops Store",
  
      description:
        "Experience the latest technology in person at a MyShops store near you.",
  
      buttonLabel:
        "Find a Store",
  
      buttonUrl:
        "/stores",
  
      stores:
        [],
    },
  
    validationSchema:
      null,
  
    isSystemType:
      true,
  
    displayOrder:
      55,
  
    isActive:
      true,
  },
  {
    name: "Category Grid",
    code: "CATEGORY_GRID",
    description: "Grid of manually selected or dynamically loaded product categories.",
    category: "CATALOG",
    icon: "LayoutGrid",
    supportedChannels: [
      "WEBSITE",
      "KIOSK"
    ],
    defaultSettings: {
      "showName": true,
      "cardStyle": "ROUNDED",
      "showImage": true,
      "sourceType": "MANUAL",
      "columnsKiosk": 3,
      "columnsMobile": 2,
      "columnsTablet": 4,
      "columnsDesktop": 6,
      "showProductCount": false
    },
    defaultContent: {
      "title": "Shop by Category",
      "subtitle": "",
      "categoryIds": []
    },
    validationSchema: null,
    isSystemType: true,
    displayOrder: 60,
    isActive: true,
  },
  {
    name: "Collection Grid",
    code: "COLLECTION_GRID",
    description: "Grid of manually selected product collections such as Flash Deals, New Arrivals, Best Sellers and Gaming.",
    category: "CATALOG",
    icon: "LayoutGrid",
    supportedChannels: [
      "WEBSITE",
      "KIOSK"
    ],
    defaultSettings: {
      "imageFit": "COVER",
      "showName": true,
      "cardStyle": "ROUNDED",
      "showImage": true,
      "sourceType": "MANUAL",
      "columnsKiosk": 4,
      "cardTextColor": "#111111",
      "columnsMobile": 2,
      "columnsTablet": 3,
      "columnsDesktop": 4,
      "showDescription": false,
      "showProductCount": true,
      "cardBackgroundColor": "#FFFFFF",
      "sectionBackgroundColor": "transparent"
    },
    defaultContent: {
      "title": "Shop Collections",
      "subtitle": "Explore our latest collections",
      "collectionIds": []
    },
    validationSchema: null,
    isSystemType: true,
    displayOrder: 65,
    isActive: true,
  },
  {
    name: "Featured Product Grid",
    code: "FEATURED_PRODUCT_GRID",
    description: "Responsive product grid populated manually or from featured, new arrival, sale, category or brand sources.",
    category: "CATALOG",
    icon: "PackageSearch",
    supportedChannels: [
      "WEBSITE",
      "KIOSK"
    ],
    defaultSettings: {
      "sortBy": "MANUAL",
      "cardStyle": "ROUNDED",
      "showBrand": true,
      "showImage": true,
      "showPrice": true,
      "showRating": false,
      "sourceType": "MANUAL",
      "columnsKiosk": 4,
      "showWishlist": true,
      "columnsMobile": 2,
      "columnsTablet": 3,
      "showAddToCart": true,
      "columnsDesktop": 5,
      "maximumProducts": 10,
      "showProductName": true,
      "showStockStatus": false,
      "showDiscountBadge": true,
      "showOriginalPrice": true
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
    
      /*
      |--------------------------------------------------------------------------
      | View All
      |--------------------------------------------------------------------------
      */
    
      showViewAll:
        true,
    
      viewAllLabel:
        "View all products",
    
      viewAllType:
        "FEATURED",
    
      viewAllTargetId:
        null,
    
      viewAllUrl:
        "",
    
      viewAllNewTab:
        false,
    },
    validationSchema: null,
    isSystemType: true,
    displayOrder: 70,
    isActive: true,
  },
  {
    name: "Pre-Booking",
  
    code: "PRE_BOOKING",
  
    description:
      "Campaign-driven pre-booking section with CMS-controlled banner, countdown, CTA and product carousel.",
  
    category:
      "MARKETING",
  
    icon:
      "CalendarClock",
  
    supportedChannels: [
      "WEBSITE",
      "KIOSK",
    ],
  
    defaultSettings: {
      layout:
        "SIDE_BANNER",
  
      showLaunchDate:
        true,
  
      showBookingDeadline:
        true,
  
      showCountdown:
        true,
  
      showAvailabilityBadge:
        true,
  
      showNavigation:
        true,
  
      maximumProducts:
        8,
  
      backgroundColor:
        "#FFFFFF",
  
      textColor:
        "#111827",
  
      accentColor:
        "#28ABB5",
  
      borderRadius:
        18,
    },
  
    defaultContent: {
      campaignId:
        null,
  
      badge:
        "PRE-BOOK NOW",
  
      title:
        "Pre-Book Now",
  
      subtitle:
        "",
  
      buttonLabel:
        "View All",
  
      buttonUrl:
        "",
  
      openInNewTab:
        false,
  
      desktopAssetId:
        null,
  
      mobileAssetId:
        null,
    },
  
    validationSchema:
      null,
  
    isSystemType:
      true,
  
    displayOrder:
      95,
  
    isActive:
      true,
  },
  {
    name: "Footer",
    code: "FOOTER",
    description: "Configurable footer with menus, social links, payment icons and legal text.",
    category: "GLOBAL",
    icon: "PanelBottom",
    supportedChannels: [
      "WEBSITE",
      "KIOSK"
    ],
    defaultSettings: {
      "columns": 4,
      "showLogo": true,
      "textColor": "#FFFFFF",
      "showNewsletter": true,
      "backgroundColor": "#111111",
      "showSocialLinks": true,
      "showPaymentIcons": true
    },
    defaultContent: {
      "menuIds": [],
      "copyrightText": "© MyShops. All rights reserved."
    },
    validationSchema: null,
    isSystemType: true,
    displayOrder: 100,
    isActive: true,
  },
];

const seedSectionType = async ({
  db,
  company,
  sectionType,
}) => {
  const where = {
    companyId: company.id,
    code: sectionType.code,
  };

  const values = {
    companyId: company.id,
    ...sectionType,
    isActive: sectionType.isActive !== false,
  };

  const [existing, created] =
    await db.CmsSectionType.findOrCreate({
      where,
      defaults: values,
    });

  if (!created) {
    await existing.update(values);
  }

  return created ? "CREATED" : "UPDATED";
};

module.exports = {
  order: 20,
  name: "CMS section types",

  run: async ({
    db,
    context,
  }) => {
    const companyCode = String(
      context.companyCode || "MYSHOPS"
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

    for (const sectionType of sectionTypes) {
      const status = await seedSectionType({
        db,
        company,
        sectionType,
      });

      if (status === "CREATED") {
        createdCount += 1;
      } else {
        updatedCount += 1;
      }
    }

    return {
      company: company.code,
      total: sectionTypes.length,
      created: createdCount,
      updated: updatedCount,
    };
  },
};
