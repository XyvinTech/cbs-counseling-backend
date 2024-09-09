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

    const token = generateToken(findUser.id);

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

    const updateStudent = await User.update(id, req.body);
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

    const sessions = [session.id];
    const caseId = await Case.create({
      user: req.userId,
      sessions,
    });

    const newSession = await Session.findById(session.id);

    session.case_id = caseId.id;
    const emailData = {
      to: session.user_email,
      subject: `Your session requested with Session ID: ${newSession.session_id} and Case ID: ${caseId.case_id} for ${session.counsellor_name}`,
      text: `Dear ${session.user_name},\n\nYour appointment request for ${
        session.counsellor_name
      } for ${moment(session.session_date).format("DD-MM-YYYY")} at ${
        session.session_time.start
      }-${
        session.session_time.end
      } has been sent to the Counselor for approval. We will inform you through an email once your request has been approved by the Counselor.`,
    };
    await sendMail(emailData);
    const data = {
      user: req.userId,
      caseId: caseId.id,
      session: session.id,
      details: "Your session has been requested. Please wait for approval",
    };
    await Notification.create(data);
    const notif_data = {
      user: session.counsellor,
      caseId: caseId.id,
      session: session.id,
      details: "New session requested",
    };
    const counData = {
      to: session.counsellor_email,
      subject: `You have a new session requested with Session ID: ${newSession.session_id} and Case ID: ${caseId.case_id} from ${session.user_name}`,
      text: `Dear ${
        session.counsellor_name
      },\n\nYou have received an appointment request from ${
        session.user_name
      } for ${moment(session.session_date).format("DD-MM-YYYY")} at ${
        session.session_time.start
      }-${
        session.session_time.end
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
    const session = await Session.findById(id);
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
    const rescheduleSession = await Session.update(id, updatedSession);
    if (!rescheduleSession)
      return responseHandler(res, 400, "Session reschedule failed");
    const data = {
      user: req.userId,
      caseId: updatedSession.caseid,
      session: updatedSession.id,
      details:
        "Your session reschedule has been requested. Please wait for approval",
    };
    await Notification.create(data);
    const notif_data = {
      user: updatedSession.counsellor,
      caseId: updatedSession.caseid,
      session: updatedSession.id,
      details: "Session reschedule requested",
    };
    const userEmailData = {
      to: session.user_email,
      subject: `Your session with Session ID: ${session.session_id} and Case ID: ${session.case_id} has been rescheduled`,
      text: `Dear ${
        session.user_name
      },\n\nWe have received your request to reschedule your session with ${
        session.counsellor_name
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
      to: session.counsellor_email,
      subject: `Session Rescheduled: Session ID: ${session.session_id} and Case ID: ${session.case_id}`,
      text: `Dear ${
        session.counsellor_name
      },\n\nPlease be informed that the session with ${
        session.user_name
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
    const { type, page, searchQuery, status } = req.query;
    const { userId } = req;
    if (type === "sessions") {
      const sessions = await Session.findAllByUserId({
        userId,
        page,
        searchQuery,
        status,
      });
      if (sessions.length > 0) {
        const totalCount = await Session.count({ id: userId, status });
        return responseHandler(res, 200, "Reports found", sessions, totalCount);
      }
      return responseHandler(res, 404, "No reports found");
    } else if (type === "cases") {
      const cases = await Case.findByUser({
        userId,
        page,
        searchQuery,
        status,
      });
      if (cases.length > 0) {
        const totalCount = await Case.user_count({ id: userId });
        return responseHandler(res, 200, "Cases found", cases, totalCount);
      }
      return responseHandler(res, 404, "No reports found");
    } else if (type === "events") {
      const event = await Event.findAll({
        page,
        searchQuery,
      });
      if (event.length > 0) {
        const totalCount = await Event.count();
        return responseHandler(res, 200, "Events found", event, totalCount);
      }
      return responseHandler(res, 404, "No Events found");
    } else if (type === "counselling-type") {
      const types = await Type.findAll();
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
    const session = await Session.findByCounseller(id, previousDate, nextDate);
    const times = await Time.findTimes({ userId: id, day });
    if (!times) return responseHandler(res, 404, "No times found");
    const availableTimes = times.times.filter(
      (time) => !session.some((sess) => sess.session_time.start == time.start)
    );
    return responseHandler(res, 200, "Times found", availableTimes);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.getAllCounsellors = async (req, res) => {
  try {
    const { counsellorType } = req.query;
    const counsellors = await User.findAllCounsellors({ counsellorType });
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
    const sessions = await Session.findAllByCaseId(caseId);
    if (sessions.length > 0) {
      return responseHandler(res, 200, "Sessions found", sessions);
    }
    return responseHandler(res, 404, "No sessions found");
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.getSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findById(id);
    if (session) {
      return responseHandler(res, 200, "Session found", session);
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
    const session = await Session.cancel(id, { cancel_remark });
    const get_session = await Session.findById(id);
    const counsellorEmailData = {
      to: session.counsellor_email,
      subject: `Session Canceled: Session ID: ${get_session.session_id} and Case ID: ${get_session.case_id}`,
      text: `Dear ${
        get_session.counsellor_name
      },\n\nWe wanted to inform you that the session with ${
        get_session.user_name
      }, scheduled for ${moment(get_session.session_date).format(
        "DD-MM-YYYY"
      )} at ${get_session.session_time.start}-${
        get_session.session_time.end
      }, has been canceled by the student for the following reason: ${cancel_remark}.`,
    };
    await sendMail(counsellorEmailData);
    await Case.cancel(session.case_id);
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
    const times = await Time.findByUserId(id);
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
    const notifications = await Notification.findByUserId(userId);
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
    const notification = await Notification.markAsRead(id);
    if (!notification)
      return responseHandler(res, 404, "Notification not found");
    return responseHandler(res, 200, "Notification marked as read");
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};
