const settings = [
  // COMPANY
  {
    channel: "GLOBAL",
    group: "company",
    key: "displayName",
    label: "Company Display Name",
    value: "MyShops",
    defaultValue: "MyShops",
    dataType: "STRING",
    isPublic: true,
    isRequired: true,
    displayOrder: 10,
  },
  {
    channel: "GLOBAL",
    group: "company",
    key: "legalName",
    label: "Legal Company Name",
    value: "MyShops",
    defaultValue: "MyShops",
    dataType: "STRING",
    isPublic: false,
    displayOrder: 20,
  },
  {
    channel: "GLOBAL",
    group: "company",
    key: "logoUrl",
    label: "Primary Logo",
    value: null,
    defaultValue: null,
    dataType: "IMAGE",
    isPublic: true,
    displayOrder: 30,
  },
  {
    channel: "WEBSITE",
    group: "company",
    key: "faviconUrl",
    label: "Website Favicon",
    value: null,
    defaultValue: null,
    dataType: "IMAGE",
    isPublic: true,
    displayOrder: 40,
  },

  // THEME
  {
    channel: "GLOBAL",
    group: "theme",
    key: "primaryColor",
    label: "Primary Color",
    value: "#111111",
    defaultValue: "#111111",
    dataType: "COLOR",
    isPublic: true,
    isRequired: true,
    displayOrder: 10,
  },
  {
    channel: "GLOBAL",
    group: "theme",
    key: "secondaryColor",
    label: "Secondary Color",
    value: "#F4F4F4",
    defaultValue: "#F4F4F4",
    dataType: "COLOR",
    isPublic: true,
    displayOrder: 20,
  },
  {
    channel: "GLOBAL",
    group: "theme",
    key: "accentColor",
    label: "Accent Color",
    value: "#0066FF",
    defaultValue: "#0066FF",
    dataType: "COLOR",
    isPublic: true,
    displayOrder: 30,
  },
  {
    channel: "GLOBAL",
    group: "theme",
    key: "backgroundColor",
    label: "Page Background Color",
    value: "#FFFFFF",
    defaultValue: "#FFFFFF",
    dataType: "COLOR",
    isPublic: true,
    displayOrder: 40,
  },
  {
    channel: "GLOBAL",
    group: "theme",
    key: "surfaceColor",
    label: "Card Background Color",
    value: "#FFFFFF",
    defaultValue: "#FFFFFF",
    dataType: "COLOR",
    isPublic: true,
    displayOrder: 50,
  },
  {
    channel: "GLOBAL",
    group: "theme",
    key: "textColor",
    label: "Primary Text Color",
    value: "#111111",
    defaultValue: "#111111",
    dataType: "COLOR",
    isPublic: true,
    displayOrder: 60,
  },
  {
    channel: "GLOBAL",
    group: "theme",
    key: "mutedTextColor",
    label: "Muted Text Color",
    value: "#6B7280",
    defaultValue: "#6B7280",
    dataType: "COLOR",
    isPublic: true,
    displayOrder: 70,
  },
  {
    channel: "GLOBAL",
    group: "theme",
    key: "borderColor",
    label: "Border Color",
    value: "#E5E7EB",
    defaultValue: "#E5E7EB",
    dataType: "COLOR",
    isPublic: true,
    displayOrder: 80,
  },
  {
    channel: "GLOBAL",
    group: "theme",
    key: "fontFamily",
    label: "Font Family",
    value: "Inter",
    defaultValue: "Inter",
    dataType: "SELECT",
    options: [
      {
        label: "Inter",
        value: "Inter",
      },
      {
        label: "Manrope",
        value: "Manrope",
      },
      {
        label: "Poppins",
        value: "Poppins",
      },
      {
        label: "Roboto",
        value: "Roboto",
      },
    ],
    isPublic: true,
    displayOrder: 90,
  },
  {
    channel: "GLOBAL",
    group: "theme",
    key: "buttonRadius",
    label: "Button Corner Radius",
    value: 8,
    defaultValue: 8,
    dataType: "NUMBER",
    isPublic: true,
    displayOrder: 100,
  },
  {
    channel: "GLOBAL",
    group: "theme",
    key: "cardRadius",
    label: "Card Corner Radius",
    value: 12,
    defaultValue: 12,
    dataType: "NUMBER",
    isPublic: true,
    displayOrder: 110,
  },

  // WEBSITE
  {
    channel: "WEBSITE",
    group: "website",
    key: "wishlistEnabled",
    label: "Enable Wishlist",
    value: true,
    defaultValue: true,
    dataType: "BOOLEAN",
    isPublic: true,
    displayOrder: 10,
  },
  {
    channel: "WEBSITE",
    group: "website",
    key: "comparisonEnabled",
    label: "Enable Product Comparison",
    value: true,
    defaultValue: true,
    dataType: "BOOLEAN",
    isPublic: true,
    displayOrder: 20,
  },
  {
    channel: "WEBSITE",
    group: "website",
    key: "reviewsEnabled",
    label: "Enable Product Reviews",
    value: true,
    defaultValue: true,
    dataType: "BOOLEAN",
    isPublic: true,
    displayOrder: 30,
  },
  {
    channel: "WEBSITE",
    group: "website",
    key: "recentlyViewedEnabled",
    label: "Enable Recently Viewed",
    value: true,
    defaultValue: true,
    dataType: "BOOLEAN",
    isPublic: true,
    displayOrder: 40,
  },
  {
    channel: "WEBSITE",
    group: "website",
    key: "guestCheckoutEnabled",
    label: "Enable Guest Checkout",
    value: true,
    defaultValue: true,
    dataType: "BOOLEAN",
    isPublic: true,
    displayOrder: 50,
  },
  {
    channel: "WEBSITE",
    group: "website",
    key: "aiAssistantEnabled",
    label: "Enable Website AI Assistant",
    value: true,
    defaultValue: true,
    dataType: "BOOLEAN",
    isPublic: true,
    displayOrder: 60,
  },
  {
    channel: "WEBSITE",
    group: "website",
    key: "showInventory",
    label: "Show Inventory Availability",
    value: true,
    defaultValue: true,
    dataType: "BOOLEAN",
    isPublic: true,
    displayOrder: 70,
  },
  {
    channel: "WEBSITE",
    group: "website",
    key: "showLowStock",
    label: "Show Low Stock Messages",
    value: true,
    defaultValue: true,
    dataType: "BOOLEAN",
    isPublic: true,
    displayOrder: 80,
  },

  {
    channel: "WEBSITE",
    group: "website",
    key: "announcementBarEnabled",
    label: "Enable Announcement Bar",
    description:
      "Show or hide the announcement bar above the website header.",
    value: true,
    defaultValue: true,
    dataType: "BOOLEAN",
    isPublic: true,
    displayOrder: 100,
  },
  {
    channel: "WEBSITE",
    group: "website",
    key: "announcementText",
    label: "Announcement Text",
    description:
      "Message displayed in the announcement bar.",
    value:
      "UAE's electronics shopping destination",
    defaultValue:
      "UAE's electronics shopping destination",
    dataType: "STRING",
    isPublic: true,
    displayOrder: 110,
  },
  {
    channel: "WEBSITE",
    group: "website",
    key: "announcementLinkText",
    label: "Announcement Link Text",
    description:
      "Optional clickable text displayed in the announcement bar.",
    value: "",
    defaultValue: "",
    dataType: "STRING",
    isPublic: true,
    displayOrder: 120,
  },
  {
    channel: "WEBSITE",
    group: "website",
    key: "announcementLinkUrl",
    label: "Announcement Link URL",
    description:
      "Optional internal or external link for the announcement.",
    value: "",
    defaultValue: "",
    dataType: "STRING",
    isPublic: true,
    displayOrder: 130,
  },
  {
    channel: "WEBSITE",
    group: "website",
    key: "announcementShowSupportEmail",
    label: "Show Support Email",
    description:
      "Display the support email on the right side of the announcement bar.",
    value: true,
    defaultValue: true,
    dataType: "BOOLEAN",
    isPublic: true,
    displayOrder: 140,
  },
  {
    channel: "WEBSITE",
    group: "website",
    key: "headerEnabled",
    label: "Enable Website Header",
    description:
      "Show or hide the main website header.",
    value: true,
    defaultValue: true,
    dataType: "BOOLEAN",
    isPublic: true,
    displayOrder: 150,
  },
  {
    channel: "WEBSITE",
    group: "website",
    key: "headerSticky",
    label: "Sticky Header",
    description:
      "Keep the header visible while the customer scrolls.",
    value: true,
    defaultValue: true,
    dataType: "BOOLEAN",
    isPublic: true,
    displayOrder: 160,
  },
  {
    channel: "WEBSITE",
    group: "website",
    key: "showSearch",
    label: "Show Search",
    description:
      "Display the product search field in the website header.",
    value: true,
    defaultValue: true,
    dataType: "BOOLEAN",
    isPublic: true,
    displayOrder: 170,
  },
  {
    channel: "WEBSITE",
    group: "website",
    key: "searchPlaceholder",
    label: "Search Placeholder",
    description:
      "Placeholder displayed inside the product search field.",
    value:
      "Search products, brands and categories",
    defaultValue:
      "Search products, brands and categories",
    dataType: "STRING",
    isPublic: true,
    displayOrder: 180,
  },
  {
    channel: "WEBSITE",
    group: "website",
    key: "showHomeLink",
    label: "Show Home Link",
    description:
      "Display the Home link in the website header.",
    value: true,
    defaultValue: true,
    dataType: "BOOLEAN",
    isPublic: true,
    displayOrder: 190,
  },
  {
    channel: "WEBSITE",
    group: "website",
    key: "showAccount",
    label: "Show Account",
    description:
      "Display the customer account action in the website header.",
    value: true,
    defaultValue: true,
    dataType: "BOOLEAN",
    isPublic: true,
    displayOrder: 200,
  },
  {
    channel: "WEBSITE",
    group: "website",
    key: "showWishlist",
    label: "Show Wishlist",
    description:
      "Display the wishlist action in the website header.",
    value: true,
    defaultValue: true,
    dataType: "BOOLEAN",
    isPublic: true,
    displayOrder: 210,
  },
  {
    channel: "WEBSITE",
    group: "website",
    key: "showCart",
    label: "Show Cart",
    description:
      "Display the cart action in the website header.",
    value: true,
    defaultValue: true,
    dataType: "BOOLEAN",
    isPublic: true,
    displayOrder: 220,
  },

  // KIOSK
  {
    channel: "KIOSK",
    group: "kiosk",
    key: "aiAssistantEnabled",
    label: "Enable Kiosk AI Assistant",
    value: true,
    defaultValue: true,
    dataType: "BOOLEAN",
    isPublic: true,
    displayOrder: 10,
  },
  {
    channel: "KIOSK",
    group: "kiosk",
    key: "cartEnabled",
    label: "Enable Kiosk Cart",
    value: true,
    defaultValue: true,
    dataType: "BOOLEAN",
    isPublic: true,
    displayOrder: 20,
  },
  {
    channel: "KIOSK",
    group: "kiosk",
    key: "qrHandoffEnabled",
    label: "Enable QR Mobile Handoff",
    value: true,
    defaultValue: true,
    dataType: "BOOLEAN",
    isPublic: true,
    displayOrder: 30,
  },
  {
    channel: "KIOSK",
    group: "kiosk",
    key: "voiceInputEnabled",
    label: "Enable Voice Input",
    value: true,
    defaultValue: true,
    dataType: "BOOLEAN",
    isPublic: true,
    displayOrder: 40,
  },
  {
    channel: "KIOSK",
    group: "kiosk",
    key: "textToSpeechEnabled",
    label: "Enable Text to Speech",
    value: true,
    defaultValue: true,
    dataType: "BOOLEAN",
    isPublic: true,
    displayOrder: 50,
  },
  {
    channel: "KIOSK",
    group: "kiosk",
    key: "autoSessionResetEnabled",
    label: "Enable Automatic Session Reset",
    value: true,
    defaultValue: true,
    dataType: "BOOLEAN",
    isPublic: true,
    displayOrder: 60,
  },
  {
    channel: "KIOSK",
    group: "kiosk",
    key: "idleTimeoutSeconds",
    label: "Idle Timeout in Seconds",
    value: 120,
    defaultValue: 120,
    dataType: "NUMBER",
    isPublic: true,
    displayOrder: 70,
  },
  {
    channel: "KIOSK",
    group: "kiosk",
    key: "sessionResetSeconds",
    label: "Session Reset Delay",
    value: 15,
    defaultValue: 15,
    dataType: "NUMBER",
    isPublic: true,
    displayOrder: 80,
  },
  {
    channel: "KIOSK",
    group: "kiosk",
    key: "heartbeatIntervalSeconds",
    label: "Device Heartbeat Interval",
    value: 60,
    defaultValue: 60,
    dataType: "NUMBER",
    isPublic: true,
    displayOrder: 90,
  },
  {
    channel: "KIOSK",
    group: "kiosk",
    key: "orientation",
    label: "Kiosk Orientation",
    value: "PORTRAIT",
    defaultValue: "PORTRAIT",
    dataType: "SELECT",
    options: [
      {
        label: "Portrait",
        value: "PORTRAIT",
      },
      {
        label: "Landscape",
        value: "LANDSCAPE",
      },
    ],
    isPublic: true,
    displayOrder: 100,
  },

  // COMMERCE
  {
    channel: "GLOBAL",
    group: "commerce",
    key: "currency",
    label: "Default Currency",
    value: "AED",
    defaultValue: "AED",
    dataType: "SELECT",
    options: [
      {
        label: "UAE Dirham",
        value: "AED",
      },
      {
        label: "US Dollar",
        value: "USD",
      },
    ],
    isPublic: true,
    isRequired: true,
    displayOrder: 10,
  },
  {
    channel: "GLOBAL",
    group: "commerce",
    key: "timezone",
    label: "Business Time Zone",
    value: "Asia/Dubai",
    defaultValue: "Asia/Dubai",
    dataType: "SELECT",
    options: [
      {
        label: "Dubai",
        value: "Asia/Dubai",
      },
    ],
    isPublic: true,
    isRequired: true,
    displayOrder: 20,
  },
  {
    channel: "GLOBAL",
    group: "commerce",
    key: "taxInclusive",
    label: "Prices Include Tax",
    value: true,
    defaultValue: true,
    dataType: "BOOLEAN",
    isPublic: true,
    displayOrder: 30,
  },
  {
    channel: "GLOBAL",
    group: "commerce",
    key: "lowStockThreshold",
    label: "Default Low Stock Threshold",
    value: 5,
    defaultValue: 5,
    dataType: "NUMBER",
    isPublic: false,
    displayOrder: 40,
  },
  {
    channel: "GLOBAL",
    group: "commerce",
    key: "allowBackorders",
    label: "Allow Backorders",
    value: false,
    defaultValue: false,
    dataType: "BOOLEAN",
    isPublic: false,
    displayOrder: 50,
  },

  // CONTACT
  {
    channel: "GLOBAL",
    group: "contact",
    key: "supportEmail",
    label: "Support Email",
    value: "support@myshops.ae",
    defaultValue: "support@myshops.ae",
    dataType: "EMAIL",
    isPublic: true,
    displayOrder: 10,
  },
  {
    channel: "GLOBAL",
    group: "contact",
    key: "supportPhone",
    label: "Support Phone",
    value: "",
    defaultValue: "",
    dataType: "STRING",
    isPublic: true,
    displayOrder: 20,
  },
  {
    channel: "GLOBAL",
    group: "contact",
    key: "whatsAppNumber",
    label: "WhatsApp Number",
    value: "",
    defaultValue: "",
    dataType: "STRING",
    isPublic: true,
    displayOrder: 30,
  },
];

