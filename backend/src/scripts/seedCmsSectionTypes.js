const db = require("../models");

const sectionTypes = [
  {
    name: "Announcement Bar",
    code: "ANNOUNCEMENT_BAR",
    description:
      "A configurable announcement or promotional message displayed above the header.",
    category: "GLOBAL",
    icon: "Megaphone",
    supportedChannels: ["WEBSITE", "KIOSK"],
    displayOrder: 10,
    defaultSettings: {
      backgroundColor: "#111111",
      textColor: "#FFFFFF",
      height: 36,
      alignment: "CENTER",
      behavior: "STATIC",
      dismissible: false,
    },
    defaultContent: {
      text: "Welcome to MyShops",
      linkText: "",
      linkUrl: "",
    },
  },

  {
    name: "Header",
    code: "HEADER",
    description:
      "Configurable website or kiosk header containing logo, search, account and cart actions.",
    category: "GLOBAL",
    icon: "PanelTop",
    supportedChannels: ["WEBSITE", "KIOSK"],
    displayOrder: 20,
    defaultSettings: {
      sticky: true,
      transparent: false,
      showLogo: true,
      showSearch: true,
      showAccount: true,
      showWishlist: true,
      showCart: true,
      backgroundColor: "#FFFFFF",
      textColor: "#111111",
    },
    defaultContent: {
      logoAssetId: null,
    },
  },

  {
    name: "Navigation",
    code: "NAVIGATION",
    description:
      "Configurable simple, dropdown or mega-menu navigation.",
    category: "GLOBAL",
    icon: "Menu",
    supportedChannels: ["WEBSITE", "KIOSK"],
    displayOrder: 30,
    defaultSettings: {
      menuType: "MEGA_MENU",
      sticky: false,
      showImages: true,
      showIcons: true,
      columns: 4,
    },
    defaultContent: {
      menuId: null,
    },
  },

  {
    name: "Hero Carousel",
    code: "HERO_CAROUSEL",
    description:
      "Large responsive carousel with separate website, mobile and kiosk media.",
    category: "HERO",
    icon: "GalleryHorizontal",
    supportedChannels: ["WEBSITE", "KIOSK"],
    displayOrder: 10,
    defaultSettings: {
      autoplay: true,
      autoplayDelayMs: 5000,
      showArrows: true,
      showDots: true,
      loop: true,
      heightDesktop: 560,
      heightMobile: 420,
      heightKiosk: 720,
    },
    defaultContent: {
      slides: [],
    },
  },

  {
    name: "Hero Banner",
    code: "HERO_BANNER",
    description:
      "Single responsive hero banner for products, categories, brands or campaigns.",
    category: "HERO",
    icon: "Image",
    supportedChannels: ["WEBSITE", "KIOSK"],
    displayOrder: 20,
    defaultSettings: {
      contentAlignment: "LEFT",
      overlayEnabled: false,
      overlayOpacity: 0.25,
      heightDesktop: 560,
      heightMobile: 420,
      heightKiosk: 720,
    },
    defaultContent: {
      desktopImageAssetId: null,
      mobileImageAssetId: null,
      kioskImageAssetId: null,
    
      title: "",
      subtitle: "",
      description: "",
      buttonText: "",
      buttonUrl: "",
    },
  },

  {
    name: "Hero Video",
    code: "HERO_VIDEO",
    description:
      "Full-width hero video with optional text and call-to-action.",
    category: "HERO",
    icon: "Video",
    supportedChannels: ["WEBSITE", "KIOSK"],
    displayOrder: 30,
    defaultSettings: {
      autoplay: true,
      muted: true,
      loop: true,
      showControls: false,
      contentAlignment: "LEFT",
    },
    defaultContent: {
      videoAssetId: null,
      posterImageAssetId: null,
    
      title: "",
      subtitle: "",
      buttonText: "",
      buttonUrl: "",
    },
  },

  {
    name: "Category Grid",
    code: "CATEGORY_GRID",
    description:
      "Grid of manually selected or dynamically loaded product categories.",
    category: "CATALOG",
    icon: "LayoutGrid",
    supportedChannels: ["WEBSITE", "KIOSK"],
    displayOrder: 10,
    defaultSettings: {
      sourceType: "MANUAL",
      columnsDesktop: 6,
      columnsTablet: 4,
      columnsMobile: 2,
      columnsKiosk: 3,
      showImage: true,
      showName: true,
      showProductCount: false,
      cardStyle: "ROUNDED",
    },
    defaultContent: {
      title: "Shop by Category",
      subtitle: "",
      categoryIds: [],
    },
  },

  {
    name: "Category Carousel",
    code: "CATEGORY_CAROUSEL",
    description:
      "Horizontally scrolling category cards.",
    category: "CATALOG",
    icon: "PanelsTopLeft",
    supportedChannels: ["WEBSITE", "KIOSK"],
    displayOrder: 20,
    defaultSettings: {
      sourceType: "MANUAL",
      autoplay: false,
      itemsDesktop: 6,
      itemsTablet: 4,
      itemsMobile: 2,
      itemsKiosk: 3,
      showArrows: true,
      showDots: false,
    },
    defaultContent: {
      title: "Categories",
      subtitle: "",
      categoryIds: [],
    },
  },

  {
    name: "Brand Carousel",
    code: "BRAND_CAROUSEL",
    description:
      "Configurable carousel of electronics brands.",
    category: "CATALOG",
    icon: "Badge",
    supportedChannels: ["WEBSITE", "KIOSK"],
    displayOrder: 30,
    defaultSettings: {
      sourceType: "MANUAL",
      autoplay: true,
      itemsDesktop: 8,
      itemsTablet: 5,
      itemsMobile: 3,
      itemsKiosk: 4,
      showNames: false,
    },
    defaultContent: {
      title: "Top Brands",
      subtitle: "",
      brandIds: [],
    },
  },

  {
    name: "Product Carousel",
    code: "PRODUCT_CAROUSEL",
    description:
      "Carousel populated from featured, category, brand, manual or other product sources.",
    category: "CATALOG",
    icon: "ShoppingBag",
    supportedChannels: ["WEBSITE", "KIOSK"],
    displayOrder: 40,
    defaultSettings: {
      sourceType: "FEATURED",
      sortBy: "MANUAL",
      maximumProducts: 12,
      itemsDesktop: 5,
      itemsTablet: 3,
      itemsMobile: 2,
      itemsKiosk: 3,
      showArrows: true,
      showAddToCart: true,
      showWishlist: true,
    },
    defaultContent: {
      title: "Featured Products",
      subtitle: "",
      productIds: [],
      categoryId: null,
      brandId: null,
    },
  },

  {
    name: "Featured Product Grid",
  
    code: "FEATURED_PRODUCT_GRID",
  
    description:
      "Responsive product grid populated manually or from featured, category or brand products.",
  
    category: "CATALOG",
  
    icon: "PackageSearch",
  
    supportedChannels: [
      "WEBSITE",
      "KIOSK",
    ],
  
    displayOrder: 45,
  
    defaultSettings: {
      sourceType: "MANUAL",
  
      sortBy: "MANUAL",
  
      maximumProducts: 10,
  
      columnsDesktop: 5,
  
      columnsTablet: 3,
  
      columnsMobile: 2,
  
      columnsKiosk: 4,
  
      showImage: true,
  
      showBrand: true,
  
      showProductName: true,
  
      showPrice: true,
  
      showOriginalPrice: true,
  
      showDiscountBadge: true,
  
      showRating: false,
  
      showWishlist: true,
  
      showAddToCart: true,
  
      cardStyle: "ROUNDED",
    },
  
    defaultContent: {
      title: "Featured Products",
  
      subtitle: "",
  
      productIds: [],
  
      categoryId: null,
  
      brandId: null,
    },
  },

  {
    name: "Flash Deals",
    code: "FLASH_DEALS",
    description:
      "Time-limited product promotion section with countdown.",
    category: "CATALOG",
    icon: "Zap",
    supportedChannels: ["WEBSITE", "KIOSK"],
    displayOrder: 50,
    defaultSettings: {
      showCountdown: true,
      maximumProducts: 10,
      itemsDesktop: 5,
      itemsTablet: 3,
      itemsMobile: 2,
      itemsKiosk: 3,
    },
    defaultContent: {
      title: "Flash Deals",
      subtitle: "",
      campaignId: null,
      endAt: null,
    },
  },

  {
    name: "Promotion Banner",
    code: "PROMOTION_BANNER",
    description:
      "Responsive promotional banner with optional campaign link.",
    category: "MARKETING",
    icon: "RectangleHorizontal",
    supportedChannels: ["WEBSITE", "KIOSK"],
    displayOrder: 10,
    defaultSettings: {
      width: "FULL",
      borderRadius: 16,
      contentAlignment: "LEFT",
    },
    defaultContent: {
      desktopImageAssetId: null,
      mobileImageAssetId: null,
      kioskImageAssetId: null,
    
      title: "",
      subtitle: "",
      buttonText: "",
      buttonUrl: "",
    },
  },

  {
    name: "Rich Text",
    code: "RICH_TEXT",
    description:
      "Configurable heading, body text and call-to-action content.",
    category: "MARKETING",
    icon: "Text",
    supportedChannels: ["WEBSITE", "KIOSK"],
    displayOrder: 20,
    defaultSettings: {
      alignment: "LEFT",
      maxWidth: "900px",
      backgroundColor: "#FFFFFF",
    },
    defaultContent: {
      title: "",
      subtitle: "",
      html: "",
      buttonText: "",
      buttonUrl: "",
    },
  },

  {
    name: "Video",
    code: "VIDEO",
    description:
      "Embedded or uploaded marketing and product video.",
    category: "MARKETING",
    icon: "PlaySquare",
    supportedChannels: ["WEBSITE", "KIOSK"],
    displayOrder: 30,
    defaultSettings: {
      provider: "UPLOAD",
      autoplay: false,
      muted: false,
      loop: false,
      showControls: true,
      aspectRatio: "16:9",
    },
    defaultContent: {
      videoAssetId: null,
      posterImageAssetId: null,
    
      title: "",
      description: "",
    },
  },

  {
    name: "Store Features",
    code: "STORE_FEATURES",
    description:
      "Displays trust and service benefits such as delivery, payment and warranty.",
    category: "MARKETING",
    icon: "ShieldCheck",
    supportedChannels: ["WEBSITE", "KIOSK"],
    displayOrder: 40,
    defaultSettings: {
      columnsDesktop: 4,
      columnsMobile: 2,
      columnsKiosk: 2,
      showIcons: true,
    },
    defaultContent: {
      items: [],
    },
  },

  {
    name: "Newsletter",
    code: "NEWSLETTER",
    description:
      "Customer newsletter subscription section.",
    category: "MARKETING",
    icon: "Mail",
    supportedChannels: ["WEBSITE"],
    displayOrder: 50,
    defaultSettings: {
      alignment: "CENTER",
      showNameField: false,
      backgroundColor: "#F4F4F4",
    },
    defaultContent: {
      title: "Stay updated",
      subtitle:
        "Receive the latest products, offers and electronics news.",
      buttonText: "Subscribe",
    },
  },

  {
    name: "AI Banner",
    code: "AI_BANNER",
    description:
      "Promotional entry point for the MyShops AI product assistant.",
    category: "AI",
    icon: "Bot",
    supportedChannels: ["WEBSITE", "KIOSK"],
    displayOrder: 10,
    defaultSettings: {
      style: "CARD",
      showVoiceButton: true,
      showSuggestedPrompts: true,
    },
    defaultContent: {
      title: "Ask MyShops AI",
      subtitle:
        "Tell us what you need and we’ll help you find the right electronics.",
      buttonText: "Ask AI",
      suggestedPrompts: [],
    },
  },

  {
    name: "AI Recommendations",
    code: "AI_RECOMMENDATIONS",
    description:
      "AI-generated product recommendations for the current session or customer.",
    category: "AI",
    icon: "Sparkles",
    supportedChannels: ["WEBSITE", "KIOSK"],
    displayOrder: 20,
    defaultSettings: {
      maximumProducts: 8,
      itemsDesktop: 4,
      itemsMobile: 2,
      itemsKiosk: 3,
    },
    defaultContent: {
      title: "Recommended for You",
      subtitle: "",
    },
  },

  {
    name: "Footer",
    code: "FOOTER",
    description:
      "Configurable footer with menus, social links, payment icons and legal text.",
    category: "GLOBAL",
    icon: "PanelBottom",
    supportedChannels: ["WEBSITE", "KIOSK"],
    displayOrder: 100,
    defaultSettings: {
      columns: 4,
      showLogo: true,
      showNewsletter: true,
      showSocialLinks: true,
      showPaymentIcons: true,
      backgroundColor: "#111111",
      textColor: "#FFFFFF",
    },
    defaultContent: {
      menuIds: [],
      copyrightText:
        "© MyShops. All rights reserved.",
    },
  },

  {
    name: "Kiosk AI Welcome",
    code: "KIOSK_AI_WELCOME",
    description:
      "Large touch-optimized AI welcome panel for the Android kiosk.",
    category: "KIOSK",
    icon: "MessageCircle",
    supportedChannels: ["KIOSK"],
    displayOrder: 10,
    defaultSettings: {
      showVoiceButton: true,
      showKeyboardButton: true,
      showSuggestedPrompts: true,
      style: "LARGE_CARD",
    },
    defaultContent: {
      title: "How can I help you today?",
      subtitle:
        "Ask about products, features, compatibility or availability.",
      suggestedPrompts: [],
    },
  },

  {
    name: "Kiosk Assistance Button",
    code: "KIOSK_ASSISTANCE_BUTTON",
    description:
      "Touch-friendly button for requesting assistance from store staff.",
    category: "KIOSK",
    icon: "BellRing",
    supportedChannels: ["KIOSK"],
    displayOrder: 20,
    defaultSettings: {
      position: "BOTTOM_RIGHT",
      style: "FLOATING",
      requireConfirmation: true,
    },
    defaultContent: {
      buttonText: "Request Assistance",
      confirmationText:
        "A salesperson has been notified.",
    },
  },

  {
    name: "Kiosk QR Handoff",
    code: "KIOSK_QR_HANDOFF",
    description:
      "Allows the customer to transfer the kiosk session or product selection to mobile.",
    category: "KIOSK",
    icon: "QrCode",
    supportedChannels: ["KIOSK"],
    displayOrder: 30,
    defaultSettings: {
      expirySeconds: 300,
      showSessionSummary: true,
    },
    defaultContent: {
      title: "Continue on your phone",
      subtitle:
        "Scan the QR code to continue shopping.",
    },
  },
];

