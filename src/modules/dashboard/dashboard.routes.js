const express = require("express");
const { dashboard } = require("./dashboard.controller");
const authVerify = require("../../middlewares/authVerify");
const router = express.Router();

router.use(authVerify);
router.get("/", dashboard);

module.exports = router;
