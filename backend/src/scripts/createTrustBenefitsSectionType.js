const db =
  require("../models");

const createTrustBenefitsSectionType =
  async () => {
    try {
      await db.sequelize.authenticate();

      const company =
        await db.Company.findOne({
          where: {
            code: "MYSHOPS",
          },
        });

      if (!company) {
        throw new Error(
          "MYSHOPS company was not found."
        );
      }

      const [
        sectionType,
        created,
      ] =
        await db.CmsSectionType.findOrCreate({
          where: {
            companyId:
              company.id,

            code:
              "TRUST_BENEFITS",
          },

          defaults: {
            companyId:
              company.id,

            name:
              "Trust Benefits",

            code:
              "TRUST_BENEFITS",

            description:
              "Displays customer trust and service benefit cards such as delivery, warranty, returns and authenticity.",

            category:
              "MARKETING",

            icon:
              "BadgeCheck",

            supportedChannels: [
              "WEBSITE",
            ],

            defaultSettings: {
              columnsDesktop:
                4,

              columnsTablet:
                2,

              columnsMobile:
                1,

              showBorder:
                true,

              cardHeight:
                88,

              gap:
                12,
            },

            defaultContent: {
              items: [
                {
                  title:
                    "24-Hour Delivery",

                  subtitle:
                    "Fast shipping across Emirates",

                  iconAssetId:
                    null,
                },

                {
                  title:
                    "Official Warranty",

                  subtitle:
                    "Certified brand warranty",

                  iconAssetId:
                    null,
                },

                {
                  title:
                    "7-Day Easy Returns",

                  subtitle:
                    "Hassle-free return policy",

                  iconAssetId:
                    null,
                },

                {
                  title:
                    "100% Authentic",

                  subtitle:
                    "Genuine products guaranteed",

                  iconAssetId:
                    null,
                },
              ],
            },

            validationSchema: {
              type:
                "object",

              properties: {
                items: {
                  type:
                    "array",

                  maxItems:
                    8,

                  items: {
                    type:
                      "object",

                    properties: {
                      title: {
                        type:
                          "string",
                      },

                      subtitle: {
                        type:
                          "string",
                      },

                      iconAssetId: {
                        type: [
                          "string",
                          "null",
                        ],
                      },
                    },
                  },
                },
              },
            },

            isSystemType:
              true,

            displayOrder:
              45,

            isActive:
              true,

            createdBy:
              null,

            updatedBy:
              null,
          },
        });

      console.log(
        created
          ? "TRUST_BENEFITS section type created."
          : "TRUST_BENEFITS section type already exists."
      );

      console.log(
        sectionType.toJSON()
      );

      await db.sequelize.close();

      process.exit(0);
    } catch (error) {
      console.error(
        "Unable to create TRUST_BENEFITS:",
        error
      );

      try {
        await db.sequelize.close();
      } catch {
        // ignore
      }

      process.exit(1);
    }
  };

createTrustBenefitsSectionType();