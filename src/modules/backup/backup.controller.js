const archiver = require("archiver");
const responseHandler = require("../../helpers/responseHandler");
const Church = require("../../models/churchModel");
const Plan = require("../../models/planModel");
const Subscription = require("../../models/subscriptionModel");
const User = require("../../models/userModel");

exports.createBackup = async (req, res) => {
  try {
    const [users, churches, plans, subscriptions] = await Promise.all([
      User.find(),
      Church.find(),
      Plan.find(),
      Subscription.find(),
    ]);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="backup.zip"');

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    archive.append(JSON.stringify(users, null, 2), { name: "users.json" });
    archive.append(JSON.stringify(churches, null, 2), {
      name: "churches.json",
    });
    archive.append(JSON.stringify(plans, null, 2), { name: "plans.json" });
    archive.append(JSON.stringify(subscriptions, null, 2), {
      name: "subscriptions.json",
    });

    archive.finalize();
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};
