require("dotenv").config();
const responseHandler = require("../../helpers/responseHandler");
const Case = require("../../models/caseModel");
const Event = require("../../models/eventModel");
const Session = require("../../models/sessionModel");
const User = require("../../models/userModel");

exports.dashboard = async (req, res) => {
  try {
    let { page = 1, limit = 10, searchQuery, status } = req.query;
    page = Number(page);
    limit = Number(limit);
    const skipCount = limit * (page - 1);

    const filter = {};
    if (searchQuery) {
      filter.$or = [
        { "form_id.name": new RegExp(searchQuery, "i") },
        { "counsellor.name": new RegExp(searchQuery, "i") },
      ];
    }
    if (status) {
      filter.status = status;
    }

    const [
      student_count,
      counsellor_count,
      case_count,
      session_count,
      event_count,
    ] = await Promise.all([
      User.countDocuments({ userType: "student" }),
      User.countDocuments({ userType: "counsellor" }),
      Case.countDocuments(),
      Session.countDocuments(),
      Event.countDocuments(),
    ]);

    const dashboardData = {
      student_count,
      counsellor_count,
      case_count,
      session_count,
      event_count,
    };

    return responseHandler(
      res,
      200,
      "Dashboard retrieved successfully",
      dashboardData
    );
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};
