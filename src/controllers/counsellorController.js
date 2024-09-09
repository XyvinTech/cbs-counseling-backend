const responseHandler = require("../helpers/responseHandler");
const Case = require("../models/caseModel");
const Event = require("../models/eventModel");
const Session = require("../models/sessionModel");
const Time = require("../models/timeModel");
const User = require("../models/userModel");
const { comparePasswords } = require("../utils/bcrypt");
const { createCertificate } = require("../utils/generateCertificate");
const { generateToken } = require("../utils/generateToken");
const sendMail = require("../utils/sendMail");
const validations = require("../validations");
const Notification = require("../models/notificationModel");
const { createReport } = require("../utils/generateReport");
const moment = require("moment-timezone");
const Type = require("../models/typeModel");

exports.loginCounsellor = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return responseHandler(res, 400, "Email and password are required");
    }

    const findUser = await User.findOne({ email: email });
    if (!findUser) {
      return responseHandler(res, 404, "Counsellor not found");
    }

    const comparePassword = await comparePasswords(password, findUser.password);
    if (!comparePassword) {
      return responseHandler(res, 401, "Invalid password");
    }

    const token = generateToken(findUser.id);

    return responseHandler(res, 200, "Login successfull", token);
  } catch (error) {
    return responseHandler(
      res,
      500,
      `Internal Server Error ${error.message}`,
      null
    );
  }
};

