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
  remainder: Joi.array().required(),
  details: Joi.string().required(),
  requisition_description: Joi.string().allow(""),
});

exports.editEventSchema = Joi.object({
  title: Joi.string(),
  date: Joi.date(),
  venue: Joi.string().allow(""),
  guest: Joi.string().allow(""),
  requisition_image: Joi.string(),
  remainder: Joi.array(),
  details: Joi.string(),
  requisition_description: Joi.string().allow(""),
});
