const path = require("path");
const fs = require("fs");
const responseHandler = require("../helpers/responseHandler");
const Admin = require("../models/adminModel");
const Event = require("../models/eventModel");
const Session = require("../models/sessionModel");
const User = require("../models/userModel");
const { comparePasswords, hashPassword } = require("../utils/bcrypt");
const { generateToken } = require("../utils/generateToken");
const validations = require("../validations");
const Case = require("../models/caseModel");
const times = require("../utils/times");
const Time = require("../models/timeModel");
const Type = require("../models/typeModel");
const { generateRandomPassword } = require("../utils/generateRandomPassword");
const sendMail = require("../utils/sendMail");
const { generateOTP } = require("../utils/generateOTP");
const Notification = require("../models/notificationModel");
const mongoose = require("mongoose");
const Form = require("../models/formModel");
const moment = require("moment-timezone");
const uploadDir = "C:/cbs_school_files/";

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return responseHandler(res, 400, "Email and password are required");
    }

    let user = await Admin.findOne({ email });
    let userType = "admin";

    if (!user) {
      user = await User.findOne({ email });
      userType = user ? user.userType : null;
    }

    if (!user) {
      user = await User.findOne({ StudentReferencesCode: email });
      userType = user ? user.userType : null;
    }

    if (!user) {
      return responseHandler(res, 404, "User not found");
    }

    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      return responseHandler(res, 401, "Invalid password");
    }

    const token = generateToken(user._id);
    return responseHandler(res, 200, "Login successful", {
      token,
      userType,
    });
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};

exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return responseHandler(res, 400, "Email is required");
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await Admin.findOne({ email });
    }
    if (!user) {
      return responseHandler(res, 404, "User not found");
    }

    const otp = generateOTP(5);

    user.otp = otp;
    await user.save();

    const data = {
      to: user.email,
      subject: "New Message from Admin",
      text: `Hello ${user.name},\n\n Your OTP is ${otp} \n\n Thank you`,
    };

    await sendMail(data);

    return responseHandler(res, 200, "OTP sent successfully");
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp) {
      return responseHandler(res, 400, "Email and OTP are required");
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await Admin.findOne({ email });
    }
    if (!user) {
      return responseHandler(res, 404, "User not found");
    }

    if (user.otp !== otp) {
      return responseHandler(res, 401, "Invalid OTP");
    }
    user.otp = null;

    if (password) {
      const hashedPassword = await hashPassword(password);
      user.password = hashedPassword;
    }

    await user.save();
    return responseHandler(
      res,
      200,
      "OTP verified successfully, password updated"
    );
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const id = req.userId;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return responseHandler(
        res,
        400,
        "Old password and new password are required"
      );
    }

    if (!id) {
      return responseHandler(res, 400, "User ID is required");
    }

    let user;
    user = await User.findById(id);
    if (!user) {
      user = await Admin.findById(id);
    } else {
      return responseHandler(res, 404, "User not found");
    }

    const isPasswordValid = await comparePasswords(oldPassword, user.password);
    if (!isPasswordValid) {
      return responseHandler(res, 401, "Invalid old password");
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();
    return responseHandler(res, 200, "Password updated successfully");
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const createAdminValidator = validations.createAdminSchema.validate(
      req.body,
      {
        abortEarly: true,
      }
    );
    if (createAdminValidator.error) {
      return responseHandler(
        res,
        400,
        `Invalid input: ${createAdminValidator.error}`
      );
    }

    const findAdmin = await Admin.findOne({ email: req.body.email });
    if (findAdmin)
      return responseHandler(res, 409, `Admin with this email already exists`);

    const hashedPassword = await hashPassword(req.body.password);
    req.body.password = hashedPassword;

    const newAdmin = await Admin.create(req.body);

    if (newAdmin) {
      return responseHandler(
        res,
        201,
        `New Admin created successfull..!`,
        newAdmin
      );
    } else {
      return responseHandler(res, 400, `Admin creation failed...!`);
    }
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.getAdmin = async (req, res) => {
  try {
    const id = req.userId;
    if (!id) {
      return responseHandler(res, 400, "Admin ID is required");
    }
    const findAdmin = await Admin.findById(id);
    if (!findAdmin) {
      return responseHandler(res, 404, "Admin not found");
    }
    return responseHandler(res, 200, "Admin found", findAdmin);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.editAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return responseHandler(res, 400, "Admin ID is required");
    }

    const findAdmin = await Admin.findById(id);
    if (!findAdmin) {
      return responseHandler(res, 404, "Admin not found");
    }

    const editAdminValidator = validations.editAdminSchema.validate(req.body, {
      abortEarly: true,
    });
    if (editAdminValidator.error) {
      return responseHandler(
        res,
        400,
        `Invalid input: ${editAdminValidator.error}`
      );
    }

    const updateAdmin = await Admin.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (updateAdmin) {
      return responseHandler(
        res,
        200,
        `Admin updated successfully..!`,
        updateAdmin
      );
    } else {
      return responseHandler(res, 400, `Admin update failed...!`);
    }
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return responseHandler(res, 400, "Admin ID is required");
    }

    const findAdmin = await Admin.findById(id);
    if (!findAdmin) {
      return responseHandler(res, 404, "Admin not found");
    }

    const deleteAdmin = await Admin.findByIdAndDelete(id);
    if (deleteAdmin) {
      return responseHandler(res, 200, `Admin deleted successfully..!`);
    } else {
      return responseHandler(res, 400, `Admin deletion failed...!`);
    }
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.createCounsellor = async (req, res) => {
  try {
    const createCounsellorValidator =
      validations.createCounsellorSchema.validate(req.body, {
        abortEarly: true,
      });
    if (createCounsellorValidator.error) {
      return responseHandler(
        res,
        400,
        `Invalid input: ${createCounsellorValidator.error}`
      );
    }

    const findCounsellor = await User.findOne({ email: req.body.email });
    if (findCounsellor) {
      return responseHandler(res, 409, "Counsellor already exists");
    }

    const password = generateRandomPassword();
    const hashedPassword = await hashPassword(password);
    req.body.password = hashedPassword;

    const user = await User.create(req.body);
    const day = ["Monday", "Tuesday", "Wednesday", "Thursday", "Sunday"];

    for (let i = 0; i < day.length; i++) {
      await Time.create({
        user: user.id,
        day: day[i],
        times: times.times,
      });
    }

    const data = {
      to: user.email,
      subject: "New counsellor created",
      text: `Hello ${user.name},\n\nNew counsellor has been created. Your login username is: ${user.email} and your password is: ${password}\n\nRegards,\nAdmin`,
    };

    await sendMail(data);

    return responseHandler(res, 201, "Counsellor created", user);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.createCounsellorBulk = async (req, res) => {
  try {
    const counseller = req.body;
    const emails = counseller.map((counseller) => counseller.email);
    const mobiles = counseller.map((counseller) => counseller.mobile);

    // Check for existing users with the same email or mobile
    const existingUsers = await User.find({
      email: emails,
      mobile: mobiles,
    });

    if (existingUsers.length > 0) {
      const duplicateEmails = existingUsers.map((user) => user.email);
      const duplicateMobiles = existingUsers.map((user) => user.mobile);

      return responseHandler(res, 400, "Duplicate email or mobile found", {
        duplicateEmails,
        duplicateMobiles,
      });
    }

    // Hash passwords
    const hashedUsers = await Promise.all(
      counseller.map(async (user) => {
        const hashedPassword = await hashPassword("password123");
        return {
          ...user,
          password: hashedPassword,
          userType: "counsellor",
        };
      })
    );

    // Create counsellors
    const users = await User.create(hashedUsers);

    // Create time entries for each newly created counsellor
    const day = ["Monday", "Tuesday", "Wednesday", "Thursday", "Sunday"];
    const timeEntries = [];

    for (const user of users) {
      for (let i = 0; i < day.length; i++) {
        timeEntries.push({
          user: user.id,
          day: day[i],
          times: times.times,
        });
      }
    }

    // Bulk create Time entries
    await Time.create(timeEntries);

    return responseHandler(res, 201, "Counsellors created", users);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};

exports.createStudentBulk = async (req, res) => {
  try {
    const students = req.body;
    const emails = students.map((student) => student.email);
    const mobiles = students.map((student) => student.mobile);

    // Check for existing users with the same email or mobile
    const existingUsers = await User.find({
      email: emails,
      mobile: mobiles,
    });

    if (existingUsers.length > 0) {
      const duplicateEmails = existingUsers.map((user) => user.email);
      const duplicateMobiles = existingUsers.map((user) => user.mobile);

      return responseHandler(res, 400, "Duplicate email or mobile found", {
        duplicateEmails,
        duplicateMobiles,
      });
    }

    const hashedUsers = await Promise.all(
      students.map(async (user) => {
        const hashedPassword = await hashPassword("password123");
        return {
          ...user, // Spread the user object to retain other properties
          password: hashedPassword, // Replace the plain password with the hashed password
          userType: "student",
        };
      })
    );

    const users = await User.create(hashedUsers);
    return responseHandler(res, 201, "Students created", users);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
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

    const updateCounsellor = await User.findByIdAndUpdate(id, req.body, {
      new: true,
    });
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

exports.deleteCounsellor = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return responseHandler(res, 400, "Counsellor ID is required");
    }

    const findCounsellor = await User.findById(id);
    if (!findCounsellor) {
      return responseHandler(res, 404, "Counsellor not found");
    }

    const deleteCounsellor = await User.findByIdAndDelete(id);
    await Notification.deleteMany({ user: id });
    await Time.deleteMany({ user: id });

    if (deleteCounsellor) {
      return responseHandler(res, 200, `Counsellor deleted successfully..!`);
    } else {
      return responseHandler(res, 400, `Student deletion failed...!`);
    }
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.deleteManyUser = async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return responseHandler(
      res,
      400,
      "A non-empty array of User IDs is required"
    );
  }

  try {
    await Promise.all(
      ids.map(async (id) => {
        await User.findByIdAndDelete(id);
        await Session.updateMany({ user: id }, { isDeleted: true });
        await Case.updateMany({ user: id }, { isDeleted: true });
        await Notification.deleteMany({ user: id });
      })
    );

    return responseHandler(res, 200, "Users deleted successfully!");
  } catch (error) {
    return responseHandler(
      res,
      500,
      `Failed to delete users: ${error.message}`
    );
  }
};

exports.createStudent = async (req, res) => {
  try {
    const createStudentValidator = validations.createStudentSchema.validate(
      req.body,
      {
        abortEarly: true,
      }
    );
    if (createStudentValidator.error) {
      return responseHandler(
        res,
        400,
        `Invalid input: ${createStudentValidator.error}`
      );
    }

    const findStudent = await User.findOne({ email: req.body.email });
    if (findStudent) {
      return responseHandler(res, 409, "Student already exists");
    }

    const password = generateRandomPassword();
    const hashedPassword = await hashPassword(password);
    req.body.password = hashedPassword;

    const user = await User.create(req.body);

    const data = {
      to: user.email,
      subject: "New student created",
      text: `Hello ${user.name},\n\nNew student has been created. Your login username is: ${user.StudentReferencesCode} and your password is: ${password}\n\nRegards,\nAdmin`,
    };

    await sendMail(data);

    return responseHandler(res, 201, "Student created", user);
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

exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return responseHandler(res, 400, "Student ID is required");
    }

    const findStudent = await User.findById(id);
    if (!findStudent) {
      return responseHandler(res, 404, "Student not found");
    }

    const deleteStudent = await User.findByIdAndDelete(id);
    await Session.updateMany({ user: id }, { isDeleted: true });
    await Case.updateMany({ user: id }, { isDeleted: true });
    await Notification.deleteMany({ user: id });
    if (deleteStudent) {
      return responseHandler(res, 200, `Student deleted successfully..!`);
    } else {
      return responseHandler(res, 400, `Student deletion failed...!`);
    }
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.listController = async (req, res) => {
  try {
    const { type, page, searchQuery, status, limit = 10 } = req.query;
    const skipCount = 10 * (page - 1);
    if (type === "students") {
      const filter = {
        userType: "student",
      };
      if (searchQuery) {
        filter.$or = [
          { name: { $regex: searchQuery, $options: "i" } },
          { StudentReferencesCode: { $regex: searchQuery, $options: "i" } },
        ];
      }

      const query = User.find(filter).sort({ createdAt: -1 }).lean();
      if (limit !== "all") {
        query.skip(skipCount).limit(Number(limit));
      }

      const student = await query.exec();
      if (student.length > 0) {
        const totalCount = await User.countDocuments(filter);
        return responseHandler(res, 200, "Students found", student, totalCount);
      }
      return responseHandler(res, 404, "No Students found");
    } else if (type === "counsellers") {
      const filter = {
        userType: "counsellor",
      };
      if (searchQuery) {
        filter.$or = [
          { name: { $regex: searchQuery, $options: "i" } },
          { email: { $regex: searchQuery, $options: "i" } },
        ];
      }

      const query = User.find(filter).sort({ createdAt: -1 }).lean();
      if (limit !== "all") {
        query.skip(skipCount).limit(Number(limit));
      }

      const student = await query.exec();
      if (student.length > 0) {
        const totalCount = await User.countDocuments(filter);
        return responseHandler(
          res,
          200,
          "Counsellers found",
          student,
          totalCount
        );
      }
      return responseHandler(res, 404, "No Students found");
    } else if (type === "events") {
      const filter = {};
      if (searchQuery) {
        filter.$or = [{ title: { $regex: searchQuery, $options: "i" } }];
      }
      const event = await Event.find(filter)
        .skip(skipCount)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();
      if (event.length > 0) {
        const totalCount = await Event.countDocuments();
        return responseHandler(res, 200, "Events found", event, totalCount);
      }
      return responseHandler(res, 404, "No Events found");
    } else if (type === "sessions") {
      const filter = {};
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
      if (sessions.length > 0) {
        const totalCount = await Session.countDocuments();
        return responseHandler(res, 200, "Reports found", sessions, totalCount);
      }
      return responseHandler(res, 404, "No reports found");
    } else if (type === "cases") {
      const filter = {};
      if (searchQuery) {
        filter.$or = [
          { "form_id.name": { $regex: searchQuery, $options: "i" } },
        ];
      }
      const sessions = await Case.find(filter)
        .populate("form_id")
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
      const mappedData = sessions.map((session) => {
        return {
          ...session,
          user_name: session?.form_id?.name,
          counsellor_name: session?.session_ids[0]?.counsellor?.name,
        };
      });
      if (sessions.length > 0) {
        const totalCount = await Case.countDocuments(filter);
        return responseHandler(
          res,
          200,
          "Reports found",
          mappedData,
          totalCount
        );
      }
      return responseHandler(res, 404, "No reports found");
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

exports.getUserSessions = async (req, res) => {
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
      { $sort: { createdAt: -1 } },
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
        },
      },
    ];

    const sessions = await Session.aggregate(pipeline);

    const totalCountPipeline = [{ $match: match }, { $count: "totalCount" }];
    const totalCountResult = await Session.aggregate(totalCountPipeline);
    const totalCount = totalCountResult[0]?.totalCount || 0;

    if (sessions.length > 0) {
      return responseHandler(res, 200, "Sessions found", sessions, totalCount);
    }
    return responseHandler(res, 404, "No Sessions found", []);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};

exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return responseHandler(res, 400, "User ID is required");
    }
    const user = await User.findById(id);
    if (!user) {
      return responseHandler(res, 404, "User not found");
    }
    return responseHandler(res, 200, "User found", user);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.getCounsellorSessions = async (req, res) => {
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
      .sort({ createdAt: -1 })
      .lean();
    const mappedData = sessions.map((session) => {
      return {
        id: session.id,
        session_id: session.session_id,
        session_date: session.session_date,
        session_time: session.session_time,
        student_name: session.form_id.name,
        counsellor_type: session.type,
        status: session.status,
      };
    });
    if (sessions.length > 0) {
      const totalCount = await Session.countDocuments(filter);
      return responseHandler(
        res,
        200,
        "Sessions found",
        mappedData,
        totalCount
      );
    }
    return responseHandler(res, 404, "No Sessions found", mappedData);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.getCounsellorCases = async (req, res) => {
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
      { $sort: { createdAt: -1 } },
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

    if (cases.length > 0) {
      return responseHandler(res, 200, "Cases found", cases, totalCount);
    }
    return responseHandler(res, 404, "No Cases found", []);
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

exports.getDashboard = async (req, res) => {
  try {
    const { page, limit, searchQuery, status } = req.query;
    const skipCount = 10 * (page - 1);

    const student_count = await User.countDocuments({ userType: "student" });
    const counsellor_count = await User.countDocuments({
      userType: "counsellor",
    });
    const case_count = await Case.countDocuments();
    const session_count = await Session.countDocuments({});
    const event_count = await Event.countDocuments();
    const filter = {};
    if (searchQuery) {
      filter.$or = [
        { "form_id.name": { $regex: searchQuery, $options: "i" } },
        { "counsellor.name": { $regex: searchQuery, $options: "i" } },
      ];
    }
    if (status) {
      filter.status = status;
    }
    const session_list = await Session.find(filter)
      .populate("form_id")
      .populate("counsellor")
      .skip(skipCount)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const mappedData = session_list.map((session) => {
      return {
        ...session,
        user_name: session.form_id ? session.form_id.name : null,
        counsellor_name: session.counsellor ? session.counsellor.name : null,
      };
    });
    const totalCount = await Session.countDocuments({ status });
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

    const updateEvent = await Event.findByIdAndUpdate(id, req.body, {
      new: true,
    });
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
    const filePath = findEvent.requisition_image;
    const absolutePath = path.resolve(filePath);
    fs.access(absolutePath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).send("File not found.");
      }

      fs.unlink(absolutePath, (err) => {
        if (err) {
          console.log("🚀 ~ Failed to delete the file.");
        }
        console.log("🚀 ~ File deleted successfully.");
      });
    });
    if (!findEvent) {
      return responseHandler(res, 404, "Event not found");
    }

    const deleteEvent = await Event.findByIdAndDelete(id);
    if (deleteEvent) {
      return responseHandler(res, 200, `Event deleted successfully..!`);
    } else {
      return responseHandler(res, 400, `Event deletion failed...!`);
    }
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.getCaseSessions = async (req, res) => {
  try {
    const { caseId } = req.params;
    const sessions = await Session.find({ case_id: caseId })
      .populate("form_id")
      .populate("counsellor", "name");
    const mappedData = sessions.map((session) => {
      return {
        ...session._doc,
        user: session?.form_id?.name,
        counsellor: session?.counsellor?.name,
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
      .populate("form_id")
      .populate("counsellor")
      .populate("case_id");
    if (session) {
      return responseHandler(res, 200, "Session found", session);
    }
    return responseHandler(res, 404, "Session not found");
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.deleteManyEvent = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return responseHandler(
        res,
        400,
        "A non-empty array of Event IDs is required"
      );
    }

    // Track failed deletions
    const failedDeletions = [];

    // Use Promise.allSettled to handle all promises and check for failures
    const deletionResults = await Promise.allSettled(
      ids.map(async (id) => {
        const filePath = await Event.findById(id);
        if (!filePath) {
          failedDeletions.push(id); // Track if event doesn't exist
          return Promise.reject(new Error(`Event with ID ${id} not found`));
        }

        // Direct path due to ISWKOMAN Windows server
        const absolutePath = uploadDir + filePath.requisition_image;

        // Use fs.promises for async/await style file operations
        try {
          await fs.promises.access(absolutePath);
          await fs.promises.unlink(absolutePath);
          console.log("🚀 ~ File deleted successfully.");
        } catch (err) {
          console.error(
            `Failed to delete file for event ID ${id}: ${err.message}`
          );
          failedDeletions.push(id); // Track failed deletions
        }

        return Event.findByIdAndDelete(id);
      })
    );

    // Check results of deletion
    const allDeleted = deletionResults.every(
      (result) => result.status === "fulfilled"
    );
    if (allDeleted) {
      return responseHandler(res, 200, "All events deleted successfully!");
    } else if (failedDeletions.length > 0) {
      return responseHandler(
        res,
        207,
        `Some event deletions failed: ${failedDeletions.join(", ")}`
      );
    } else {
      return responseHandler(res, 400, "Some Event deletions failed.");
    }
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
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
        return await Type.findByIdAndDelete(id);
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

exports.createCounsellingType = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return responseHandler(res, 400, "Counselling type name is required");
    }

    const type = await Type.create({ name });
    if (type) {
      return responseHandler(
        res,
        201,
        "Counselling type created successfully",
        type
      );
    }

    return responseHandler(res, 400, "Counselling type creation failed");
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};

exports.updateCounsellingType = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return responseHandler(res, 400, "Counselling type ID is required");
    }
    const { name } = req.body;
    if (!name) {
      return responseHandler(res, 400, "Counselling type name is required");
    }

    const type = await Type.findByIdAndUpdate(id, { name }, { new: true });
    if (type) {
      return responseHandler(
        res,
        200,
        "Counselling type updated successfully",
        type
      );
    }

    return responseHandler(res, 400, "Counselling type update failed");
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};

exports.deleteCounsellingType = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return responseHandler(res, 400, "Counselling type ID is required");
    }
    const type = await Type.findByIdAndDelete(id);
    if (type) {
      return responseHandler(res, 200, "Counselling type deleted successfully");
    }
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};

exports.getBigCalender = async (req, res) => {
  try {
    const events = await Event.find();
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

exports.deleteCasesSessions = async (req, res) => {
  try {
    await Session.deleteMany({});
    await Case.deleteMany({});
    await Notification.deleteMany({});
    return responseHandler(
      res,
      200,
      "All cases and sessions deleted successfully"
    );
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.updateNumbers = async (req, res) => {
  try {
    await User.updateMany(
      {
        userType: "student",
        $or: [
          { mobile: { $regex: /^\+961/ } },
          { parentContact: { $regex: /^\+961/ } },
        ],
      },
      [
        {
          $set: {
            mobile: {
              $cond: [
                { $regexMatch: { input: "$mobile", regex: /^\+961/ } },
                { $concat: ["+968", { $substr: ["$mobile", 4, -1] }] },
                "$mobile",
              ],
            },
            parentContact: {
              $cond: [
                { $regexMatch: { input: "$parentContact", regex: /^\+961/ } },
                { $concat: ["+968", { $substr: ["$parentContact", 4, -1] }] },
                "$parentContact",
              ],
            },
          },
        },
      ]
    );

    return responseHandler(res, 200, "Phone numbers updated successfully");
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};

exports.getSessionsExcel = async (req, res) => {
  try {
    const { reportType, startDate, endDate, counsellor, grNumber } = req.query;

    let data = [];
    let headers = [];
    const filter = {};

    if (counsellor) filter.counsellor = counsellor;

    if (
      ["session", "session-count"].includes(reportType) &&
      startDate &&
      endDate
    ) {
      filter.session_date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (reportType === "case" && startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (reportType === "session") {
      const sessions = await Session.find(filter)
        .populate({
          path: "form_id",
          match: grNumber ? { grNumber } : undefined,
        })
        .populate("case_id")
        .populate("counsellor");

      headers = [
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

      data = sessions.map((session) => ({
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
    } else if (reportType === "case") {
      const cases = await Case.find(filter)
        .populate({
          path: "form_id",
          match: grNumber ? { grNumber } : undefined,
        })
        .populate("session_ids");

      headers = [
        "Case ID",
        "Student Name",
        "Status",
        "Session ID",
        "Session Date",
        "Session Time",
        "Description",
        "Case Details",
      ];

      data = cases.flatMap((caseItem) => {
        if (!caseItem.session_ids?.length) {
          return {
            case_id: caseItem.case_id,
            student_name: caseItem.form_id?.name || "N/A",
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
          student_name: caseItem.form_id?.name || "N/A",
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
    } else if (reportType === "session-count") {
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

      headers = ["Counsellor Name", "Referee", "Session Count"];
      data = sessions.map((session) => ({
        counsellor_name: session.counsellorName || "N/A",
        referee: session.referee || "N/A",
        session_count: session.sessionCount || 0,
      }));
    }

    return responseHandler(res, 200, "Excel data created successfully", {
      headers,
      data,
    });
  } catch (error) {
    return responseHandler(
      res,
      500,
      `Internal Server Error: ${error.message}`,
      {
        stack: error.stack,
      }
    );
  }
};
