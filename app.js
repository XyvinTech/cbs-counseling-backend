require("dotenv").config();
const express = require("express");
const cors = require("cors");
const volleyball = require("volleyball");
const clc = require("cli-color");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
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
const frontendBuildPath = path.join(
  __dirname,
  "..",
  "cbs-counseling-frontend",
  "dist"
);

// !Serve static files from the frontend build directory
app.use(express.static(frontendBuildPath));


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

// Define the directory where the files will be uploaded
const uploadDir = "C:/cbs_school";
// Serve static files from the cbs_school folder
app.use('/images', express.static(uploadDir));

// Ensure the directory exists, if not, create it
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // The path to the folder where files will be stored
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Add timestamp to the file name to avoid duplicates
  },
});

// Set up multer middleware
const upload = multer({ storage });

// Create a simple POST route for file upload
app.post(`${BASE_PATH}/upload`, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  return responseHandler(
    res,
    200,
    "File uploaded successfully",
    req.file.filename
  );
});

//? Define a route for the API root
app.get(BASE_PATH, (req, res) => {
  return responseHandler(
    res,
    200,
    "🛡️ Welcome! All endpoints are fortified. Do you possess the master 🗝️?"
  );
});

// !For any other request, serve index.html from the frontend build folder
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendBuildPath, "index.html"));
});

//! Start the server and listen on the specified port from environment variable
app.listen(PORT, () => {
  const portMessage = clc.redBright(`✓ App is running on port: ${PORT}`);
  const envMessage = clc.yellowBright(`✓ Environment: ${NODE_ENV}`);
  console.log(`${portMessage}\n${envMessage}`);
});
