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

router.route("/calender").get(event.getCalender);
router
  .route("/:id")
  .put(event.editEvent)
  .delete(event.deleteEvent)
  .get(event.getEvent);

module.exports = router;
