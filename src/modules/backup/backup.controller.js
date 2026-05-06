const archiver = require("archiver");
const { parse, transforms } = require("json2csv");
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

const { flatten } = transforms;

/** @param {unknown[]} docs */
function collectionToCsv(docs) {
  const plain = JSON.parse(JSON.stringify(docs ?? []));
  if (!plain.length) {
    return "no_rows\n";
  }
  return parse(plain, {
    transforms: [flatten({ objects: true, arrays: true })],
  });
}

exports.createBackup = async (req, res) => {
  try {
    const format = String(req.query.format || "json").toLowerCase();
    const isCsv = format === "csv";

    if (format !== "json" && format !== "csv") {
      return responseHandler(res, 400, 'Invalid format. Use "json" or "csv".');
    }

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
      User.find().lean(),
      Type.find().lean(),
      Event.find().lean(),
      Time.find().lean(),
      Case.find().lean(),
      Session.find().lean(),
      Form.find().lean(),
      Notification.find().lean(),
      TimeRemovalLog.find().lean(),
    ]);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="backup.${isCsv ? "csv" : "json"}.zip"`
    );

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    const ext = isCsv ? "csv" : "json";
    const entries = [
      { name: `users.${ext}`, data: users },
      { name: `counsellingTypes.${ext}`, data: counsellingTypes },
      { name: `events.${ext}`, data: events },
      { name: `times.${ext}`, data: times },
      { name: `cases.${ext}`, data: cases },
      { name: `sessions.${ext}`, data: sessions },
      { name: `forms.${ext}`, data: forms },
      { name: `notifications.${ext}`, data: notifications },
      { name: `timeRemovalLogs.${ext}`, data: timeRemovalLogs },
    ];

    for (const { name, data } of entries) {
      const body = isCsv
        ? collectionToCsv(data)
        : JSON.stringify(data, null, 2);
      archive.append(body, { name });
    }

    archive.finalize();
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};
