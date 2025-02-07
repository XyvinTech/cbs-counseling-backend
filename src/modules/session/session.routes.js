const express = require("express");
const session = require("./session.controller");
const authVerify = require("../../middlewares/authVerify");
const router = express.Router();

router.post("/form", session.createForm);
router.post("/", session.createSession);
router.use(authVerify);

module.exports = router;
