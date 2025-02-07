const express = require("express");
const type = require("./type.controller");
const authVerify = require("../../middlewares/authVerify");
const router = express.Router();

router.use(authVerify);

router
  .route("/")
  .post(type.createCounsellingType)
  .delete(type.bulkDelete)
  .get(type.getCounsellingTypes);

router
  .route("/:id").get(type.getCounsellingType)
  .put(type.updateCounsellingType)
  .delete(type.deleteCounsellingType);

module.exports = router;