const run = async () => {
  try {
    await db.sequelize.authenticate();

    await db.sequelize.sync({
      alter: false,
    });

    const company =
      await db.Company.findOne({
        where: {
          code: "MYSHOPS",
          isActive: true,
        },
      });

    if (!company) {
      throw new Error(
        "MyShops company was not found."
      );
    }

    const admin =
      await db.User.findOne({
        where: {
          companyId: company.id,
          isSuperAdmin: true,
          isActive: true,
        },
      });

    for (const sectionType of sectionTypes) {
      const [record, created] =
        await db.CmsSectionType.findOrCreate({
          where: {
            companyId: company.id,
            code: sectionType.code,
          },
          defaults: {
            companyId: company.id,
            ...sectionType,
            validationSchema: null,
            isSystemType: true,
            isActive: true,
            createdBy: admin?.id || null,
            updatedBy: admin?.id || null,
          },
        });

      if (!created) {
        await record.update({
          name: sectionType.name,
          description:
            sectionType.description,
          category: sectionType.category,
          icon: sectionType.icon,
          supportedChannels:
            sectionType.supportedChannels,
          defaultSettings:
            sectionType.defaultSettings,
          defaultContent:
            sectionType.defaultContent,
          displayOrder:
            sectionType.displayOrder,
          isActive: true,
          updatedBy: admin?.id || null,
        });
      }
    }

    console.log(
      `${sectionTypes.length} CMS section types seeded successfully.`
    );
  } catch (error) {
    console.error(
      "CMS section type seed failed:"
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    await db.sequelize.close();
  }
};

run();