  const path = require("path");
  const express = require("express");
  const cors = require("cors");
  const helmet = require("helmet");
  const morgan = require("morgan");
  const cookieParser = require("cookie-parser");

  const env = require("./config/env");

  const apiRoutes = require("./routes");
  const healthRoutes = require("./routes/healthRoutes");
  

  const notFound = require("./middleware/notFound");
  const errorHandler = require("./middleware/errorHandler");
  

  const publicNavigationRoutes =
    require(
      "./modules/navigation/publicNavigation.routes"
    );
  
    const publicCategoryRoutes =
    require(
      "./modules/categories/publicCategory.routes"
    );

    

  const app = express();

  app.disable("x-powered-by");

  app.set("trust proxy", 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: "cross-origin",
      },
    })
  );

  app.use(
    cors({
      origin: [
        env.urls.adminWebUrl,
        env.urls.publicWebUrl,
      ],
      credentials: true,
      methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
      ],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-Device-Id",
        "x-company-code",
      ],
    })
  );

  app.use(express.json({ limit: "25mb" }));
  app.use(
    express.urlencoded({
      extended: true,
      limit: "25mb",
    })
  );

  app.use(cookieParser());

  if (env.nodeEnv === "development") {
    app.use(morgan("dev"));
  } else {
    app.use(morgan("combined"));
  }

  app.get("/", (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        name: "MyShops Commerce API",
        message: "API is running.",
      },
    });
  });

  app.use("/health", healthRoutes);

  app.use(
    "/media",
    express.static(
      path.resolve(
        process.cwd(),
        "storage",
        "media"
      ),
      {
        fallthrough: false,
        immutable: false,
        maxAge:
          env.nodeEnv === "production"
            ? "7d"
            : 0,
      }
    )
  );

  app.use("/api/v1", apiRoutes);
  app.use(
    "/api/v1/public/navigation",
    publicNavigationRoutes
  );


  app.use(
    "/api/v1/public/categories",
    publicCategoryRoutes
  );

  app.use(notFound);
  app.use(errorHandler);

  module.exports = app;