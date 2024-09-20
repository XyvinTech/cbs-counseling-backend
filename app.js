require("dotenv").config();
const express = require("express");
const cors = require("cors");
const volleyball = require("volleyball");
const clc = require("cli-color");
const path = require("path");
const responseHandler = require("./src/helpers/responseHandler");
const {
  swaggerUi,
  swaggerSpec,
  swaggerOptions,
} = require("./src/swagger/swagger");
const adminRoute = require("./src/routes/admin");
const counsellorRoute = require("./src/routes/counsellor");
const userRoute = require("./src/routes/user");
const app = express();
app.use(volleyball);

//* Define the PORT & API version based on environment variable
const { PORT, API_VERSION, NODE_ENV } = process.env;
//* Enable Cross-Origin Resource Sharing (CORS) middleware
app.use(cors());
//* Parse JSON request bodies
app.use(express.json());
//* Set the base path for API routes
const BASE_PATH = `/api/${API_VERSION}`;

//* Import database connection module
require("./src/helpers/connection");

//! Define the absolute path to the frontend build directory
const frontendBuildPath = path.join(__dirname, '..', 'cbs-counseling-frontend', 'dist');

// !Serve static files from the frontend build directory
app.use(express.static(frontendBuildPath));

// !For any other request, serve index.html from the frontend build folder
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

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
    "🛡️ Welcome! All endpoints are fortified. Do you possess the master 🗝️?"
  );
});

//! Start the server and listen on the specified port from environment variable
app.listen(PORT, () => {
  const portMessage = clc.redBright(`✓ App is running on port: ${PORT}`);
  const envMessage = clc.yellowBright(`✓ Environment: ${NODE_ENV}`);
  console.log(`${portMessage}\n${envMessage}`);
});
