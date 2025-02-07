const express = require("express");
const { createBackup } = require("./backup.controller");
const authVerify = require("../../middlewares/authVerify");
const router = express.Router();

router.use(authVerify);
router.get("/", createBackup);

module.exports = router;
