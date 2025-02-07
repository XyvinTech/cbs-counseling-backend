const express = require("express");
const event = require("./event.controller");
const authVerify = require("../../middlewares/authVerify");
const router = express.Router();

router.use(authVerify);

router
  .route("/")
  .post(event.createEvent)
  .delete(event.bulkDelete)
  .get(event.getEvents);
router.route("/:id").put(event.editEvent).delete(event.deleteEvent);

module.exports = router;
