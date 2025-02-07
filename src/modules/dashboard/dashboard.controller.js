require("dotenv").config();
const responseHandler = require("../../helpers/responseHandler");
const Case = require("../../models/caseModel");
const Event = require("../../models/eventModel");
const Session = require("../../models/sessionModel");
const User = require("../../models/userModel");

exports.dashboard = async (req, res) => {
  try {
    let { page = 1, limit = 10, searchQuery, status } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skipCount = limit * (page - 1);

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

    const session_list = await Session.find(filter)
      .populate("form_id", "name")
      .populate("counsellor", "name")
      .skip(skipCount)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const mappedData = session_list.map((session) => ({
      ...session,
      user_name: session.form_id?.name || null,
      counsellor_name: session.counsellor?.name || null,
    }));

    const totalCount = await Session.countDocuments(filter);

    const dashboard = {
      student_count,
      counsellor_count,
      case_count,
      session_count,
      event_count,
      session_list: mappedData,
    };

    return responseHandler(res, 200, "Dashboard found", dashboard, totalCount);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};
