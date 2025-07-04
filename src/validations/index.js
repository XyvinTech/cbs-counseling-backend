const Joi = require("joi");

exports.loginSchema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().required(),
});

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
  venue: Joi.string().allow(""),
  guest: Joi.string().allow(""),
  requisition_image: Joi.string(),
  remainder: Joi.array(),
  type: Joi.string(),
  details: Joi.string(),
  creator: Joi.string(),
  counselor: Joi.array(),
  requisition_description: Joi.string().allow(""),
  start_time: Joi.string(),
  end_time: Joi.string(),
});

exports.editEventSchema = Joi.object({
  title: Joi.string(),
  date: Joi.date(),
  venue: Joi.string().allow(""),
  guest: Joi.string().allow(""),
  requisition_image: Joi.string(),
  remainder: Joi.array(),
  type: Joi.string(),
  creator: Joi.string(),
  counselor: Joi.array(),
  details: Joi.string(),
  requisition_description: Joi.string().allow(""),
  start_time: Joi.string(),
  end_time: Joi.string(),
});

exports.formSchema = Joi.object({
  name: Joi.string().required(),
  grNumber: Joi.string().required(),
  referee: Joi.string().required(),
  refereeName: Joi.string(),
  email: Joi.string().email().required(),
  class: Joi.string().required(),
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
  session_type: Joi.string(),
  close: Joi.boolean(),
  refer: Joi.string(),
  interactions: Joi.string(),
  reason_for_closing: Joi.string(),
  details: Joi.string(),
  grade: Joi.string(),
  remarks: Joi.string(),
  report: Joi.array(),
  with_session: Joi.boolean(),
  isEditable: Joi.boolean(),
});
