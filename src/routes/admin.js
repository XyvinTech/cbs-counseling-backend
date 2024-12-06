const express = require("express");
const adminRoute = express.Router();
const adminController = require("../controllers/adminController");
const authVerify = require("../middlewares/authVerify");

adminRoute.post("/login", adminController.loginAdmin);
adminRoute.post("/send-otp", adminController.sendOTP);
adminRoute.post("/verify-otp", adminController.verifyOTP);
// adminRoute.get("/delete-cases-sessions", adminController.deleteCasesSessions);
// adminRoute.get("/update-numbers", adminController.updateNumbers);

adminRoute.use(authVerify);

adminRoute
  .route("/")
  .post(adminController.createAdmin)
  .get(adminController.getAdmin);

adminRoute.post("/reset-password", adminController.resetPassword);

adminRoute
  .route("/admin/:id")
  .put(adminController.editAdmin)
  .delete(adminController.deleteAdmin);

adminRoute.post("/counsellor", adminController.createCounsellor);
adminRoute.post("/counsellor/add-bulk", adminController.createCounsellorBulk);
adminRoute.post("/student/add-bulk", adminController.createStudentBulk);
adminRoute
  .route("/counsellor/:id")
  .put(adminController.updateCounsellor)
  .delete(adminController.deleteCounsellor);

adminRoute.post("/user/delete-many", adminController.deleteManyUser);

adminRoute.post("/student", adminController.createStudent);
adminRoute
  .route("/student/:id")
  .put(adminController.updateStudent)
  .delete(adminController.deleteStudent);

adminRoute.get("/list", adminController.listController);
adminRoute.get("/sessions/:userId", adminController.getUserSessions);
adminRoute.get("/user/:id", adminController.getUser);
adminRoute.get(
  "/counsellor/sessions/:counsellorId",
  adminController.getCounsellorSessions
);
adminRoute.get(
  "/counsellor/cases/:counsellorId",
  adminController.getCounsellorCases
);
adminRoute.get("/counsellors", adminController.getAllCounsellors);
adminRoute.get("/dashboard", adminController.getDashboard);
adminRoute.post("/event", adminController.createEvent);
adminRoute
  .route("/event/:id")
  .put(adminController.editEvent)
  .delete(adminController.deleteEvent);
adminRoute.post("/event/delete-many", adminController.deleteManyEvent);
adminRoute.get("/big-calendar", adminController.getBigCalender);
adminRoute.get("/sessions/:caseId/case", adminController.getCaseSessions);
adminRoute.get("/session/:id", adminController.getSession);
adminRoute.post("/counselling-type", adminController.createCounsellingType);
adminRoute
  .route("/counselling-type/:id")
  .put(adminController.updateCounsellingType)
  .delete(adminController.deleteCounsellingType);
adminRoute.post(
  "/counselling-type/delete-many",
  adminController.deleteManyCounsellingType
);
adminRoute.get("/sessions-excel", adminController.getSessionsExcel);
adminRoute.post("/student-report", adminController.createStudentReport);

module.exports = adminRoute;
