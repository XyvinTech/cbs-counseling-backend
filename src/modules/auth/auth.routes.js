const express = require("express");
const auth = require("./auth.controller");
const authVerify = require("../../middlewares/authVerify");
const router = express.Router();

router.post("/login", auth.login);
router.post("/send-otp", auth.sendOTP);
router.post("/verify-otp", auth.verifyOTP);
router.use(authVerify);
router.post("/signup", auth.signup);
router.post("/reset-password", auth.resetPassword);

module.exports = router;
