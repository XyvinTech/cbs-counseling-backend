const express = require("express");
const userCsv = require("./userCsv.controller");
const authVerify = require("../../middlewares/authVerify");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.use(authVerify);
router.post("/import", upload.single("file"), userCsv.importUsersCSV);
router.post("/export", userCsv.exportUsersCSV);

module.exports = router;
