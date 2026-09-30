const fs = require("fs");
const path = require("path");

const sequelize = require("../config/database");

const MIGRATIONS_DIR = path.resolve(
  __dirname,
  "../../sql/migrations"
);

const ensureMigrationTable = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      migration_name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
};

const getAppliedMigrations = async () => {
  const [rows] = await sequelize.query(`
    SELECT migration_name
    FROM schema_migrations
    ORDER BY migration_name;
  `);

  return new Set(
    rows.map((row) => row.migration_name)
  );
};

const getMigrationFiles = () => {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();
};

const runMigration = async (fileName) => {
  const filePath = path.join(
    MIGRATIONS_DIR,
    fileName
  );

  const sql = fs.readFileSync(
    filePath,
    "utf8"
  );

  const transaction =
    await sequelize.transaction();

  try {
    console.log(`Running: ${fileName}`);

    await sequelize.query(sql, {
      transaction,
    });

    await sequelize.query(
      `
        INSERT INTO schema_migrations (
          migration_name
        )
        VALUES (:fileName);
      `,
      {
        replacements: {
          fileName,
        },
        transaction,
      }
    );

    await transaction.commit();

    console.log(`Applied: ${fileName}`);
  } catch (error) {
    await transaction.rollback();

    console.error(
      `Migration failed: ${fileName}`
    );

    throw error;
  }
};

const main = async () => {
  try {
    await sequelize.authenticate();

    console.log(
      "Database connection established."
    );

    await ensureMigrationTable();

    const applied =
      await getAppliedMigrations();

    const files =
      getMigrationFiles();

    if (!files.length) {
      console.log(
        "No migration files found."
      );

      return;
    }

    let appliedCount = 0;

    for (const file of files) {
      if (applied.has(file)) {
        console.log(
          `Already applied: ${file}`
        );

        continue;
      }

      await runMigration(file);

      appliedCount += 1;
    }

    if (appliedCount === 0) {
      console.log(
        "Database is already up to date."
      );
    } else {
      console.log(
        `${appliedCount} migration(s) applied successfully.`
      );
    }
  } catch (error) {
    console.error(
      "Migration process failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

main();