const moment = require("moment-timezone");
const responseHandler = require("../../helpers/responseHandler");
const Case = require("../../models/caseModel");
const Form = require("../../models/formModel");
const Notification = require("../../models/notificationModel");
const Session = require("../../models/sessionModel");
const validations = require("../../validations");
const sendMail = require("../../utils/sendMail");
const mongoose = require("mongoose");
const User = require("../../models/userModel");

exports.createForm = async (req, res) => {
  try {
    const formValidator = validations.formSchema.validate(req.body, {
      abortEarly: true,
    });
    if (formValidator.error) {
      return responseHandler(res, 400, `Invalid input: ${formValidator.error}`);
    }

    const form = await Form.create(req.body);
    return responseHandler(res, 200, "Form created", form);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.createSession = async (req, res) => {
  try {
    const createSessionValidator = validations.createSessionSchema.validate(
      req.body,
      {
        abortEarly: true,
      }
    );
    if (createSessionValidator.error) {
      return responseHandler(
        res,
        400,
        `Invalid input: ${createSessionValidator.error}`
      );
    }
    const session = await Session.create(req.body);
    if (!session) {
      return responseHandler(res, 400, "Session creation failed");
    }

    const count = await Case.countDocuments({ isDeleted: false });
    const case_id = `#CS_${String(count + 1).padStart(2, "0")}`;

    const caseData = await Case.create({
      form_id: req.body.form_id,
      session_ids: [session._id],
      case_id,
    });

    session.case_id = caseData._id;
    session.session_id = `${case_id}/SC_${String(1).padStart(2, "0")}`;
    await session.save();

    const newSession = await Session.findById(session._id)
      .populate("form_id", "name email referee")
      .populate("counsellor", "name email")
      .lean();

    if (!newSession) {
      return responseHandler(res, 400, "Failed to fetch session details");
    }

    const formattedDate = moment(newSession.session_date).format("DD-MM-YYYY");
    const formattedTime = `${newSession.session_time.start}-${newSession.session_time.end}`;

    const emailData = {
      to: newSession.form_id.email,
      subject: `Your session requested with Session ID: ${newSession.session_id} and Case ID: ${case_id} for ${newSession.counsellor.name}`,
      text:
        newSession.form_id.referee === "parent" ||
        newSession.form_id.referee === "teacher"
          ? `Dear ${newSession.form_id.referee},\n\nYour appointment request for ${newSession.form_id.name} has been sent to the Counselor for approval.`
          : `Dear ${newSession.form_id.name},\n\nYour appointment request for ${newSession.counsellor.name} on ${formattedDate} at ${formattedTime} has been sent for approval. We will notify you once approved.`,
    };

    const counsellorData = {
      to: newSession.counsellor.email,
      subject: `New session request: ${newSession.session_id} and Case ID: ${case_id}`,
      text: `Dear ${newSession.counsellor.name},\n\nYou have received an appointment request from ${newSession.form_id.name} for ${formattedDate} at ${formattedTime}. Please review the request for approval.`,
    };

    await Promise.all([sendMail(emailData), sendMail(counsellorData)]);

    await Notification.create({
      user: session.counsellor,
      case_id: caseData._id,
      session: session._id,
      details: "New session requested",
    });

    return responseHandler(res, 201, "Session created successfully", session);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};

exports.getSessions = async (req, res) => {
  try {
    let { page, searchQuery, status, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skipCount = limit * (page - 1);

    const filter = {};

    if (req.user.userType === "counsellor") {
      filter.counsellor = req.userId;
    }

    if (status) {
      filter.status = status;
    }
    if (searchQuery) {
      filter.$or = [
        { "form_id.name": { $regex: searchQuery, $options: "i" } },
        { "counsellor.name": { $regex: searchQuery, $options: "i" } },
      ];
    }
    const sessions = await Session.find(filter)
      .populate("form_id")
      .populate("counsellor")
      .populate("case_id")
      .skip(skipCount)
      .limit(limit)
      .sort({ _id: -1 })
      .lean();

    const mappedData = sessions.map((item) => {
      return {
        ...item,
        user_name: item.form_id.name,
        referee: item.form_id.referee,
        counsellor_name: item.counsellor.name,
        caseid: item.case_id.case_id,
      };
    });

    const count = await Session.countDocuments(filter);

    return responseHandler(res, 200, "Success", mappedData, count);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};

exports.acceptSession = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedSession = await Session.findByIdAndUpdate(
      id,
      { status: "progress" },
      { new: true }
    )
      .populate("form_id")
      .populate("case_id")
      .populate("counsellor");

    if (!updatedSession) {
      return responseHandler(res, 400, "Session acceptance failed");
    }

    if (updatedSession) {
      await Case.findByIdAndUpdate(
        updatedSession.case_id._id,
        { status: "progress" },
        { new: true }
      );
    }

    await Notification.create({
      user: req.userId,
      case_id: updatedSession.case_id?._id,
      session: updatedSession._id,
      details: `Session with ${updatedSession.session_id} is accepted`,
    });

    const emailsToSend = [];
    const sessionDateFormatted = moment(updatedSession.session_date).format(
      "DD-MM-YYYY"
    );
    const sessionTimeRange = `${updatedSession.session_time.start}-${updatedSession.session_time.end}`;

    if (updatedSession.form_id?.email) {
      const isRefereeParentOrTeacher =
        updatedSession.form_id.referee === "parent" ||
        updatedSession.form_id.referee === "teacher";

      const userEmailData = {
        to: updatedSession.form_id.email,
        subject: `Your session with Session ID: ${updatedSession.session_id} has been accepted`,
        text: isRefereeParentOrTeacher
          ? `Dear ${updatedSession.form_id.referee}, Your appointment request for ${updatedSession.form_id.name} has been accepted for Counselor approval.`
          : `Dear ${updatedSession.form_id.name},
          
          Your appointment request for ${
            updatedSession.counsellor.name
          } on ${sessionDateFormatted} at ${sessionTimeRange} has been accepted by the Counselor.

          Here are the session details:
          - Session ID: ${updatedSession.session_id}
          - Case ID: ${updatedSession.case_id?.case_id || "N/A"}
          - Date: ${sessionDateFormatted}
          - Time: ${sessionTimeRange}

          We look forward to seeing you at the scheduled time.

          Thank you.`,
      };

      emailsToSend.push(sendMail(userEmailData));
    }

    if (updatedSession.counsellor?.email) {
      const counselorEmailData = {
        to: updatedSession.counsellor.email,
        subject: `Session with Session ID: ${updatedSession.session_id} has been accepted`,
        text: `Dear ${updatedSession.counsellor.name},

        The session request from ${
          updatedSession.form_id?.name || "a user"
        } has been accepted.

        Here are the session details:
        - Session ID: ${updatedSession.session_id}
        - Case ID: ${updatedSession.case_id?.case_id || "N/A"}
        - Date: ${sessionDateFormatted}
        - Time: ${sessionTimeRange}
        - User: ${updatedSession.form_id?.name || "N/A"}
        - User Email: ${updatedSession.form_id?.email || "N/A"}

        Please prepare for the session accordingly.

        Thank you.`,
      };

      emailsToSend.push(sendMail(counselorEmailData));
    }

    await Promise.all(emailsToSend);

    return responseHandler(
      res,
      200,
      "Session accepted successfully",
      updatedSession
    );
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};

exports.rescheduleSession = async (req, res) => {
  try {
    const { session_date, session_time, c_reschedule_remark } = req.body;
    const { id } = req.params;

    if (!session_date || !session_time) {
      return responseHandler(res, 400, "Session date & time are required");
    }

    const rescheduledSession = await Session.findByIdAndUpdate(
      id,
      {
        session_date,
        session_time,
        c_reschedule_remark,
        status: "progress",
      },
      { new: true }
    )
      .populate("form_id")
      .populate("case_id")
      .populate("counsellor");

    if (!rescheduledSession) {
      return responseHandler(
        res,
        404,
        "Session not found or reschedule failed"
      );
    }

    if (
      rescheduledSession.status !== "pending" &&
      rescheduledSession.status === "rescheduled"
    ) {
      return responseHandler(res, 400, "You can't reschedule this session");
    }

    await Notification.create({
      user: req.userId,
      caseId: rescheduledSession.case_id?._id,
      session: rescheduledSession._id,
      details: "Your session has been rescheduled.",
    });

    const emailsToSend = [];
    const sessionDateFormatted = moment(session_date).format("DD-MM-YYYY");
    const oldSessionDateFormatted = moment(
      rescheduledSession.session_date
    ).format("DD-MM-YYYY");
    const sessionTimeRange = `${session_time.start}-${session_time.end}`;
    const oldSessionTimeRange = `${rescheduledSession.session_time.start}-${rescheduledSession.session_time.end}`;

    if (rescheduledSession.form_id?.email) {
      const userEmailData = {
        to: rescheduledSession.form_id.email,
        subject: `Your session (ID: ${rescheduledSession.session_id}, Case ID: ${rescheduledSession.case_id?.case_id}) has been rescheduled`,
        text: `Dear ${rescheduledSession.form_id.name},
        
        We wanted to inform you that your appointment with ${rescheduledSession.counsellor.name}, originally scheduled for ${oldSessionDateFormatted} at ${oldSessionTimeRange}, has been rescheduled.

        The new session details:
        - Date: ${sessionDateFormatted}
        - Time: ${sessionTimeRange}
        
        We apologize for any inconvenience this may cause. Please feel free to reach out if you have any questions.

        Thank you for your understanding.`,
      };

      emailsToSend.push(sendMail(userEmailData));
    }

    if (rescheduledSession.counsellor?.email) {
      const counselorEmailData = {
        to: rescheduledSession.counsellor.email,
        subject: "Session Rescheduled",
        text: `Session ID: ${rescheduledSession.session_id} has been rescheduled.
        
        - New Date: ${sessionDateFormatted}
        - New Time: ${sessionTimeRange}`,
      };

      emailsToSend.push(sendMail(counselorEmailData));
    }

    await Promise.all(emailsToSend);

    return responseHandler(
      res,
      200,
      "Session rescheduled successfully",
      rescheduledSession
    );
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};

exports.cancelSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { c_cancel_remark } = req.body;

    const session = await Session.findByIdAndUpdate(
      id,
      { c_cancel_remark, status: "cancelled" },
      { new: true }
    )
      .populate("case_id")
      .populate("counsellor")
      .populate("form_id");

    if (!session) {
      return responseHandler(res, 404, "Session not found");
    }

    const caseUpdatePromise = session.case_id
      ? Case.findByIdAndUpdate(
          session.case_id._id,
          { status: "cancelled" },
          { new: true }
        )
      : Promise.resolve(null);

    const emailData = session.form_id?.email
      ? {
          to: session.form_id.email,
          subject: `Your session (ID: ${session.session_id}, Case ID: ${session.case_id?.case_id}) has been cancelled`,
          text: `Dear ${session.form_id.name},
          
          We regret to inform you that your appointment with ${
            session.counsellor?.name
          }, originally scheduled for ${moment(session.session_date).format(
            "DD-MM-YYYY"
          )} at ${session.session_time?.start}-${
            session.session_time?.end
          }, has been cancelled by the counselor for the following reason:
          
          "${c_cancel_remark}"

          We apologize for any inconvenience. Please contact us if you need further assistance.`,
        }
      : null;

    await Promise.all([
      caseUpdatePromise,
      emailData ? sendMail(emailData) : Promise.resolve(),
    ]);

    return responseHandler(res, 200, "Session cancelled successfully");
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};

exports.getSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findById(id)
      .populate("form_id")
      .populate("case_id")
      .populate({
        path: "case_id",
        populate: {
          path: "referer",
          select: "name",
        },
      })
      .populate({
        path: "case_id",
        populate: {
          path: "session_ids",
        },
      })
      .populate("counsellor")
      .lean();
    const student = await User.findOne({
      StudentReferencesCode: session.form_id?.grNumber,
    });
    session.form_id.gender = student?.gender;
    session.form_id.mobile = student?.mobile;
    if (session) {
      return responseHandler(res, 200, "Session found", session);
    }
    return responseHandler(res, 404, "Session not found");
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.getCases = async (req, res) => {
  try {
    const { searchQuery, status, page = 1, limit = 10 } = req.query;
    const skipCount = (page - 1) * limit;

    const query = {};
    if (req.user.userType === "counsellor") {
      query.counsellor = req.userId;
    }

    const sessions = await Session.find(query).populate("counsellor");
    const sessionIds = sessions.map((session) => session._id);

    const filter = { session_ids: { $in: sessionIds } };

    if (status) {
      filter.status = status;
    }

    if (searchQuery) {
      const nameFilter = { name: { $regex: searchQuery, $options: "i" } };

      const matchedForms = await Form.find(nameFilter).select("_id");

      const matchedCounsellors = await User.find(nameFilter)
        .where("userType")
        .equals("counsellor")
        .select("_id");

      const matchedSessions = await Session.find({
        counsellor: { $in: matchedCounsellors.map((c) => c._id) },
      }).select("_id");

      filter.$or = [
        { form_id: { $in: matchedForms.map((form) => form._id) } },
        { session_ids: { $in: matchedSessions.map((s) => s._id) } },
      ];
    }

    const cases = await Case.find(filter)
      .populate({
        path: "session_ids",
        populate: {
          path: "counsellor",
          select: "name",
        },
      })
      .populate("form_id", "name")
      .skip(skipCount)
      .limit(limit)
      .sort({ _id: -1 });

    const mappedData = cases.map((item) => {
      return {
        ...item._doc,
        user_name: item.form_id?.name || "",
        counsellor_name: [
          ...new Set(
            item.session_ids
              ?.map((session) => session.counsellor?.name)
              .filter(Boolean)
          ),
        ].join(", "),
        session_time: item.session_ids.length
          ? item.session_ids[item.session_ids.length - 1].session_time
          : null,
        type: item.session_ids.length
          ? item.session_ids[item.session_ids.length - 1].type
          : null,
        session_count: item.session_ids.length,
      };
    });

    const totalCount = await Case.countDocuments(filter);

    return responseHandler(res, 200, "Cases found", mappedData, totalCount);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};

exports.getRemark = async (req, res) => {
  try {
    const { searchQuery, status } = req.query;
    const matchStage = {
      referer: new mongoose.Types.ObjectId(req.userId),
    };

    if (status) {
      matchStage.status = status;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "forms",
          localField: "form_id",
          foreignField: "_id",
          as: "form",
        },
      },
      { $unwind: "$form" },
    ];

    if (searchQuery) {
      pipeline.push({
        $match: {
          "form.name": { $regex: searchQuery, $options: "i" },
        },
      });
    }

    pipeline.push(
      {
        $lookup: {
          from: "sessions",
          localField: "session_ids",
          foreignField: "_id",
          as: "sessions",
        },
      },
      {
        $addFields: {
          lastSession: { $arrayElemAt: ["$sessions", -1] },
        },
      },
      {
        $project: {
          _id: 1,
          user_name: "$form.name",
          couselling_type: "$lastSession.type",
          description: "$lastSession.description",
          status: 1,
          referer: 1,
          form_id: 1,
          session_ids: 1,
          case_id: 1,
          referer_remark: 1,
          reason_for_closing: 1,
          isDeleted: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      }
    );

    const sessions = await Case.aggregate(pipeline);
    const totalCount = sessions.length;

    return responseHandler(res, 200, "Remark found", sessions, totalCount);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.userId,
      isRead: false,
    });

    if (!notifications || notifications.length === 0) {
      return responseHandler(res, 400, `No Notification found`);
    }

    await Notification.updateMany(
      { user: req.userId, isRead: false },
      { $set: { isRead: true } }
    );

    return responseHandler(res, 200, `Notifications Found`, notifications);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.getSessionsWithCaseId = async (req, res) => {
  try {
    const { id } = req.params;
    const sessions = await Session.find({ case_id: id })
      .populate("form_id")
      .populate("counsellor");

    const mappedData = sessions.map((session) => {
      return {
        ...session._doc,
        user_name: session.form_id.name,
        counsellor_name: session.counsellor.name,
      };
    });

    return responseHandler(res, 200, "Sessions found", mappedData);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.addRemark = async (req, res) => {
  try {
    const { id } = req.params;
    const { remark } = req.body;

    const findCase = await Case.findById(id);
    const remarks = findCase.referer_remark;
    const counsellor = await User.findById(req.userId);
    const referee_remark = {
      name: counsellor.name,
      remark: remark,
    };
    let updatedRemarks = [];
    if (remarks === null) {
      updatedRemarks.push(referee_remark);
    } else {
      updatedRemarks = [...remarks, referee_remark];
    }
    findCase.referer_remark.push(referee_remark);
    const updateRemark = await findCase.save();
    if (!updateRemark) return responseHandler(res, 400, "Remark update failed");
    return responseHandler(
      res,
      200,
      "Remark updated successfully",
      updateRemark
    );
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};

exports.getSessionsWithFormId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, searchQuery = "", limit = 10 } = req.query;

    const skipCount = (page - 1) * limit;

    const match = {};
    if (userId) {
      match["form_id.grNumber"] = userId;
    }

    if (searchQuery) {
      match.$or = [
        { "form_id.name": { $regex: searchQuery, $options: "i" } },
        { "counsellor.name": { $regex: searchQuery, $options: "i" } },
      ];
    }

    const pipeline = [
      { $sort: { _id: -1 } },
      { $skip: skipCount },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: "forms",
          localField: "form_id",
          foreignField: "_id",
          as: "form_id",
        },
      },
      { $match: match },
      {
        $lookup: {
          from: "users",
          localField: "counsellor",
          foreignField: "_id",
          as: "counsellor",
        },
      },
      {
        $unwind: { path: "$form_id", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: "$counsellor", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          id: "$_id",
          session_date: 1,
          session_time: 1,
          name: "$form_id.name",
          counsellor_name: "$counsellor.name",
          counsellor_type: "$counsellor.counsellorType",
          session_id: 1,
        },
      },
    ];

    const sessions = await Session.aggregate(pipeline);

    const totalCountPipeline = [{ $match: match }, { $count: "totalCount" }];
    const totalCountResult = await Session.aggregate(totalCountPipeline);
    const totalCount = totalCountResult[0]?.totalCount || 0;

    return responseHandler(res, 200, "Sessions found", sessions, totalCount);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};

exports.getSessionsWithCounsellorId = async (req, res) => {
  try {
    const userId = req.params.counsellorId;
    const { page, searchQuery, limit = 10 } = req.query;
    const skipCount = 10 * (page - 1);
    const filter = {
      counsellor: userId,
    };
    if (searchQuery) {
      filter.$or = [
        { "form_id.name": { $regex: searchQuery, $options: "i" } },
        { "counsellor.name": { $regex: searchQuery, $options: "i" } },
      ];
    }
    const sessions = await Session.find(filter)
      .populate("form_id")
      .populate("counsellor")
      .skip(skipCount)
      .limit(limit)
      .sort({ _id: -1 })
      .lean();
    const mappedData = sessions.map((session) => {
      return {
        _id: session._id,
        session_id: session.session_id,
        session_date: session.session_date,
        session_time: session.session_time,
        student_name: session.form_id.name,
        counsellor_type: session.type,
        status: session.status,
      };
    });

    const totalCount = await Session.countDocuments(filter);
    return responseHandler(res, 200, "Sessions found", mappedData, totalCount);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.getCasesWithCounsellorId = async (req, res) => {
  try {
    const userId = req.params.counsellorId;
    const { page = 1, searchQuery = "", limit = 10 } = req.query;

    const skipCount = (page - 1) * limit;

    const pipeline = [
      {
        $lookup: {
          from: "sessions",
          localField: "session_ids",
          foreignField: "_id",
          as: "sessions",
        },
      },
      {
        $match: {
          "sessions.counsellor": new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "forms",
          localField: "form_id",
          foreignField: "_id",
          as: "form",
        },
      },
      {
        $unwind: { path: "$form", preserveNullAndEmptyArrays: false },
      },
      ...(searchQuery
        ? [
            {
              $match: {
                "form.name": { $regex: searchQuery, $options: "i" },
              },
            },
          ]
        : []),
      { $sort: { _id: -1 } },
      { $skip: skipCount },
      { $limit: parseInt(limit) },
      {
        $project: {
          id: "$_id",
          case_id: 1,
          case_date: "$createdAt",
          case_time: "$createdAt",
          student_name: "$form.name",
          status: 1,
        },
      },
    ];

    const cases = await Case.aggregate(pipeline);

    const totalCountPipeline = [
      {
        $lookup: {
          from: "sessions",
          localField: "session_ids",
          foreignField: "_id",
          as: "sessions",
        },
      },
      {
        $match: {
          "sessions.counsellor": new mongoose.Types.ObjectId(userId),
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "forms",
          localField: "form_id",
          foreignField: "_id",
          as: "form",
        },
      },
      {
        $unwind: { path: "$form", preserveNullAndEmptyArrays: false },
      },
      ...(searchQuery
        ? [
            {
              $match: {
                "form.name": { $regex: searchQuery, $options: "i" },
              },
            },
          ]
        : []),
      { $count: "totalCount" },
    ];

    const totalCountResult = await Case.aggregate(totalCountPipeline);
    const totalCount = totalCountResult[0]?.totalCount || 0;

    return responseHandler(res, 200, "Cases found", cases, totalCount);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};

exports.addEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      details,
      close,
      refer,
      date,
      time,
      session_id,
      form_id,
      concern_raised,
      interactions,
      reason_for_closing,
      with_session,
      report,
      isEditable,
    } = req.body;

    const createSessionValidator =
      validations.createSessionEntrySchema.validate(req.body, {
        abortEarly: true,
      });
    if (createSessionValidator.error) {
      return responseHandler(
        res,
        400,
        `Invalid input: ${createSessionValidator.error}`
      );
    }

    const checkSession = await Session.findById(session_id)
      .populate("case_id")
      .populate("counsellor")
      .populate("form_id");

    if (isEditable) {
      const updateSession = await updateSessionDetails(
        session_id,
        details,
        interactions,
        report
      );
      await Case.findByIdAndUpdate(
        updateSession.case_id,
        {
          concern_raised: concern_raised,
        },
        { new: true }
      );
      return responseHandler(
        res,
        200,
        "Session updated successfully",
        updateSession
      );
    }

    if (close) {
      const closeCase = await closeCaseAndSession(
        id,
        session_id,
        details,
        interactions,
        concern_raised,
        reason_for_closing,
        report
      );
      if (!closeCase) return responseHandler(res, 400, "Case close failed");
      return responseHandler(res, 200, "Case closed successfully", closeCase);
    }

    if (refer && with_session) {
      const session = await handleReferralWithSession(
        id,
        session_id,
        refer,
        details,
        interactions,
        concern_raised,
        date,
        time,
        form_id,
        checkSession,
        report
      );
      return responseHandler(res, 201, "Session created successfully", session);
    } else if (refer) {
      await handleReferralWithoutSession(
        id,
        session_id,
        refer,
        details,
        interactions,
        concern_raised,
        checkSession,
        report
      );
      return responseHandler(res, 200, "Case referred successfully");
    }

    await Session.findByIdAndUpdate(
      session_id,
      { case_details: details, interactions, status: "completed", report },
      { new: true }
    );

    const fetchCase = await Case.findById(id);
    if (!fetchCase) return responseHandler(res, 404, "Case not found");

    const sc_id = `${fetchCase.case_id}/SC_${String(
      fetchCase.session_ids.length + 1
    ).padStart(2, "0")}`;
    const sessionData = {
      form_id: form_id,
      session_date: date,
      type: checkSession.type,
      session_time: time,
      description: checkSession.description,
      counsellor: req.userId,
      status: "progress",
      session_id: sc_id,
      case_id: id,
      report,
    };

    const newSessionRes = await createNewSession(sessionData);
    if (!newSessionRes)
      return responseHandler(res, 400, "Session creation failed");

    const upCase = await updateCaseWithSession(
      id,
      newSessionRes.id,
      concern_raised
    );
    const resSession = await Session.findById(newSessionRes._id)
      .populate("form_id")
      .populate("counsellor");

    await sendEmailNotification(
      resSession.form_id.email,
      `Your session requested with Session ID: ${resSession.session_id} and Case ID: ${upCase.case_id} for ${resSession.counsellor.name}`,
      `Dear ${resSession.form_id.name},\n\nYour appointment request for ${
        resSession.counsellor.name
      } for ${moment(resSession.session_date).format("DD-MM-YYYY")} at ${
        resSession.session_time.start
      }-${
        resSession.session_time.end
      } has been sent to the Counselor for approval. We will inform you through an email once your request has been approved by the Counselor.`
    );

    await createNotification(
      resSession.counsellor._id,
      upCase._id,
      resSession._id,
      "New session requested"
    );

    await sendEmailNotification(
      resSession.counsellor.email,
      `You have a new session requested with Session ID: ${resSession.session_id} and Case ID: ${upCase.case_id} from ${resSession.form_id.name}`,
      `Dear ${
        resSession.counsellor.name
      },\n\nYou have received an appointment request from ${
        resSession.form_id.name
      } for ${moment(resSession.session_date).format("DD-MM-YYYY")} at ${
        resSession.session_time.start
      }-${
        resSession.session_time.end
      }. The request has been sent to you for approval. We will notify you via email once the request has been approved.`
    );

    return responseHandler(
      res,
      201,
      "Session created successfully",
      newSessionRes
    );
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};

const updateSessionDetails = async (
  session_id,
  details,
  interactions,
  report
) => {
  return await Session.findByIdAndUpdate(
    session_id,
    { case_details: details, interactions, report },
    { new: true }
  );
};

const closeCaseAndSession = async (
  id,
  session_id,
  details,
  interactions,
  concern_raised,
  reason_for_closing,
  report
) => {
  const closeCase = await Case.findByIdAndUpdate(
    id,
    { concern_raised, reason_for_closing, status: "completed" },
    { new: true }
  );

  await Session.findByIdAndUpdate(
    session_id,
    { case_details: details, interactions, status: "completed", report },
    { new: true }
  );

  return closeCase;
};

const createNewSession = async (data) => {
  return await Session.create(data);
};

const updateCaseWithSession = async (id, session_id, concern_raised) => {
  const fetchCase = await Case.findById(id);
  return await Case.findByIdAndUpdate(
    id,
    {
      session_ids: [
        ...fetchCase.session_ids.map((session) => session),
        session_id,
      ],
      concern_raised: concern_raised,
    },
    { new: true }
  );
};

const sendEmailNotification = async (to, subject, text) => {
  const emailData = { to, subject, text };
  await sendMail(emailData);
};

const createNotification = async (user, case_id, session, details) => {
  const notif_data = { user, case_id, session, details };
  await Notification.create(notif_data);
};

const handleReferralWithSession = async (
  id,
  session_id,
  refer,
  details,
  interactions,
  concern_raised,
  date,
  time,
  form_id,
  checkSession,
  report
) => {
  const refCase = await Case.findByIdAndUpdate(
    id,
    { concern_raised, status: "referred" },
    { new: true }
  );

  await Session.findByIdAndUpdate(
    session_id,
    { case_details: details, interactions, status: "completed", report },
    { new: true }
  );

  const sc_id = `${refCase.case_id}/SC_${String(
    refCase.session_ids.length + 1
  ).padStart(2, "0")}`;
  const data = {
    form_id: form_id,
    session_date: date,
    session_time: time,
    type: checkSession.type,
    description: checkSession.description,
    counsellor: refer,
    session_id: sc_id,
    case_id: id,
  };

  const session = await createNewSession(data);
  const upCase = await updateCaseWithSession(id, session._id, concern_raised);
  const newSession = await Session.findById(session._id)
    .populate("counsellor")
    .populate("form_id");

  await sendEmailNotification(
    newSession.form_id.email,
    `Your session requested with Session ID: ${newSession.session_id} and Case ID: ${upCase.case_id} for ${newSession.counsellor.name}`,
    `Dear ${newSession.form_id.name},\n\nYour appointment request for ${
      newSession.counsellor.name
    } for ${moment(newSession.session_date).format("DD-MM-YYYY")} at ${
      newSession.session_time.start
    }-${
      newSession.session_time.end
    } has been sent to the Counselor for approval. We will inform you through an email once your request has been approved by the Counselor.`
  );

  await createNotification(
    newSession.counsellor._id,
    upCase._id,
    session._id,
    "New session requested"
  );

  await sendEmailNotification(
    newSession.counsellor.email,
    `You have a new session requested with Session ID: ${newSession.session_id} and Case ID: ${upCase.case_id} from ${newSession.form_id.name}`,
    `Dear ${
      newSession.counsellor.name
    },\n\nYou have received an appointment request from ${
      newSession.form_id.name
    } for ${moment(session.session_date).format("DD-MM-YYYY")} at ${
      newSession.session_time.start
    }-${
      newSession.session_time.end
    }. The request has been sent to you for approval. We will notify you via email once the request has been approved.`
  );

  return session;
};

const handleReferralWithoutSession = async (
  id,
  session_id,
  refer,
  details,
  interactions,
  concern_raised,
  checkSession,
  report
) => {
  const counsellor = await User.findById(refer);
  const fetchCase = await Case.findById(id).populate("form_id");
  let updated_refer =
    fetchCase.referer === null
      ? [refer]
      : [...fetchCase.referer.map((ref) => ref), refer];

  await Case.findByIdAndUpdate(
    id,
    { referer: updated_refer, concern_raised },
    { new: true }
  );

  await Session.findByIdAndUpdate(
    session_id,
    { details, interactions, report },
    { new: true }
  );

  await sendEmailNotification(
    counsellor.email,
    `Feedback requested for Session ID: ${checkSession.session_id} and Case ID: ${checkSession.case_id.case_id}`,
    `Dear ${counsellor.name},\n\nA session request has been made by ${
      checkSession.counsellor.name
    } with the following details:\n\n- **Session ID**: ${
      checkSession.session_id
    }\n- Case ID: ${checkSession.case_id.case_id}\n- Requested Date: ${moment(
      checkSession.session_date
    ).format("DD-MM-YYYY")}\n- Time: ${checkSession.session_time.start} - ${
      checkSession.session_time.end
    }\n\nAlthough this session is not directly scheduled with you, your feedback or input is requested to help with the case. Please review the session details and provide your feedback at your earliest convenience.`
  );

  await createNotification(
    refer,
    checkSession.case_id._id,
    checkSession._id,
    "Session feedback requested"
  );
};
