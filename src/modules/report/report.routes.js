const express = require("express");
const { report } = require("./report.controller");
const authVerify = require("../../middlewares/authVerify");
const router = express.Router();

router.use(authVerify);
router.get("/", report);

module.exports = router;
