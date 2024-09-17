const responseHandler = require("../helpers/responseHandler");
const Case = require("../models/caseModel");
const Session = require("../models/sessionModel");
const Time = require("../models/timeModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const { comparePasswords } = require("../utils/bcrypt");
const { generateToken } = require("../utils/generateToken");
const validations = require("../validations");
const sendMail = require("../utils/sendMail");
const Event = require("../models/eventModel");
const moment = require("moment-timezone");
const Type = require("../models/typeModel");

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return responseHandler(res, 400, "Email and password are required");
    }

    const findUser = await User.findOne({ email: email });
    if (!findUser) {
      return responseHandler(res, 404, "User not found");
    }

    const comparePassword = await comparePasswords(password, findUser.password);
    if (!comparePassword) {
      return responseHandler(res, 401, "Invalid password");
    }

    const token = generateToken(findUser._id);

    return responseHandler(res, 200, "Login successfull", token);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.getUser = async (req, res) => {
  try {
    const id = req.userId;
    if (!id) {
      return responseHandler(res, 400, "User ID is required");
    }
    const findStudent = await User.findById(id);
    if (!findStudent) {
      return responseHandler(res, 404, "User not found");
    }
    return responseHandler(res, 200, "User found", findStudent);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return responseHandler(res, 400, "Student ID is required");
    }

    const editStudentValidator = validations.editStudentSchema.validate(
      req.body,
      {
        abortEarly: true,
      }
    );
    if (editStudentValidator.error) {
      return responseHandler(
        res,
        400,
        `Invalid input: ${editStudentValidator.error}`
      );
    }

    const findStudent = await User.findById(id);
    if (!findStudent) {
      return responseHandler(res, 404, "Student not found");
    }

    const updateStudent = await User.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (updateStudent) {
      return responseHandler(
        res,
        200,
        `Student updated successfully..!`,
        updateStudent
      );
    } else {
      return responseHandler(res, 400, `Student update failed...!`);
    }
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

    req.body.user = req.userId;
    const session = await Session.create(req.body);

    const sessions = [session._id];

    const count = await Case.countDocuments();
    const case_id = `#CS_${String(count + 1).padStart(2, "0")}`;

    const newSession = await Session.findById(session._id)
      .populate("user")
      .populate("counsellor");

    const caseId = await Case.create({
      user: req.userId,
      session_ids: sessions,
      case_id: case_id,
    });

    newSession.case_id = caseId._id;
    newSession.session_id = `${case_id}/SC_${String(1).padStart(2, "0")}`;
    await newSession.save();

    session.case_id = caseId._id;
    const emailData = {
      to: newSession.user.email,
      subject: `Your session requested with Session ID: ${newSession.session_id} and Case ID: ${case_id} for ${newSession.counsellor.name}`,
      text: `Dear ${newSession.user.name},\n\nYour appointment request for ${
        newSession.counsellor.name
      } for ${moment(newSession.session_date).format("DD-MM-YYYY")} at ${
        newSession.session_time.start
      }-${
        newSession.session_time.end
      } has been sent to the Counselor for approval. We will inform you through an email once your request has been approved by the Counselor.`,
    };
    await sendMail(emailData);
    const data = {
      user: req.userId,
      case_id: caseId._id,
      session: session._id,
      details: "Your session has been requested. Please wait for approval",
    };
    await Notification.create(data);
    const notif_data = {
      user: session.counsellor,
      case_id: caseId._id,
      session: session._id,
      details: "New session requested",
    };
    const counData = {
      to: newSession.counsellor.email,
      subject: `You have a new session requested with Session ID: ${newSession.session_id} and Case ID: ${case_id} from ${newSession.user.name}`,
      text: `Dear ${
        newSession.counsellor.name
      },\n\nYou have received an appointment request from ${
        newSession.user.name
      } for ${moment(newSession.session_date).format("DD-MM-YYYY")} at ${
        newSession.session_time.start
      }-${
        newSession.session_time.end
      }. The request has been sent to you for approval. We will notify you via email once the request has been approved.`,
    };
    await sendMail(counData);
    await Notification.create(notif_data);

    if (!session) {
      return responseHandler(res, 400, `Session creation failed`);
    }
    return responseHandler(res, 201, "Session created successfully", session);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.rescheduleSession = async (req, res) => {
  try {
    const { session_date, session_time, reschedule_remark } = req.body;
    const { id } = req.params;
    if (!session_date && !session_time)
      return responseHandler(res, 400, `Session date & time is required`);
    const session = await Session.findById(id)
      .populate("user")
      .populate("counsellor")
      .populate("case_id");
    if (!session) return responseHandler(res, 404, "Session not found");
    if (session.status !== "pending")
      return responseHandler(res, 400, "You can't reschedule this session");
    const updatedSession = {
      ...session,
      status: "rescheduled",
      session_date,
      session_time,
      reschedule_remark,
    };
    const rescheduleSession = await Session.findByIdAndUpdate(
      id,
      updatedSession,
      { new: true }
    )
      .populate("user")
      .populate("counsellor");
    if (!rescheduleSession)
      return responseHandler(res, 400, "Session reschedule failed");
    const data = {
      user: req.userId,
      case_id: rescheduleSession.case_id,
      session_id: rescheduleSession._id,
      details:
        "Your session reschedule has been requested. Please wait for approval",
    };
    await Notification.create(data);
    const notif_data = {
      user: rescheduleSession.counsellor._id,
      case_id: rescheduleSession.case_id,
      session_id: rescheduleSession._id,
      details: "Session reschedule requested",
    };
    const userEmailData = {
      to: session.user.email,
      subject: `Your session with Session ID: ${session.session_id} and Case ID: ${session.case_id.case_id} has been rescheduled`,
      text: `Dear ${
        session.user.name
      },\n\nWe have received your request to reschedule your session with ${
        session.counsellor.name
      }. The session, originally scheduled for ${moment(
        session.session_date
      ).format("DD-MM-YYYY")} at ${session.session_time.start}-${
        session.session_time.end
      }, is now requested to be rescheduled to ${moment(session_date).format(
        "DD-MM-YYYY"
      )} at ${session_time.start}-${
        session_time.end
      }.\n\nPlease note that this reschedule request is pending approval by the counselor. You will receive an email notification once the counselor has reviewed and approved your request.`,
    };

    await sendMail(userEmailData);
    await Notification.create(notif_data);
    const counsellorEmailData = {
      to: session.counsellor.email,
      subject: `Session Rescheduled: Session ID: ${session.session_id} and Case ID: ${session.case_id.case_id}`,
      text: `Dear ${
        session.counsellor.name
      },\n\nPlease be informed that the session with ${
        session.user.name
      }, originally scheduled for ${moment(session.session_date).format(
        "DD-MM-YYYY"
      )} at ${session.session_time.start}-${
        session.session_time.end
      }, has been rescheduled by the user.\n\nThe new session is now scheduled for ${moment(
        session_date
      ).format("DD-MM-YYYY")} at ${session_time.start}-${
        session_time.end
      }.\n\n`,
    };
    await sendMail(counsellorEmailData);
    return responseHandler(
      res,
      200,
      "Session rescheduled successfully",
      rescheduleSession
    );
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.listController = async (req, res) => {
  try {
    const { type, page, searchQuery, status, limit = 10 } = req.query;
    const skipCount = 10 * (page - 1);
    const { userId } = req;
    if (type === "sessions") {
      const filter = {
        user: userId,
      };
      if (status) {
        filter.status = status;
      }
      if (searchQuery) {
        filter.$or = [
          { "user.name": { $regex: searchQuery, $options: "i" } },
          { "counsellor.name": { $regex: searchQuery, $options: "i" } },
        ];
      }
      const sessions = await Session.find(filter)
        .populate("user")
        .populate("counsellor")
        .skip(skipCount)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

      const mappedData = sessions.map((item) => {
        return {
          ...item,
          user_name: item.user.name,
          counsellor_name: item.counsellor.name,
        };
      });
      if (sessions.length > 0) {
        const totalCount = await Session.countDocuments(filter);
        return responseHandler(
          res,
          200,
          "Reports found",
          mappedData,
          totalCount
        );
      }
      return responseHandler(res, 404, "No reports found");
    } else if (type === "cases") {
      const filter = {
        user: userId,
      };
      if (status) {
        filter.status = status;
      }
      if (searchQuery) {
        filter.$or = [{ "user.name": { $regex: searchQuery, $options: "i" } }];
      }
      const cases = await Case.find(filter)
        .populate("user")
        .populate({
          path: "session_ids",
          populate: {
            path: "counsellor",
          },
        })
        .skip(skipCount)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

      const mappedData = cases.map((item) => {
        return {
          ...item,
          user_name: item.user.name,
          counsellor_name: item.session_ids[0].counsellor.name,
          session_type: item.session_ids[0].type,
        };
      });

      if (cases.length > 0) {
        const totalCount = await Case.countDocuments(filter);
        return responseHandler(res, 200, "Cases found", mappedData, totalCount);
      }
      return responseHandler(res, 404, "No reports found");
    } else if (type === "events") {
      const filter = {};
      if (searchQuery) {
        filter.$or = [
          { title: { $regex: searchQuery, $options: "i" } },
          { venue: { $regex: searchQuery, $options: "i" } },
        ];
      }
      const event = await Event.find(filter);
      if (event.length > 0) {
        const totalCount = await Event.countDocuments(filter);
        return responseHandler(res, 200, "Events found", event, totalCount);
      }
      return responseHandler(res, 404, "No Events found");
    } else if (type === "counselling-type") {
      const types = await Type.find();
      if (types.length > 0) {
        const totalCount = types.length;
        return responseHandler(
          res,
          200,
          "Counselling types found",
          types,
          totalCount
        );
      }
      return responseHandler(res, 404, "No Counselling types found");
    } else {
      return responseHandler(res, 404, "Invalid type..!");
    }
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.getAvailableTimes = async (req, res) => {
  try {
    const { id } = req.params;
    const { day, date } = req.query;
    const currentDate = new Date(date);
    const previousDate = new Date(currentDate);
    previousDate.setDate(currentDate.getDate() - 1);
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 1);

    const filter = {
      user: id,
      session_date: { $gte: previousDate, $lte: nextDate },
    };
    const session = await Session.find(filter);

    const times = await Time.findOne({ user: id, day });

    if (!times || !times.times || times.times.length === 0) {
      return responseHandler(res, 404, "No available times found");
    }

    const availableTimes = times.times.filter(
      (time) =>
        !session.some(
          (sess) =>
            sess.session_time.start === time.start &&
            sess.session_time.end === time.end
        )
    );

    return responseHandler(res, 200, "Available times found", availableTimes);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};

exports.getAllCounsellors = async (req, res) => {
  try {
    const { counsellorType } = req.query;
    const counsellors = await User.find({
      counsellorType: { $in: [counsellorType] },
    });
    const mappedData = counsellors.map((counsellor) => {
      return {
        id: counsellor.id,
        name: counsellor.name,
        email: counsellor.email,
        type: counsellor.counsellortype,
      };
    });
    if (counsellors.length > 0) {
      return responseHandler(res, 200, "Counsellors found", mappedData);
    }
    return responseHandler(res, 404, "No counsellors found");
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.getCaseSessions = async (req, res) => {
  try {
    const { caseId } = req.params;
    const sessions = await Session.find({ case_id: caseId })
      .populate("user")
      .populate("counsellor");

    const mappedData = sessions.map((session) => {
      return {
        ...session._doc,
        user_name: session.user.name,
        counsellor_name: session.counsellor.name,
      };
    });
    if (sessions.length > 0) {
      return responseHandler(res, 200, "Sessions found", mappedData);
    }
    return responseHandler(res, 404, "No sessions found");
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.getSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findById(id)
      .populate("user")
      .populate("counsellor")
      .populate("case_id");
    const mappedData = {
      ...session._doc,
      user_name: session.user.name,
      counsellor_name: session.counsellor.name,
      case_id: session.case_id.case_id,
    };
    if (session) {
      return responseHandler(res, 200, "Session found", mappedData);
    }
    return responseHandler(res, 404, "Session not found");
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.cancelSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancel_remark } = req.body;
    const session = await Session.findByIdAndUpdate(
      id,
      {
        cancel_remark,
        status: "cancelled",
      },
      { new: true }
    );
    const get_session = await Session.findById(id)
      .populate("user")
      .populate("counsellor")
      .populate("case_id");
    const counsellorEmailData = {
      to: get_session.counsellor.email,
      subject: `Session Canceled: Session ID: ${get_session.session_id} and Case ID: ${get_session.case_id.case_id}`,
      text: `Dear ${
        get_session.counsellor.name
      },\n\nWe wanted to inform you that the session with ${
        get_session.user.name
      }, scheduled for ${moment(get_session.session_date).format(
        "DD-MM-YYYY"
      )} at ${get_session.session_time.start}-${
        get_session.session_time.end
      }, has been canceled by the student for the following reason: ${cancel_remark}.`,
    };
    await sendMail(counsellorEmailData);
    await Case.findByIdAndUpdate(
      session.case_id,
      { status: "cancelled" },
      {
        new: true,
      }
    );
    if (session) {
      return responseHandler(res, 200, "Session cancelled successfully");
    }
    return responseHandler(res, 404, "Session not found");
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.getFullTimes = async (req, res) => {
  try {
    const { id } = req.params;
    const times = await Time.find({ user: id });
    if (!times) return responseHandler(res, 404, "No times found");
    const days = times
      .filter((time) => Array.isArray(time.times) && time.times.length > 0)
      .map((time) => time.day);
    return responseHandler(res, 200, "Days found", days);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req;
    const notifications = await Notification.find({ user: userId });
    if (!notifications)
      return responseHandler(res, 400, `No Notification found`);
    return responseHandler(res, 200, `Notification Found`, notifications);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );
    if (!notification)
      return responseHandler(res, 404, "Notification not found");
    return responseHandler(res, 200, "Notification marked as read");
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};
