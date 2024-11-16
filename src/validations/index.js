const Joi = require("joi");
const { report } = require("../routes/counsellor");

exports.createAdminSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().required(),
  password: Joi.string().required(),
});

exports.editAdminSchema = Joi.object({
  name: Joi.string(),
  email: Joi.string(),
  password: Joi.string(),
  status: Joi.boolean(),
});

exports.createCounsellorSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().required(),
  mobile: Joi.string().required(),
  gender: Joi.string().required(),
  counsellorType: Joi.array().required(),
  userType: Joi.string().required(),
  designation: Joi.string().required(),
});

exports.editCounsellorSchema = Joi.object({
  name: Joi.string(),
  email: Joi.string(),
  password: Joi.string(),
  mobile: Joi.string(),
  gender: Joi.string(),
  counsellorType: Joi.array(),
  status: Joi.boolean(),
  designation: Joi.string(),
});

exports.createTeacherSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().required(),
  password: Joi.string().required(),
  mobile: Joi.string().required(),
  designation: Joi.string().required(),
  userType: Joi.string().required(),
});

exports.createStudentSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().required(),
  gender: Joi.string().required(),
  StudentReferencesCode: Joi.string().required(),
  mobile: Joi.string().required(),
  designation: Joi.string().required(),
  division: Joi.string().required(),
  userType: Joi.string().required(),
  parentContact: Joi.string().required(),
});

exports.editStudentSchema = Joi.object({
  name: Joi.string(),
  email: Joi.string(),
  password: Joi.string(),
  mobile: Joi.string(),
  gender: Joi.string(),
  StudentReferencesCode: Joi.string(),
  designation: Joi.string(),
  division: Joi.string(),
  parentContact: Joi.string(),
  status: Joi.boolean(),
});

exports.createEventSchema = Joi.object({
  title: Joi.string().required(),
  date: Joi.date().required(),
  venue: Joi.string().required(),
  guest: Joi.string().required(),
  requisition_image: Joi.string(),
  remainder: Joi.array().required(),
  details: Joi.string().required(),
  requisition_description: Joi.string(),
});

exports.editEventSchema = Joi.object({
  title: Joi.string(),
  date: Joi.date(),
  venue: Joi.string(),
  guest: Joi.string(),
  requisition_image: Joi.string(),
  remainder: Joi.array(),
  details: Joi.string(),
  requisition_description: Joi.string(),
});

exports.createSessionSchema = Joi.object({
  form_id: Joi.string().required(),
  session_date: Joi.date().required(),
  session_time: Joi.object().required(),
  type: Joi.string().required(),
  counsellor: Joi.string().required(),
  description: Joi.string(),
  report: Joi.string(),
});

exports.addTimeSchema = Joi.object({
  day: Joi.string().required(),
  times: Joi.array(),
});

exports.createSessionEntrySchema = Joi.object({
  date: Joi.date(),
  concern_raised: Joi.date(),
  time: Joi.object({
    start: Joi.string().regex(/^([0-9]{2}):([0-9]{2})$/),
    end: Joi.string().regex(/^([0-9]{2}):([0-9]{2})$/),
  }),
  form_id: Joi.string().required(),
  session_id: Joi.string().required(),
  close: Joi.boolean(),
  refer: Joi.string(),
  interactions: Joi.string(),
  reason_for_closing: Joi.string(),
  details: Joi.string(),
  grade: Joi.string(),
  remarks: Joi.string(),
  report: Joi.string().allow(""),
  with_session: Joi.boolean(),
  isEditable: Joi.boolean(),
});

exports.formSchema = Joi.object({
  name: Joi.string().required(),
  grNumber: Joi.string().required(),
  referee: Joi.string().required(),
  email: Joi.string().email().required(),
  class: Joi.string().required(),
});