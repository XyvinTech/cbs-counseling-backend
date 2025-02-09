const express = require("express");
const time = require("./time.controller");
const authVerify = require("../../middlewares/authVerify");
const router = express.Router();

router.get("/counsellors/:id/times", time.getAvailableTimes);
router.get("/counsellors/:id/days", time.getDays);
router.use(authVerify);
router.route("/").post(time.createTime).get(time.getTimes);
router.route("/:id").post(time.deleteTime);
module.exports = router;
