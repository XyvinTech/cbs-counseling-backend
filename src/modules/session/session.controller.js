const moment = require("moment-timezone");
const responseHandler = require("../../helpers/responseHandler");
const Case = require("../../models/caseModel");
const Form = require("../../models/formModel");
const Notification = require("../../models/notificationModel");
const Session = require("../../models/sessionModel");
const validations = require("../../validations");

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
