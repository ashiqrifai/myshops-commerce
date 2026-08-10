const db = require("../models");

const folderStructure = [
  {
    name: "Products",
    code: "PRODUCTS",
    description:
      "Product images, videos, manuals and related digital assets.",
    displayOrder: 10,
    children: [],
  },
  {
    name: "Categories",
    code: "CATEGORIES",
    description:
      "Category icons, banners and promotional media.",
    displayOrder: 20,
    children: [],
  },
  {
    name: "Brands",
    code: "BRANDS",
    description:
      "Brand logos, cover images, banners and videos.",
    displayOrder: 30,
    children: [],
  },
  {
    name: "CMS",
    code: "CMS",
    description:
      "Digital assets used by dynamic CMS pages and sections.",
    displayOrder: 40,
    children: [
      {
        name: "Hero",
        code: "CMS_HERO",
        description:
          "Homepage and landing-page hero media.",
        displayOrder: 10,
      },
      {
        name: "Banners",
        code: "CMS_BANNERS",
        description:
          "Promotional and informational CMS banners.",
        displayOrder: 20,
      },
      {
        name: "Footer",
        code: "CMS_FOOTER",
        description:
          "Footer logos, backgrounds and related media.",
        displayOrder: 30,
      },
    ],
  },
  {
    name: "Promotions",
    code: "PROMOTIONS",
    description:
      "Campaign, promotion, coupon and offer media.",
    displayOrder: 50,
    children: [],
  },
  {
    name: "AI Kiosk",
    code: "AI_KIOSK",
    description:
      "Android AI kiosk backgrounds, animations and interface media.",
    displayOrder: 60,
    children: [],
  },
  {
    name: "Blog",
    code: "BLOG",
    description:
      "Blog featured images, galleries and videos.",
    displayOrder: 70,
    children: [],
  },
  {
    name: "Downloads",
    code: "DOWNLOADS",
    description:
      "Public manuals, specifications and downloadable documents.",
    displayOrder: 80,
    children: [],
  },
  {
    name: "Legal",
    code: "LEGAL",
    description:
      "Legal, warranty, compliance and policy documents.",
    displayOrder: 90,
    children: [],
  },
  {
    name: "Store",
    code: "STORE",
    description:
      "Store photographs, floor plans, maps and location assets.",
    displayOrder: 100,
    children: [],
  },
  {
    name: "Archive",
    code: "ARCHIVE",
    description:
      "Archived and inactive digital assets.",
    displayOrder: 999,
    children: [],
  },
];

const upsertFolder = async ({
  companyId,
  adminId,
  folderData,
  parentFolderId = null,
}) => {
  const [
    folder,
    created,
  ] =
    await db.MediaFolder.findOrCreate({
      where: {
        companyId,
        code: folderData.code,
      },
      defaults: {
        companyId,
        parentFolderId,
        name: folderData.name,
        code: folderData.code,
        description:
          folderData.description ||
          null,
        displayOrder:
          folderData.displayOrder ||
          0,
        isSystemFolder: true,
        isActive: true,
        createdBy: adminId,
        updatedBy: adminId,
      },
    });

  if (!created) {
    await folder.update({
      parentFolderId,
      name: folderData.name,
      description:
        folderData.description ||
        null,
      displayOrder:
        folderData.displayOrder ||
        0,
      isSystemFolder: true,
      isActive: true,
      updatedBy: adminId,
    });
  }

  for (
    const childFolder of
    folderData.children || []
  ) {
    await upsertFolder({
      companyId,
      adminId,
      folderData: childFolder,
      parentFolderId:
        folder.id,
    });
  }

  return folder;
};

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

    for (const folderData of folderStructure) {
      await upsertFolder({
        companyId: company.id,
        adminId:
          admin?.id || null,
        folderData,
      });
    }

    console.log(
      "Media system folders seeded successfully."
    );
  } catch (error) {
    console.error(
      "Media folder seed failed:"
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    await db.sequelize.close();
  }
};

run();