exports.getCounsellor = async (req, res) => {
  try {
    const id = req.userId;
    if (!id) {
      return responseHandler(res, 400, "Counsellor ID is required");
    }
    const findCounsellor = await User.findById(id);
    if (!findCounsellor) {
      return responseHandler(res, 404, "Counsellor not found");
    }
    return responseHandler(res, 200, "Counsellor found", findCounsellor);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.addTimes = async (req, res) => {
  try {
    const addTimeValidator = validations.addTimeSchema.validate(req.body, {
      abortEarly: true,
    });
    if (addTimeValidator.error) {
      return responseHandler(
        res,
        400,
        `Invalid input: ${addTimeValidator.error}`
      );
    }
    req.body.user = req.userId;
    const isAdded = await Time.findTimes({
      userId: req.userId,
      day: req.body.day,
    });
    if (isAdded && req.body.times == []) {
      await Time.delete(isAdded.id);
    }
    if (isAdded) {
      const id = isAdded.id;
      const updateTime = await Time.update(id, {
        day: req.body.day,
        times: req.body.times,
      });
      if (!updateTime) return responseHandler(res, 400, `Time creation failed`);
      return responseHandler(res, 201, "Time created successfully", updateTime);
    }
    const times = await Time.create(req.body);
    if (!times) return responseHandler(res, 400, `Time creation failed`);
    return responseHandler(res, 201, "Time created successfully", times);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.getTimes = async (req, res) => {
  try {
    const times = await Time.findByUserId(req.userId);
    if (!times) return responseHandler(res, 404, "No times found");
    return responseHandler(res, 200, "Times found", times);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.listController = async (req, res) => {
  try {
    const { type, page, searchQuery, status } = req.query;
    const { userId } = req;
    if (type === "sessions") {
      const sessions = await Session.findAllByCounsellorId({
        userId,
        page,
        searchQuery,
        status,
      });
      if (sessions.length > 0) {
        const totalCount = await Session.counsellor_count({
          id: userId,
          status,
        });
        return responseHandler(res, 200, "Reports found", sessions, totalCount);
      }
      return responseHandler(res, 404, "No reports found");
    }
    if (type === "cases") {
      const cases = await Case.findAll({
        userId,
        page,
        searchQuery,
        status,
      });
      if (cases.length > 0) {
        const mappedData = cases.map((item) => {
          return {
            ...item,
            session_time: item.sessions.length
              ? item.sessions[item.sessions.length - 1].session_time
              : null,
            type: item.sessions.length
              ? item.sessions[item.sessions.length - 1].type
              : null,
            session_count: item.sessions.length,
          };
        });
        const totalCount = await Case.counsellor_count({ id: userId, status });
        return responseHandler(res, 200, "Cases found", mappedData, totalCount);
      }
      return responseHandler(res, 404, "No cases found");
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
    } else if (type === "remarks") {
      const sessions = await Case.findAllRemarks({
        userId,
        page,
        searchQuery,
        status,
      });
      if (sessions.length > 0) {
        const totalCount = await Case.remarkCount({
          userId,
        });
        return responseHandler(res, 200, "Reports found", sessions, totalCount);
      }
      return responseHandler(res, 404, "No reports found");
    } else {
      return responseHandler(res, 404, "Invalid type..!");
    }
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.acceptSession = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedSession = await Session.findByIdAndUpdate(
      id,
      {
        status: "progress",
      },
      { new: true }
    )
      .populate("user")
      .populate("counsellor");
    const session = await Session.findById(id)
      .populate("user")
      .populate("counsellor");
    await Case.accept(updatedSession.case_id);
    const data = {
      user: req.userId,
      caseId: updatedSession.case_id,
      session: updatedSession._id,
      details: `Session with ${updatedSession.session_id} is accepted`,
    };
    await Notification.create(data);
    const notif_data = {
      user: updatedSession.user._id,
      caseId: updatedSession.case_id,
      session: updatedSession._id,
      details: `Your session with ${updatedSession.session_id} is accepted`,
    };
    const emailDataForUserAccepted = {
      to: session.user.email,
      subject: `Your session with Session ID: ${session.session_id} has been accepted`,
      text: `Dear ${session.user.name},
    
    Your appointment request for ${session.counsellor.name} on ${moment(
        session.session_date
      ).format("DD-MM-YYYY")} at ${session.session_time.start}-${
        session.session_time.end
      } has been accepted by the Counselor. 
    
    Here are the details of your session:
    - **Session ID**: ${session.session_id}
    - **Case ID**: ${session.case_id}
    - **Date**: ${moment(session.session_date).format("DD-MM-YYYY")}
    - **Time**: ${session.session_time.start}-${session.session_time.end}
    
    We look forward to seeing you at the scheduled time.
    
    Thank you`,
    };

    await sendMail(emailDataForUserAccepted);
    await Notification.create(notif_data);
    const emailDataForCounselorAccepted = {
      to: session.counsellor.email,
      subject: `Session with Session ID: ${session.session_id} has been accepted`,
      text: `Dear ${session.counsellor.name},
    
    The session request from ${session.user.name} has been accepted. 
    
    Here are the details of the session:
    - **Session ID**: ${session.session_id}
    - **Case ID**: ${session.case_id}
    - **Date**: ${moment(session.session_date).format("DD-MM-YYYY")}
    - **Time**: ${session.session_time.start}-${session.session_time.end}
    - **User**: ${session.user.name}
    - **User Email**: ${session.user.email}
    
    Please prepare for the session accordingly.
    
    Thank you`,
    };

    await sendMail(emailDataForCounselorAccepted);
    if (!updatedSession)
      return responseHandler(res, 400, "Session Accepted failed");
    return responseHandler(
      res,
      200,
      "Session Accepted successfully",
      updatedSession
    );
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
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
      user_id,
      concern_raised,
      interactions,
      reason_for_closing,
      with_session,
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

    const checkSession = await Session.findById(session_id);

    //? Handle case closure
    if (close) {
      const closeCase = await Case.findByIdAndUpdate(
        id,
        {
          concern_raised,
          reason_for_closing,
          status: "completed",
        },
        { new: true }
      );
      //? Attempt to close the session
      await Session.findByIdAndUpdate(
        session_id,
        { case_details: details, interactions, status: "completed" },
        {
          new: true,
        }
      );
      if (!closeCase) return responseHandler(res, 400, "Case close failed");
      return responseHandler(res, 200, "Case closed successfully", closeCase);
    }

    //? Handle referral with session
    if (refer && with_session) {
      const refCase = await Case.findByIdAndUpdate(
        id,
        { concern_raised, status: "referred" },
        { new: true }
      );
      await Session.findByIdAndUpdate(
        session_id,
        { case_details: details, interactions, status: "completed" },
        {
          new: true,
        }
      );
      if (!checkSession) return responseHandler(res, 404, "Session not found");
      const sc_id = `${refCase.case_id}/SC_${String(
        refCase.session_ids.length + 1
      ).padStart(2, "0")}`;
      const data = {
        user: user_id,
        session_date: date,
        session_time: time,
        type: checkSession.type,
        description: checkSession.description,
        counsellor: refer,
        session_id: sc_id,
      };

      const session = await Session.create(data);
      if (!session) return responseHandler(res, 400, "Session creation failed");

      const fetchCase = await Case.findById(id);

      const upCase = await Case.findByIdAndUpdate(
        id,
        {
          session_ids: [
            ...fetchCase.session_ids.map((session) => session),
            session._id,
          ],
          concern_raised: concern_raised,
        },
        {
          new: true,
        }
      );

      const newSession = await Session.findById(session._id)
        .populate("counsellor")
        .populate("user");

      const emailData = {
        to: session.user.email,
        subject: `Your session requested with Session ID: ${newSession.session_id} and Case ID: ${upCase.case_id} for ${session.counsellor.name}`,
        text: `Dear ${session.user.name},\n\nYour appointment request for ${
          session.counsellor.name
        } for ${moment(session.session_date).format("DD-MM-YYYY")} at ${
          session.session_time.start
        }-${
          session.session_time.end
        } has been sent to the Counselor for approval. We will inform you through an email once your request has been approved by the Counselor.`,
      };

      await sendMail(emailData);
      const notifData = {
        user: req.userId,
        caseId: upCase._id,
        session: session._id,
        details: "Your session has been requested. Please wait for approval",
      };
      await Notification.create(notifData);
      const notif_data = {
        user: session.counsellor._id,
        caseId: upCase._id,
        session: session._id,
        details: "New session requested",
      };
      const counData = {
        to: session.counsellor.email,
        subject: `You have a new session requested with Session ID: ${newSession.session_id} and Case ID: ${upCase.case_id} from ${session.user.name}`,
        text: `Dear ${
          session.counsellor.name
        },\n\nYou have received an appointment request from ${
          session.user.name
        } for ${moment(session.session_date).format("DD-MM-YYYY")} at ${
          session.session_time.start
        }-${
          session.session_time.end
        }. The request has been sent to you for approval. We will notify you via email once the request has been approved.`,
      };
      await sendMail(counData);
      await Notification.create(notif_data);

      return responseHandler(res, 201, "Session created successfully", session);
    } else if (refer) {
      const counsellor = await User.findById(refer);
      const fetchCase = await Case.findById(id)
        .populate("counsellor")
        .populate("user");
      let updated_refer = [];
      if (fetchCase.referer === null) {
        updated_refer.push(refer);
      } else {
        updated_refer = [...fetchCase.referer.map((ref) => ref), refer];
      }
      await Case.findByIdAndUpdate(
        id,
        {
          referer: updated_refer,
          concern_raised,
        },
        { new: true }
      );
      await Session.findByIdAndUpdate(
        session_id,
        { details, interactions },
        { new: true }
      );
      const mailData = {
        to: counsellor.email,
        subject: `Feedback requested for Session ID: ${checkSession.session_id} and Case ID: ${checkSession.case_id}`,
        text: `Dear ${counsellor.name},
      
      A session request has been made by ${
        checkSession.user.name
      } with the following details:
      
      - **Session ID**: ${checkSession.session_id}
      - **Case ID**: ${checkSession.case_id}
      - **Requested Date**: ${moment(checkSession.session_date).format(
        "DD-MM-YYYY"
      )}
      - **Time**: ${checkSession.session_time.start} - ${
          checkSession.session_time.end
        }
      
      Although this session is not directly scheduled with you, your feedback or input is requested to help with the case. Please review the session details and provide your feedback at your earliest convenience.`,
      };
      await sendMail(mailData);
      const notifData = {
        user: refer,
        caseId: checkSession.case_id,
        session: checkSession._id,
        details: "Session feedback requested",
      };
      await Notification.create(notifData);

      return responseHandler(res, 200, "Case refered successfully");
    }
    await Session.findByIdAndUpdate(
      session_id,
      { case_details: details, interactions, status: "completed" },
      { new: true }
    );
    //? Default case: create a new session
    const fetchCase = await Case.findById(id);

    if (!fetchCase) return responseHandler(res, 404, "Case not found");

    const sc_id = `${fetchCase.case_id}/SC_${String(
      fetchCase.session_ids.length + 1
    ).padStart(2, "0")}`;
    const sessionData = {
      user: user_id,
      session_date: date,
      type: checkSession.type,
      session_time: time,
      description: checkSession.description,
      counsellor: req.userId,
      status: "progress",
      session_id: sc_id,
    };

    const newSessionRes = await Session.create(sessionData);
    if (!newSessionRes)
      return responseHandler(res, 400, "Session creation failed");

    const upCase = await Case.findByIdAndUpdate(
      id,
      {
        session_ids: [
          ...fetchCase.session_ids.map((session) => session),
          newSessionRes.id,
        ],
        concern_raised: concern_raised,
      },
      { new: true }
    );

    const resSession = await Session.findById(newSessionRes._id)
      .populate("user")
      .populate("counsellor");

    const emailData = {
      to: newSessionRes.user_email,
      subject: `Your session requested with Session ID: ${resSession.session_id} and Case ID: ${upCase.case_id} for ${resSession.counsellor.name}`,
      text: `Dear ${newSessionRes.user.name},\n\nYour appointment request for ${
        newSessionRes.counsellor.name
      } for ${moment(newSessionRes.session_date).format("DD-MM-YYYY")} at ${
        newSessionRes.session_time.start
      }-${
        newSessionRes.session_time.end
      } has been sent to the Counselor for approval. We will inform you through an email once your request has been approved by the Counselor.`,
    };

    await sendMail(emailData);
    const notifData = {
      user: req.userId,
      caseId: upCase._id,
      session: resSession._id,
      details: "Your session has been requested. Please wait for approval",
    };
    await Notification.create(notifData);
    const notif_data = {
      user: resSession.counsellor._id,
      caseId: upCase._id,
      session: resSession._id,
      details: "New session requested",
    };

    const counData = {
      to: resSession.counsellor.email,
      subject: `You have a new session requested with Session ID: ${resSession.session_id} and Case ID: ${upCase.case_id} from ${resSession.user.name}`,
      text: `Dear ${
        resSession.counsellor.name
      },\n\nYou have received an appointment request from ${
        resSession.user.name
      } for ${moment(resSession.session_date).format("DD-MM-YYYY")} at ${
        resSession.session_time.start
      }-${
        resSession.session_time.end
      }. The request has been sent to you for approval. We will notify you via email once the request has been approved.`,
    };

    await sendMail(counData);
    await Notification.create(notif_data);

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

exports.rescheduleSession = async (req, res) => {
  try {
    const { session_date, session_time, c_reschedule_remark } = req.body;
    const { id } = req.params;
    if (!session_date && !session_time)
      return responseHandler(res, 400, `Session date & time is required`);
    const session = await Session.findById(id);
    if (!session) return responseHandler(res, 404, "Session not found");
    if (session.status !== "pending" && session.status !== "rescheduled")
      return responseHandler(res, 400, "You can't reschedule this session");
    const updatedSession = {
      session_date,
      session_time,
      c_reschedule_remark,
    };
    const rescheduleSession = await Session.c_reschedule(id, updatedSession);
    if (!rescheduleSession)
      return responseHandler(res, 400, "Session reschedule failed");
    const data = {
      user: req.userId,
      caseId: session.caseid,
      session: session.id,
      details: "Your session is rescheduled.",
    };
    await Notification.create(data);
    const notif_data = {
      user: session.user,
      caseId: session.caseid,
      session: session.id,
      details: "Session rescheduled.",
    };

    const emailData = {
      to: session.user_email,
      subject: `Your session with Session ID: ${session.session_id} and Case ID: ${session.case_id} has been rescheduled by ${session.counsellor_name}`,
      text: `Dear ${
        session.user_name
      },\n\nWe wanted to inform you that your appointment with ${
        session.counsellor_name
      }, originally scheduled for ${moment(session.session_date).format(
        "DD-MM-YYYY"
      )} at ${session.session_time.start}-${
        session.session_time.end
      }, has been rescheduled.\n\nThe new session is now set for ${moment(
        session_date
      ).format("DD-MM-YYYY")} at ${session_time.start}-${
        session_time.end
      }.\n\nWe apologize for any inconvenience this may cause. Please feel free to reach out if you have any questions or need further assistance.\n\nThank you for your understanding.`,
    };

    await sendMail(emailData);
    await Notification.create(notif_data);
    const counData = {
      to: session.counsellor_email,
      subject: "Session Reschedule",
      text: `Session rescheduled for Session ID: ${session.session_id}.`,
    };
    await sendMail(counData);
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

exports.getAvailableTimes = async (req, res) => {
  try {
    const { id } = req.params;
    const { day, date } = req.query;
    const session = await Session.findByCounsellerDate(id, date);
    const times = await Time.findTimes({ userId: id, day });
    const availableTimes = times.times.filter(
      (time) => !session.some((sess) => sess.session_time == time)
    );
    if (!times) return responseHandler(res, 404, "No times found");
    return responseHandler(res, 200, "Times found", availableTimes);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.deleteTime = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.body.times == []) {
      await Time.delete(id);
    }
    const deleteTime = await Time.deleteTime(id, req.body.times);
    return responseHandler(res, 200, "Time deleted successfully", deleteTime);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.cancelSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { c_cancel_remark } = req.body;
    const session = await Session.c_cancel(id, { c_cancel_remark });
    await Case.cancel(session.case_id);
    const get_session = await Session.findById(id);
    const emailData = {
      to: session.user_email,
      subject: `Your session with Session ID: ${get_session.session_id} and Case ID: ${get_session.case_id} has been canceled by ${get_session.counsellor_name}`,
      text: `Dear ${
        get_session.user_name
      },\n\nWe regret to inform you that your appointment with ${
        get_session.counsellor_name
      }, originally scheduled for ${moment(get_session.session_date).format(
        "DD-MM-YYYY"
      )} at ${get_session.session_time.start}-${
        get_session.session_time.end
      }, has been canceled by the counselor for the following reason: ${c_cancel_remark}.`,
    };
    await sendMail(emailData);
    if (session) {
      return responseHandler(res, 200, "Session cancelled successfully");
    }
    return responseHandler(res, 404, "Session not found");
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.createReport = async (req, res) => {
  try {
    const { name, date } = req.body;
    const report = await createCertificate(name, date);
    return responseHandler(res, 200, "Report created successfully", report);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.createStudentReport = async (req, res) => {
  try {
    const report = await createReport();
    return responseHandler(res, 200, "Report created successfully", report);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.getSessionsExcel = async (req, res) => {
  try {
    const { student, status } = req.query;
    const { userId } = req;
    const sessions = await Session.findForExcel({ userId, status, student });
    const headers = [
      "Case ID",
      "Session ID",
      "Student Name",
      "Session Date",
      "Session Time",
      "Status",
    ];
    const data = sessions.map((session) => {
      return {
        case_id: session.caseid,
        session_id: session.session_id,
        student_name: session.user_name,
        session_date: moment(session.session_date).format("DD-MM-YYYY"),
        session_time: session.session_time,
        status: session.status,
      };
    });
    return responseHandler(res, 200, "Excel data created successfully", {
      headers,
      data,
    });
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.getBigCalender = async (req, res) => {
  try {
    const events = await Event.findAllForCalender();
    if (events.length > 0) {
      const mappedData = events.map((event) => {
        return {
          title: event.title,
          start: event.date,
          end: event.date,
        };
      });
      return responseHandler(res, 200, "Events found", mappedData);
    }
    return responseHandler(res, 404, "No Events found");
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.updateCounsellor = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return responseHandler(res, 400, "Counsellor ID is required");
    }
    const findCounsellor = await User.findById(id);
    if (!findCounsellor) {
      return responseHandler(res, 404, "Counsellor not found");
    }

    const editCounsellorValidator = validations.editCounsellorSchema.validate(
      req.body,
      {
        abortEarly: true,
      }
    );
    if (editCounsellorValidator.error) {
      return responseHandler(
        res,
        400,
        `Invalid input: ${editCounsellorValidator.error}`
      );
    }

    const updateCounsellor = await User.update(id, req.body);
    if (updateCounsellor) {
      return responseHandler(
        res,
        200,
        `Counsellor updated successfully..!`,
        updateCounsellor
      );
    } else {
      return responseHandler(res, 400, `Counsellor update failed...!`);
    }
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

exports.createEvent = async (req, res) => {
  try {
    const createEventValidator = validations.createEventSchema.validate(
      req.body,
      {
        abortEarly: true,
      }
    );
    if (createEventValidator.error) {
      return responseHandler(
        res,
        400,
        `Invalid input: ${createEventValidator.error}`
      );
    }
    const newEvent = await Event.create(req.body);

    if (newEvent) {
      return responseHandler(
        res,
        201,
        `New Event created successfull..!`,
        newEvent
      );
    } else {
      return responseHandler(res, 400, `Event creation failed...!`);
    }
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.editEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const createEventValidator = validations.editEventSchema.validate(
      req.body,
      {
        abortEarly: true,
      }
    );
    if (createEventValidator.error) {
      return responseHandler(
        res,
        400,
        `Invalid input: ${createEventValidator.error}`
      );
    }
    const findEvent = await Event.findById(id);
    if (!findEvent) {
      return responseHandler(res, 404, "Event not found");
    }

    const updateEvent = await Event.update(id, req.body);
    if (updateEvent) {
      return responseHandler(
        res,
        200,
        `Event updated successfully..!`,
        updateEvent
      );
    } else {
      return responseHandler(res, 400, `Event update failed...!`);
    }
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return responseHandler(res, 400, "Event ID is required");
    }

    const findEvent = await Event.findById(id);
    if (!findEvent) {
      return responseHandler(res, 404, "Event not found");
    }

    const deleteEvent = await Event.delete(id);
    if (deleteEvent) {
      return responseHandler(res, 200, `Event deleted successfully..!`);
    } else {
      return responseHandler(res, 400, `Event deletion failed...!`);
    }
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.deleteManyCounsellingType = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return responseHandler(
        res,
        400,
        "A non-empty array of Counselling Type IDs is required"
      );
    }
    const deletionResults = await Promise.all(
      ids.map(async (id) => {
        return await Type.delete(id);
      })
    );

    if (deletionResults) {
      return responseHandler(
        res,
        200,
        "Counselling type deleted successfully!"
      );
    } else {
      return responseHandler(
        res,
        400,
        "Some Counselling type deletions failed."
      );
    }
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};

exports.refereeRemark = async (req, res) => {
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
    const updateRemark = await Case.remark(id, { remark: updatedRemarks });
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
