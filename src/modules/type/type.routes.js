const express = require("express");
const type = require("./type.controller");
const authVerify = require("../../middlewares/authVerify");
const router = express.Router();

router.use(authVerify);

router.route("/").post(type.createCounsellingType).delete(type.bulkDelete);
router
  .route("/:id")
  .put(type.updateCounsellingType)
  .delete(type.deleteCounsellingType);

module.exports = router;
