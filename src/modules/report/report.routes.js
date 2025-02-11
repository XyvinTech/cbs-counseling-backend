const express = require("express");
const report = require("./report.controller");
const authVerify = require("../../middlewares/authVerify");
const router = express.Router();

router.use(authVerify);
router.get("/", report.report);
router.get("/case/:id", report.caseReport);
router.get("/session/:id", report.sessionReport);

module.exports = router;
