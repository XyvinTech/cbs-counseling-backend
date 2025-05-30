require("dotenv").config();
const express = require("express");
const cors = require("cors");
const volleyball = require("volleyball");
const clc = require("cli-color");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const https = require("https");
const http = require("http");
const responseHandler = require("./src/helpers/responseHandler");
const userRoutes = require("./src/modules/user/user.routes");
const authRoutes = require("./src/modules/auth/auth.routes");
const backupRoutes = require("./src/modules/backup/backup.routes");
const dashboardRoutes = require("./src/modules/dashboard/dashboard.routes");
const typeRoutes = require("./src/modules/type/type.routes");
const eventRoutes = require("./src/modules/event/event.routes");
const sessionRoute = require("./src/modules/session/session.routes");
const timeRoute = require("./src/modules/time/time.routes");
const reportRoute = require("./src/modules/report/report.routes");

//! Creatde an instance of the Express application
const app = express();
//* Define the PORT & API version based on environment variable
const { PORT, API_VERSION, NODE_ENV, HTTP_PORT } = process.env;
//* Use volleyball for request logging
app.use(volleyball);
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

//? Define a route for the API root
app.get(BASE_PATH, (req, res) => {
  return responseHandler(
    res,
    200,
    "🛡️ Welcome! All endpoints are fortified. Do you possess the master 🗝️?"
  );
});

//* Configure routes for user API
app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/users`, userRoutes);
app.use(`${BASE_PATH}/counselling-type`, typeRoutes);
app.use(`${BASE_PATH}/backup`, backupRoutes);
app.use(`${BASE_PATH}/dashboard`, dashboardRoutes);
app.use(`${BASE_PATH}/events`, eventRoutes);
app.use(`${BASE_PATH}/sessions`, sessionRoute);
app.use(`${BASE_PATH}/times`, timeRoute);
app.use(`${BASE_PATH}/report`, reportRoute);

//* Define the directory where the files will be uploaded
const uploadDir = "C:/cbs_school_files";
//* Serve static files from the cbs_school folder
app.use("/images", express.static(uploadDir));

//* Ensure the directory exists, if not, create it
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

//! Set up multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

//* Set up multer middleware
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    cb(null, true); // Accept all file types
  },
});

//* Create a simple POST route for file upload
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

// !For any other request, serve index.html from the frontend build folder
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendBuildPath, "index.html"));
});

if (NODE_ENV === "development") {
  // In development mode, run an HTTP server
  app.listen(PORT, () => {
    console.log(
      clc.greenBright(`✓ HTTP Development App is running on port: ${PORT}`)
    );
    console.log(clc.yellowBright(`✓ Environment: ${NODE_ENV}`));
  });
} else {
  // Load the SSL options (private key, certificate, and CA bundle) for production
  const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, "ssl", "private.key")), // Private Key
    cert: fs.readFileSync(path.join(__dirname, "ssl", "certificate.crt")), // Public Certificate
    ca: fs.readFileSync(path.join(__dirname, "ssl", "ca_bundle.crt")), // CA Bundle (optional but recommended)
  };

  //! Start the HTTPS server
  https.createServer(sslOptions, app).listen(PORT, () => {
    const portMessage = clc.redBright(
      `✓ HTTPS App is running on port: ${PORT}`
    );
    const envMessage = clc.yellowBright(`✓ Environment: ${NODE_ENV}`);
    console.log(`${portMessage}\n${envMessage}`);
  });

  // Create an HTTP server that redirects to HTTPS
  http
    .createServer((req, res) => {
      // Redirect any incoming request to HTTPS
      res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
      res.end();
    })
    .listen(HTTP_PORT, () => {
      console.log(
        clc.blueBright(
          `HTTP to HTTPS redirect is running on port: ${HTTP_PORT}`
        )
      );
    });
}
