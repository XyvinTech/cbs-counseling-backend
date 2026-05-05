const express = require("express");
const user = require("./user.controller");
const authVerify = require("../../middlewares/authVerify");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.get("/student/:gr", user.getStudent);
router.get("/counsellors", user.getCounsellors);
router.use(authVerify);
router.route("/").post(user.createUser).get(user.getProfile);
router.route("/bulk").post(user.bulkCreate).delete(user.bulkDelete);
router.get("/list", user.getUsers);
router.post("/seed-users", upload.single("file"), user.seedUsers);
router
  .route("/:id")
  .get(user.getUser)
  .put(user.updateUser)
  .delete(user.deleteUser);

module.exports = router;
