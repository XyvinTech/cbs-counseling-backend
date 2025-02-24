const moment = require("moment-timezone");
const responseHandler = require("../../helpers/responseHandler");
const Case = require("../../models/caseModel");
const Form = require("../../models/formModel");
const Session = require("../../models/sessionModel");
const User = require("../../models/userModel");
const { generateCasePDF } = require("../../utils/generateCasePDF");
const { generateSessionPDF } = require("../../utils/generateSessionPDF");

exports.report = async (req, res) => {
  try {
    const {
      reportType,
      startDate,
      endDate,
      counselingType,
      counsellor,
      grNumber,
    } = req.query;

    const counsellorFilter = await getCounsellorFilter(counsellor);
    const grNumberFilter = await getGrNumberFilter(grNumber);
    const dateFilter = getDateFilter(reportType, startDate, endDate);

    const filter = { ...counsellorFilter, ...dateFilter };

    let headers = [];
    let data = [];

    switch (reportType) {
      case "session":
        ({ headers, data } = await generateSessionReport(
          filter,
          grNumberFilter
        ));
        break;
      case "case":
        ({ headers, data } = await generateCaseReport(filter, grNumberFilter));
        break;
      case "session-count":
        ({ headers, data } = await generateSessionCountReport(
          filter,
          grNumberFilter
        ));
        break;
      case "counseling-type":
        ({ headers, data } = await generateCounselingTypeReport(
          filter,
          counselingType
        ));
        break;
      default:
        return responseHandler(res, 400, "Invalid report type");
    }

    return responseHandler(res, 200, "Excel data created successfully", {
      headers,
      data,
    });
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

const getCounsellorFilter = async (counsellor) => {
  const filter = {};
  if (counsellor === "*") {
    const allCounsellors = await User.find({ userType: "counsellor" }).select(
      "_id"
    );
    if (allCounsellors.length > 0) {
      filter.counsellor = { $in: allCounsellors.map((user) => user._id) };
    }
  } else if (counsellor) {
    filter.counsellor = counsellor;
  }
  return filter;
};

const getGrNumberFilter = async (grNumber) => {
  let grNumberFilter = {};
  if (grNumber === "*") {
    const allGrNumbers = await Form.find().select("grNumber");
    if (allGrNumbers.length > 0) {
      grNumberFilter = {
        grNumber: { $in: allGrNumbers.map((form) => form.grNumber) },
      };
    }
  } else if (grNumber) {
    grNumberFilter = { grNumber };
  }
  return grNumberFilter;
};

const getDateFilter = (reportType, startDate, endDate) => {
  const filter = {};
  if (["session", "session-count", "counseling-type"].includes(reportType)) {
    filter.session_date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else if (reportType === "case") {
    filter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }
  return filter;
};

const generateSessionReport = async (filter, grNumberFilter) => {
  const sessions = await Session.find(filter)
    .populate({
      path: "form_id",
      match: grNumberFilter,
    })
    .populate("case_id")
    .populate("counsellor");

  const filteredSessions = sessions.filter((session) => session.form_id);

  const headers = [
    "Case ID",
    "Session ID",
    "Student Name",
    "Counsellor Name",
    "Counseling Type",
    "Session Date",
    "Session Time",
    "Description",
    "Status",
  ];

  const data = filteredSessions.map((session) => {
    const formattedSession = {
      case_id: session.case_id?.case_id || "N/A",
      session_id: session.session_id || "N/A",
      student_name: session.form_id?.name || "N/A",
      counsellor_name: session.counsellor?.name || "N/A",
      counseling_type: session.counsellor?.counsellorType || "N/A",
      session_date: moment(session.session_date).format("DD-MM-YYYY"),
      session_time: session.session_time
        ? `${session.session_time.start || "N/A"} - ${
            session.session_time.end || "N/A"
          }`
        : "N/A",
      description: session.description || "N/A",
      status: session.status || "N/A",
    };

    return Object.fromEntries(
      Object.entries(formattedSession).filter(([_, value]) => value !== "N/A")
    );
  });

  return { headers, data };
};

const generateCaseReport = async (filter, grNumberFilter) => {
  const cases = await Case.find(filter)
    .populate({
      path: "form_id",
      match: grNumberFilter,
    })
    .populate({
      path: "session_ids",
      populate: {
        path: "counsellor",
      },
    });

  const validCases = cases.filter((caseItem) => caseItem.form_id !== null);

  const headers = [
    "Case ID",
    "Student Name",
    "Counsellor Name",
    "Counseling Type",
    "Status",
    "Session ID",
    "Session Date",
    "Session Time",
    "Description",
    "Case Details",
  ];

  const data = validCases.flatMap((caseItem) => {
    if (!caseItem.session_ids?.length) {
      return {
        case_id: caseItem.case_id,
        student_name: caseItem.form_id.name || "N/A",
        counsellor_name: "N/A",
        counseling_type: "N/A",
        status: caseItem.status || "N/A",
        session_id: "N/A",
        session_date: "N/A",
        session_time: "N/A",
        description: "N/A",
        case_details: "N/A",
      };
    }

    return caseItem.session_ids.map((session) => ({
      case_id: caseItem.case_id,
      student_name: caseItem.form_id.name || "N/A",
      counsellor_name: session.counsellor?.name || "N/A",
      counseling_type: session.counsellor?.counsellorType || "N/A",
      status: caseItem.status || "N/A",
      session_id: session.session_id || "N/A",
      session_date: session.session_date
        ? moment(session.session_date).format("DD-MM-YYYY")
        : "N/A",
      session_time: session.session_time
        ? `${session.session_time.start || "N/A"} - ${
            session.session_time.end || "N/A"
          }`
        : "N/A",
      description: session.description || "N/A",
      case_details: session.case_details || "N/A",
    }));
  });

  return { headers, data };
};

const generateSessionCountReport = async (filter, grNumberFilter) => {
  const sessions = await Session.aggregate([
    { $match: filter },
    {
      $lookup: {
        from: "forms",
        localField: "form_id",
        foreignField: "_id",
        as: "formDetails",
      },
    },
    { $unwind: "$formDetails" },
    {
      $match: grNumberFilter,
    },
    {
      $group: {
        _id: { counsellor: "$counsellor", referee: "$formDetails.referee" },
        sessionCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id.counsellor",
        foreignField: "_id",
        as: "counsellorDetails",
      },
    },
    { $unwind: "$counsellorDetails" },
    {
      $project: {
        _id: 0,
        counsellorName: "$counsellorDetails.name",
        referee: "$_id.referee",
        sessionCount: 1,
      },
    },
  ]);

  const headers = ["Counsellor Name", "Referee", "Session Count"];
  const data = sessions.map((session) => ({
    counsellor_name: session.counsellorName || "N/A",
    referee: session.referee || "N/A",
    session_count: session.sessionCount || 0,
  }));

  return { headers, data };
};

const generateCounselingTypeReport = async (filter, counselingType) => {
  if (!counselingType) {
    throw new Error("Counselling type is required");
  }
  filter.type = counselingType;
  const sessions = await Session.find(filter)
    .populate("form_id")
    .populate("case_id")
    .populate("counsellor");

  const headers = [
    "Case ID",
    "Session ID",
    "Student Name",
    "Counsellor Name",
    "Counseling Type",
    "Session Date",
    "Session Time",
    "Description",
    "Status",
  ];

  const data = sessions.map((session) => ({
    case_id: session.case_id?.case_id || "N/A",
    session_id: session.session_id || "N/A",
    student_name: session.form_id?.name || "N/A",
    counsellor_name: session.counsellor?.name || "N/A",
    counseling_type: session.counsellor?.counsellorType || "N/A",
    session_date: moment(session.session_date).format("DD-MM-YYYY"),
    session_time: session.session_time
      ? `${session.session_time.start || "N/A"} - ${
          session.session_time.end || "N/A"
        }`
      : "N/A",
    description: session.description || "N/A",
    status: session.status || "N/A",
  }));

  return { headers, data };
};

exports.caseReport = async (req, res) => {
  try {
    const { id } = req.params;
    const cases = await Case.findById(id)
      .populate("form_id")
      .populate("session_ids")
      .populate({
        path: "session_ids",
        populate: {
          path: "counsellor",
        },
      });
    if (!cases) {
      return responseHandler(res, 404, "Case not found");
    }

    const report = await generateCasePDF(cases);

    return responseHandler(res, 200, "Case report generated", report);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.sessionReport = async (req, res) => {
  try {
    const { id } = req.params;
    const getSession = await Session.findById(id)
      .populate("form_id")
      .populate("case_id")
      .populate("counsellor");
    const report = await generateSessionPDF(getSession);
    return responseHandler(res, 200, "Report created successfully", report);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};
