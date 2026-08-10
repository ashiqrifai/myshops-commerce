const db = require("../../models");

const AppError = require(
  "../../utils/AppError"
);

const {
  buildNavigationTree,
} = require("./navigation.service");

const getCompanyByCode =
  async (companyCode) => {
    const company =
      await db.Company.findOne({
        where: {
          code: String(
            companyCode ||
              "MYSHOPS"
          )
            .trim()
            .toUpperCase(),

          isActive: true,
        },

        attributes: [
          "id",
          "name",
          "code",
        ],
      });

    if (!company) {
      throw new AppError(
        "Company not found.",
        404,
        "COMPANY_NOT_FOUND"
      );
    }

    return company;
  };

const getPublicNavigationByCode =
  async ({
    companyCode,
    code,
    channel,
  }) => {
    const company =
      await getCompanyByCode(
        companyCode
      );

    const normalizedCode =
      String(code)
        .trim()
        .toUpperCase();

    const menu =
      await db.NavigationMenu.findOne({
        where: {
          companyId:
            company.id,

          code:
            normalizedCode,

          isActive: true,
        },
      });

    if (!menu) {
      throw new AppError(
        "Navigation menu not found.",
        404,
        "NAVIGATION_MENU_NOT_FOUND"
      );
    }

    const requestedChannel =
      String(
        channel ||
          "WEBSITE"
      )
        .trim()
        .toUpperCase();

    if (
      menu.channel !== "BOTH" &&
      menu.channel !==
        requestedChannel
    ) {
      throw new AppError(
        "This navigation menu is not available for the requested channel.",
        404,
        "NAVIGATION_MENU_CHANNEL_NOT_AVAILABLE"
      );
    }

    const items =
      await db.NavigationItem.findAll({
        where: {
          companyId:
            company.id,

          navigationMenuId:
            menu.id,

          isActive: true,
        },

        include: [
          {
            model:
              db.MediaAsset,

            as: "mediaAsset",

            required: false,
          },
        ],

        order: [
          [
            "displayOrder",
            "ASC",
          ],
          ["label", "ASC"],
        ],
      });

    const plainMenu =
      menu.get({
        plain: true,
      });

    plainMenu.items =
      buildNavigationTree(
        items
      );

    return {
      company,
      menu: plainMenu,
    };
  };

module.exports = {
  getPublicNavigationByCode,
};