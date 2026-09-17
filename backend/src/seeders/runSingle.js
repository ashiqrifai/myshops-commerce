require(
    "dotenv"
  ).config();
  
  const path =
    require(
      "path"
    );
  
  const db =
    require(
      "../models"
    );
  
  const {
    runSeeders,
  } =
    require(
      "./seedRunner"
    );
  
  const requestedSeeder =
    String(
      process.argv[2] ||
      ""
    ).trim();
  
  if (
    !requestedSeeder
  ) {
    console.error(
      "Seeder name is required."
    );
  
    console.error(
      "Example:"
    );
  
    console.error(
      "node src/seeders/runSingle.js 002-cms-section-types.seed"
    );
  
    process.exit(
      1
    );
  }
  
  let seeder;
  
  try {
    const seederPath =
      path.resolve(
        __dirname,
        requestedSeeder
      );
  
    seeder =
      require(
        seederPath
      );
  } catch (
    error
  ) {
    console.error(
      `Unable to load seeder: ${requestedSeeder}`
    );
  
    console.error(
      error
    );
  
    process.exit(
      1
    );
  }
  
  runSeeders({
    db,
  
    seeders: [
      seeder,
    ],
  
    context: {
      companyCode:
        process.env
          .SEED_COMPANY_CODE ||
        "MYSHOPS",
    },
  });