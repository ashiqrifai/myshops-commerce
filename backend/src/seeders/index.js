require("dotenv").config();

const db = require("../models");

const {
  runSeeders,
} = require("./seedRunner");

const systemSettingsSeeder =
  require("./001-system-settings.seed");

const cmsSectionTypesSeeder =
  require("./002-cms-section-types.seed");

const seeders = [
  systemSettingsSeeder,
  cmsSectionTypesSeeder,
];

runSeeders({
  db,
  seeders,
  context: {
    companyCode:
      process.env.SEED_COMPANY_CODE ||
      "MYSHOPS",
  },
});