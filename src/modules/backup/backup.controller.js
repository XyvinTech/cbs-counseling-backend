const archiver = require("archiver");
const responseHandler = require("../../helpers/responseHandler");
const User = require("../../models/userModel");
const Type = require("../../models/typeModel");
const Event = require("../../models/eventModel");
const Time = require("../../models/timeModel");
const Case = require("../../models/caseModel");
const Session = require("../../models/sessionModel");
const Form = require("../../models/formModel");
const Notification = require("../../models/notificationModel");
const TimeRemovalLog = require("../../models/timeRemovalLog");

exports.createBackup = async (req, res) => {
  try {
    const [
      users,
      counsellingTypes,
      events,
      times,
      cases,
      sessions,
      forms,
      notifications,
      timeRemovalLogs,
    ] = await Promise.all([
      User.find(),
      Type.find(),
      Event.find(),
      Time.find(),
      Case.find(),
      Session.find(),
      Form.find(),
      Notification.find(),
      TimeRemovalLog.find(),
    ]);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="backup.zip"');

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    archive.append(JSON.stringify(users, null, 2), { name: "users.json" });
    archive.append(JSON.stringify(counsellingTypes, null, 2), {
      name: "counsellingTypes.json",
    });
    archive.append(JSON.stringify(events, null, 2), { name: "events.json" });
    archive.append(JSON.stringify(times, null, 2), {
      name: "times.json",
    });
    archive.append(JSON.stringify(cases, null, 2), { name: "cases.json" });
    archive.append(JSON.stringify(sessions, null, 2), {
      name: "sessions.json",
    });
    archive.append(JSON.stringify(forms, null, 2), {
      name: "forms.json",
    });
    archive.append(JSON.stringify(notifications, null, 2), {
      name: "notifications.json",
    });
    archive.append(JSON.stringify(timeRemovalLogs, null, 2), {
      name: "timeRemovalLogs.json",
    });

    archive.finalize();
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};
