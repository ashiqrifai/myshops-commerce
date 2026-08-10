const db = require("../models");

const initialPages = [
  {
    name: "Website Home",
    code: "WEBSITE_HOME",
    slug: "/",
    pageType: "HOME",
    channel: "WEBSITE",
    status: "PUBLISHED",
    title: "MyShops",
    description:
      "Main MyShops electronics website homepage.",
    isDefault: true,
  },
  {
    name: "Category Page",
    code: "WEBSITE_CATEGORY",
    slug: "/category",
    pageType: "CATEGORY",
    channel: "WEBSITE",
    status: "PUBLISHED",
    title: "Category",
  },
  {
    name: "Brand Page",
    code: "WEBSITE_BRAND",
    slug: "/brand",
    pageType: "BRAND",
    channel: "WEBSITE",
    status: "PUBLISHED",
    title: "Brand",
  },
  {
    name: "Product Page",
    code: "WEBSITE_PRODUCT",
    slug: "/product",
    pageType: "PRODUCT",
    channel: "WEBSITE",
    status: "PUBLISHED",
    title: "Product",
  },
  {
    name: "Search Page",
    code: "WEBSITE_SEARCH",
    slug: "/search",
    pageType: "SEARCH",
    channel: "WEBSITE",
    status: "PUBLISHED",
    title: "Search",
  },
  {
    name: "Shopping Cart",
    code: "WEBSITE_CART",
    slug: "/cart",
    pageType: "CART",
    channel: "WEBSITE",
    status: "PUBLISHED",
    title: "Shopping Cart",
  },
  {
    name: "Checkout",
    code: "WEBSITE_CHECKOUT",
    slug: "/checkout",
    pageType: "CHECKOUT",
    channel: "WEBSITE",
    status: "PUBLISHED",
    title: "Checkout",
  },
  {
    name: "Offers",
    code: "WEBSITE_OFFERS",
    slug: "/offers",
    pageType: "OFFERS",
    channel: "WEBSITE",
    status: "PUBLISHED",
    title: "Offers",
  },
  {
    name: "Kiosk Home",
    code: "KIOSK_HOME",
    slug: "/",
    pageType: "HOME",
    channel: "KIOSK",
    status: "PUBLISHED",
    title: "MyShops Kiosk",
    description:
      "Main Android Jetpack Compose kiosk homepage.",
    isDefault: true,
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

    for (const pageData of initialPages) {
      await db.CmsPage.findOrCreate({
        where: {
          companyId: company.id,
          code: pageData.code,
        },
        defaults: {
          companyId: company.id,
          ...pageData,
          seoTitle:
            pageData.title || null,
          seoDescription:
            pageData.description || null,
          seoKeywords: [],
          layoutSettings: {},
          publishedAt:
            pageData.status ===
            "PUBLISHED"
              ? new Date()
              : null,
          isActive: true,
          createdBy:
            admin?.id || null,
          updatedBy:
            admin?.id || null,
        },
      });
    }

    console.log(
      "Initial CMS pages seeded successfully."
    );
  } catch (error) {
    console.error(
      "CMS page seed failed:"
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    await db.sequelize.close();
  }
};

run();