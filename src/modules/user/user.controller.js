const responseHandler = require("../../helpers/responseHandler");
const Time = require("../../models/timeModel");
const User = require("../../models/userModel");
const sendMail = require("../../utils/sendMail");
const validation = require("../../validations");
const times = require("../../utils/times");
const { hashPassword } = require("../../utils/bcrypt");
const {
  generateRandomPassword,
} = require("../../utils/generateRandomPassword");
const Session = require("../../models/sessionModel");
const Case = require("../../models/caseModel");
const Notification = require("../../models/notificationModel");

exports.createUser = async (req, res) => {
  try {
    const schema =
      req.body.userType === "counsellor"
        ? validation.createCounsellorSchema
        : validation.createStudentSchema;

    const { error } = schema.validate(req.body, { abortEarly: true });
    if (error)
      return responseHandler(res, 400, `Invalid input: ${error.message}`);

    const password = generateRandomPassword();
    req.body.password = await hashPassword(password);

    const user = await User.create(req.body);

    if (user.userType === "counsellor") {
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Sunday"];
      await Promise.all(
        days.map((day) =>
          Time.create({ user: user._id, day, times: times.times })
        )
      );

      await sendMail({
        to: user.email,
        subject: "New counsellor created",
        text: `Hello ${user.name},\n\nYour account has been created. Username: ${user.email}, Password: ${password}\n\nRegards,\nAdmin`,
      });
    }

    return responseHandler(res, 200, "Success", user);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    return responseHandler(res, 200, "Success", user);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return responseHandler(res, 400, "User ID is required");
    }
    const user = await User.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    return responseHandler(res, 200, "Success", user);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("");
    return responseHandler(res, 200, "Success", user);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    return responseHandler(res, 200, "Success", user);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.bulkCreate = async (req, res) => {
  try {
    const users = req.body;
    const userType = users[0]?.userType;

    if (!userType || !["student", "counsellor"].includes(userType)) {
      return responseHandler(res, 400, "Invalid user type");
    }

    const emails = users.map((user) => user.email);
    const mobiles = users.map((user) => user.mobile);

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
      users.map(async (user) => ({
        ...user,
        password: await hashPassword("password123"),
        userType,
      }))
    );

    const createdUsers = await User.create(hashedUsers);

    if (userType === "counsellor") {
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Sunday"];
      const timeEntries = createdUsers.flatMap((user) =>
        days.map((day) => ({
          user: user._id,
          day,
          times: times.times,
        }))
      );

      await Time.create(timeEntries);
    }

    return responseHandler(res, 201, `${userType}s created`, createdUsers);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return responseHandler(
        res,
        400,
        "A non-empty array of User IDs is required"
      );
    }

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
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.getUsers = async (req, res) => {
  try {
    let { type, page, searchQuery, limit = 10, user = "paginated" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skipCount = limit * (page - 1);

    const filter = {};

    if (searchQuery) {
      filter.$or = [
        { name: { $regex: searchQuery, $options: "i" } },
        { email: { $regex: searchQuery, $options: "i" } },
        { mobile: { $regex: searchQuery, $options: "i" } },
      ];
    }

    if (type) {
      filter.userType = type;
    }

    const count = await User.countDocuments(filter);
    const query = User.find(filter)
      .sort({ _id: -1 })
      .select("-password -otp")
      .lean();
    if (user !== "all") {
      query.skip(skipCount).limit(limit);
    }

    const users = await query.exec();

    return responseHandler(res, 200, "Success", users, count);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.getStudent = async (req, res) => {
  try {
    const gr = req.params.gr;
    if (!gr) {
      return responseHandler(res, 400, "User ID is required");
    }
    const findStudent = await User.findOne({ StudentReferencesCode: gr });
    if (!findStudent) {
      return responseHandler(res, 404, "User not found");
    }
    return responseHandler(res, 200, "User found", findStudent);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.getCounsellors = async (req, res) => {
  try {
    const { counsellorType, counsellor } = req.query;
    let counsellors;
    if (counsellorType) {
      counsellors = await User.find({
        counsellorType: { $in: [counsellorType] },
      });
    } else {
      counsellors = await User.find({
        _id: { $ne: counsellor },
        userType: "counsellor",
      });
    }
    const mappedData = counsellors.map((counsellor) => {
      return {
        _id: counsellor._id,
        name: counsellor.name,
        email: counsellor.email,
        type: counsellor.counsellorType,
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
