const express = require("express");
const session = require("./session.controller");
const authVerify = require("../../middlewares/authVerify");
const router = express.Router();

router.post("/form", session.createForm);
router.post("/", session.createSession);
router.use(authVerify);
router.get("/", session.getSessions);
router.get("/case", session.getCases)
router.get("/remark", session.getRemark);
router.get("/notification", session.getNotifications);
router.put("/accept/:id", session.acceptSession);
router.put("/reschedule/:id", session.rescheduleSession);
router.put("/cancel/:id", session.cancelSession);
router.get("/case/:id", session.getSessionsWithCaseId);
router.put("/case/remark/:id", session.addRemark)
router.get("/:id", session.getSession);
module.exports = router;
