const path = require("path");

const formatDuration = (startedAt) => {
  const durationMs =
    Date.now() - startedAt;

  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }

  return `${(
    durationMs / 1000
  ).toFixed(2)} seconds`;
};

const executeSeeder = async ({
  db,
  seeder,
  context,
}) => {
  const startedAt = Date.now();

  const seederName =
    seeder.name ||
    "Unnamed seeder";

  console.log("");
  console.log(
    `▶ Running: ${seederName}`
  );

  if (
    typeof seeder.run !==
    "function"
  ) {
    throw new Error(
      `${seederName} does not export a run function.`
    );
  }

  const result =
    await seeder.run({
      db,
      context,
    });

  console.log(
    `✓ Completed: ${seederName} (${formatDuration(
      startedAt
    )})`
  );

  if (result) {
    console.log(result);
  }
};

const runSeeders = async ({
  db,
  seeders,
  context = {},
}) => {
  const startedAt = Date.now();

  try {
    console.log("");
    console.log(
      "========================================"
    );
    console.log(
      " MyShops Database Seeder"
    );
    console.log(
      "========================================"
    );

    await db.sequelize.authenticate();

    console.log(
      "✓ Database connection established."
    );

    await db.sequelize.sync({
      alter: false,
    });

    console.log(
      "✓ Sequelize models synchronized."
    );

    const orderedSeeders = [
      ...seeders,
    ].sort(
      (
        first,
        second
      ) =>
        Number(
          first.order || 0
        ) -
        Number(
          second.order || 0
        )
    );

    for (const seeder of orderedSeeders) {
      await executeSeeder({
        db,
        seeder,
        context,
      });
    }

    console.log("");
    console.log(
      "========================================"
    );
    console.log(
      ` All seeders completed in ${formatDuration(
        startedAt
      )}`
    );
    console.log(
      "========================================"
    );
    console.log("");
  } catch (error) {
    console.error("");
    console.error(
      "========================================"
    );
    console.error(
      " Database seeding failed"
    );
    console.error(
      "========================================"
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    await db.sequelize.close();
  }
};

module.exports = {
  runSeeders,
};