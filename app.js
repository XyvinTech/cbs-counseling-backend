require("dotenv").config();
const express = require("express");
const cors = require("cors");
const volleyball = require("volleyball");
const clc = require("cli-color");
const responseHandler = require("./src/helpers/responseHandler");
const {
  swaggerUi,
  swaggerSpec,
  swaggerOptions,
} = require("./src/swagger/swagger");
const adminRoute = require("./src/routes/admin");
const counsellorRoute = require("./src/routes/counsellor");
const userRoute = require("./src/routes/user");
const initializeTables = require("./src/helpers/tableInitialization");
const loadSecrets = require("./src/config/env.config");
const app = express();
app.use(volleyball);
const initializeConnection = require("./src/helpers/connection");

const NODE_ENV = "dev";

//* Function to start the server
const startServer = async () => {
  try {
    if (NODE_ENV === "production") {
      await loadSecrets();
    }
    //* Define the PORT & API version based on environment variable
    const PORT = 3000;
    const API_VERSION = "v1";
    //* Enable Cross-Origin Resource Sharing (CORS) middleware
    app.use(cors());
    //* Parse JSON request bodies
    app.use(express.json());
    //* Set the base path for API routes
    const BASE_PATH = `/api/${API_VERSION}`;
    //* Import database connection module
    await initializeConnection();
    //! Uncomment this if you don't have a tables created
    // initializeTables()
    //   .then(() => {
    //     console.log(
    //       clc.magentaBright("Table initialization completed successfully.")
    //     );
    //   })
    //   .catch((error) => {
    //     console.error("Error initializing tables:", error);
    //   });

    //* Swagger setup
    app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, swaggerOptions)
    );

    //* Configure routes for user API
    app.use(`${BASE_PATH}/admin`, adminRoute);
    app.use(`${BASE_PATH}/counsellor`, counsellorRoute);
    app.use(`${BASE_PATH}/user`, userRoute);

    //? Define a route for the API root
    app.get(BASE_PATH, (req, res) => {
      return responseHandler(
        res,
        200,
        "🛡️ Welcome! All endpoints are fortified. Do you possess the master 🗝️?",
        null
      );
    });

    //! Start the server and listen on the specified port from environment variable
    app.listen(PORT, () => {
      const portMessage = clc.redBright(`✓ App is running on port: ${PORT}`);
      const envMessage = clc.yellowBright(`✓ Environment: ${NODE_ENV}`);
      console.log(`${portMessage}\n${envMessage}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1); // Exit the application with a non-zero status code
  }
};

//! Start the servers
startServer();
