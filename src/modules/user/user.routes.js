const express = require("express");
const user = require("./user.controller");
const authVerify = require("../../middlewares/authVerify");
const router = express.Router();

router.use(authVerify);
router.route("/").post(user.createUser).get(user.getProfile);
router.route("/bulk").post(user.bulkCreate).delete(user.bulkDelete);
router.get("/list", user.getUsers);
router
  .route("/:id")
  .get(user.getUser)
  .put(user.updateUser)
  .delete(user.deleteUser);

module.exports = router;
