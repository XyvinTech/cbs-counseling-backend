const express = require("express");
const counsellorRoute = express.Router();
const counsellorController = require("../controllers/counsellorController");
const authVerify = require("../middlewares/authVerify");

counsellorRoute.post("/login", counsellorController.loginCounsellor);

counsellorRoute.use(authVerify);

counsellorRoute.route("/").get(counsellorController.getCounsellor);

counsellorRoute.put("/profile/:id", counsellorController.updateCounsellor);

counsellorRoute
  .route("/times")
  .post(counsellorController.addTimes)
  .get(counsellorController.getTimes);

counsellorRoute.get("/list", counsellorController.listController);
counsellorRoute.put("/accept-session/:id", counsellorController.acceptSession);
counsellorRoute.post("/add-entry/:id", counsellorController.addEntry);
counsellorRoute.get("/counsellors", counsellorController.getAllCounsellors);
counsellorRoute.get("/sessions/:caseId", counsellorController.getCaseSessions);
counsellorRoute.get("/session/:id", counsellorController.getSession);
counsellorRoute.put("/reschedule/:id", counsellorController.rescheduleSession);
counsellorRoute.get(
  "/counsellors/:id/times",
  counsellorController.getAvailableTimes
);
counsellorRoute.post("/counsellors/:id/time", counsellorController.deleteTime);
counsellorRoute.put("/cancel-session/:id", counsellorController.cancelSession);
counsellorRoute.post("/report", counsellorController.createReport);
counsellorRoute.get("/big-calendar", counsellorController.getBigCalender);
counsellorRoute.get("/notifications", counsellorController.getNotifications);
counsellorRoute.put("/notification/:id", counsellorController.markAsRead);
counsellorRoute.post(
  "/student-report",
  counsellorController.createStudentReport
);
counsellorRoute.get("/sessions-excel", counsellorController.getSessionsExcel);
counsellorRoute.post("/event", counsellorController.createEvent);
counsellorRoute
  .route("/event/:id")
  .put(counsellorController.editEvent)
  .delete(counsellorController.deleteEvent);
counsellorRoute.post(
  "/counselling-type/delete-many",
  counsellorController.deleteManyCounsellingType
);

counsellorRoute.put(
  "/case/referee-remark/:id",
  counsellorController.refereeRemark
);

module.exports = counsellorRoute;