const seedSystemSetting = async ({
    db,
    company,
    item,
  }) => {
    const where = {
      companyId: company.id,
      channel: item.channel,
      group: item.group,
      key: item.key,
    };
  
    const values = {
      companyId: company.id,
      ...item,
  
      isEditable:
        item.isEditable !== false,
  
      isRequired:
        item.isRequired === true,
  
      isActive:
        item.isActive !== false,
    };
  
    const [
      setting,
      created,
    ] =
      await db.SystemSetting.findOrCreate({
        where,
        defaults: values,
      });
  
    if (!created) {
      await setting.update({
        label: values.label,
  
        description:
          values.description ||
          null,
  
        defaultValue:
          values.defaultValue,
  
        dataType:
          values.dataType,
  
        options:
          values.options ||
          null,
  
        isPublic:
          values.isPublic === true,
  
        isEditable:
          values.isEditable,
  
        isRequired:
          values.isRequired,
  
        isActive:
          values.isActive,
  
        displayOrder:
          values.displayOrder || 0,
      });
    }
  
    return created
      ? "CREATED"
      : "UPDATED";
  };
  
  module.exports = {
    order: 10,
  
    name:
      "MyShops system settings",
  
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
          `Active company ${companyCode} was not found. Run the company seed first.`
        );
      }
  
      let createdCount = 0;
      let updatedCount = 0;
  
      for (const item of settings) {
        const status =
          await seedSystemSetting({
            db,
            company,
            item,
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
          settings.length,
  
        created:
          createdCount,
  
        updated:
          updatedCount,
      };
    },
  };
