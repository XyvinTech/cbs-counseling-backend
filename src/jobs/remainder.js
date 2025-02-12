const cron = require("node-cron");
const moment = require("moment-timezone");
const Event = require("../models/eventModel");
const sendMail = require("../utils/sendMail");
require("dotenv").config();

cron.schedule("0 0 * * *", async () => {
  const now = moment().tz("Asia/Kolkata").startOf("day");

  try {
    const progressEvents = await Event.find({
      date: { $gte: now.toDate() },
    }).populate("counselor", "email");

    for (const event of progressEvents) {
      if (event.remainder.length > 0) {
        const counselorEmails = event.counselor.map((c) => c.email);
        const eventDate = moment(event.date).tz("Asia/Kolkata").startOf("day");

        if (now.isAfter(eventDate)) continue;

        const isWeekly =
          event.remainder.includes("weekly") &&
          now.isoWeekday() === eventDate.isoWeekday();
        const isMonthly =
          event.remainder.includes("monthly") &&
          now.date() === eventDate.date();

        if (isWeekly || isMonthly) {
          await sendMail({
            to: counselorEmails,
            subject: `Reminder: ${event.title}`,
            text: `The event "${
              event.title
            }" is scheduled on ${eventDate.format("LLL")} at ${
              event.venue
            }. Please be prepared.`,
          });
          console.log(`Notification sent for event "${event.title}"`);
        }
      }
    }
  } catch (err) {
    console.error("Error updating events:", err);
  }
});
