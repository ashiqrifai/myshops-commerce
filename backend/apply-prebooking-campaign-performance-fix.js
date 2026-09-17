const fs = require("fs");
const path = require("path");

const target = path.resolve(process.cwd(), "src/modules/pre-booking/preBooking.service.js");

if (!fs.existsSync(target)) {
  throw new Error(`Target not found: ${target}\nRun from /var/www/myshops-commerce/backend`);
}

let source = fs.readFileSync(target, "utf8");
const backup = `${target}.bak-campaign-performance-${Date.now()}`;
fs.copyFileSync(target, backup);

const includeStart = source.indexOf("  const buildCampaignInclude =");
const includeEnd = source.indexOf("  /*\n  |--------------------------------------------------------------------------\n  | Serialize Allocation", includeStart);

if (includeStart < 0 || includeEnd < 0) {
  throw new Error("Could not safely locate buildCampaignInclude(). No changes written.");
}

const newInclude = `  /*
  |--------------------------------------------------------------------------
  | Complete Campaign Include - Optimized
  |--------------------------------------------------------------------------
  |
  | Independent hasMany associations are loaded separately to avoid the
  | Cartesian row multiplication caused by one giant joined Sequelize query.
  |--------------------------------------------------------------------------
  */

  const buildCampaignInclude =
    () => [
      {
        model:
          db.PreBookingCampaignProduct,

        as:
          "products",

        required:
          false,

        separate:
          true,

        order: [
          ["sortOrder", "ASC"],
          ["createdAt", "ASC"],
        ],

        include: [
          {
            model:
              db.Product,

            as:
              "product",

            required:
              false,

            include: [
              {
                model:
                  db.Brand,

                as:
                  "brand",

                required:
                  false,
              },

              {
                model:
                  db.ProductVariant,

                as:
                  "variants",

                required:
                  false,

                separate:
                  true,

                order: [
                  ["sortOrder", "ASC"],
                  ["createdAt", "ASC"],
                ],
              },

              {
                model:
                  db.ProductImage,

                as:
                  "images",

                required:
                  false,

                separate:
                  true,

                order: [
                  ["displayOrder", "ASC"],
                  ["createdAt", "ASC"],
                ],

                include: [
                  {
                    model:
                      db.MediaAsset,

                    as:
                      "mediaAsset",

                    required:
                      false,

                    include: [
                      {
                        model:
                          db.MediaAssetVariant,

                        as:
                          "variants",

                        required:
                          false,

                        separate:
                          true,

                        order: [
                          ["variantType", "ASC"],
                          ["createdAt", "ASC"],
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },

          {
            model:
              db.PreBookingBundle,

            as:
              "bundles",

            required:
              false,

            separate:
              true,

            order: [
              ["sortOrder", "ASC"],
              ["createdAt", "ASC"],
            ],

            include: [
              {
                model:
                  db.PreBookingBundleItem,

                as:
                  "items",

                required:
                  false,

                separate:
                  true,

                order: [
                  ["sortOrder", "ASC"],
                  ["createdAt", "ASC"],
                ],
              },

              {
                model:
                  db.ProtectionScheme,

                as:
                  "protectionScheme",

                required:
                  false,
              },

              {
                model:
                  db.PreBookingAllocation,

                as:
                  "allocations",

                required:
                  false,

                separate:
                  true,

                order: [
                  ["sortOrder", "ASC"],
                  ["createdAt", "ASC"],
                ],

                include: [
                  {
                    model:
                      db.ProductVariant,

                    as:
                      "variant",

                    required:
                      false,
                  },
                ],
              },
            ],
          },

          {
            model:
              db.PreBookingAllocation,

            as:
              "allocations",

            required:
              false,

            separate:
              true,

            order: [
              ["sortOrder", "ASC"],
              ["createdAt", "ASC"],
            ],

            include: [
              {
                model:
                  db.ProductVariant,

                as:
                  "variant",

                required:
                  false,
              },
            ],
          },
        ],
      },
    ];

`;

source = source.slice(0, includeStart) + newInclude + source.slice(includeEnd);

/*
 * Replace getCampaignById as a whole. This avoids brittle removal of the
 * previous top-level nested order array.
 */
const getStart = source.indexOf("  exports.getCampaignById =");
const getEnd = source.indexOf("  /*\n  |--------------------------------------------------------------------------\n  | Create Campaign", getStart);

if (getStart < 0 || getEnd < 0) {
  throw new Error(`Could not safely locate getCampaignById(). Restore backup: ${backup}`);
}

const newGet = `  exports.getCampaignById =
    async ({
      companyId,
      campaignId,
    }) => {
      const campaign =
        await db.PreBookingCampaign.findOne({
          where: {
            id:
              campaignId,

            companyId,
          },

          include:
            buildCampaignInclude(),
        });

      if (
        !campaign
      ) {
        throw new AppError(
          "Pre-booking campaign was not found.",
          404,
          "PRE_BOOKING_CAMPAIGN_NOT_FOUND"
        );
      }

      return serializeCampaign(
        campaign
      );
    };

`;

source = source.slice(0, getStart) + newGet + source.slice(getEnd);

fs.writeFileSync(target, source, "utf8");

console.log("Pre-booking campaign performance patch applied successfully.");
console.log(`Backup created: ${backup}`);
console.log(`Updated: ${target}`);
