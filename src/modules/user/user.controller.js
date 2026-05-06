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
const {
  canCreateCounsellor,
  getStaffCountPayload,
  MAX_ACTIVE_COUNSELLORS,
  isExcludedStaffEmail,
} = require("../../helpers/userLimitCheck");

exports.getStaffUserCount = async (req, res) => {
  try {
    const payload = await getStaffCountPayload();
    return responseHandler(res, 200, "Success", payload);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.createUser = async (req, res) => {
  try {
    const schema =
      req.body.userType === "counsellor"
        ? validation.createCounsellorSchema
        : validation.createStudentSchema;

    const { error } = schema.validate(req.body, { abortEarly: true });
    if (error)
      return responseHandler(res, 400, `Invalid input: ${error.message}`);

    if (
      req.body.userType === "counsellor" &&
      !isExcludedStaffEmail(req.body.email)
    ) {
      const { allowed } = await canCreateCounsellor(1);
      if (!allowed) {
        return responseHandler(
          res,
          403,
          "Counsellor limit reached. Maximum 10 active counsellors allowed."
        );
      }
    }

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
    const existing = await User.findById(id);
    if (!existing) {
      return responseHandler(res, 404, "User not found");
    }
    const reactivatingCounsellor =
      req.body.status === true &&
      existing.status === false &&
      existing.userType === "counsellor";
    if (reactivatingCounsellor && !isExcludedStaffEmail(existing.email)) {
      const { allowed } = await canCreateCounsellor(1);
      if (!allowed) {
        return responseHandler(
          res,
          403,
          "Counsellor limit reached. Maximum 10 active counsellors allowed. Deactivate another counsellor or contact IT."
        );
      }
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
    const existing = await User.findById(req.params.id);
    if (!existing) {
      return responseHandler(res, 404, "User not found");
    }
    if (
      existing.userType === "counsellor" ||
      existing.userType === "admin"
    ) {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { status: false },
        { new: true }
      )
        .select("-password -otp")
        .lean();
      return responseHandler(
        res,
        200,
        "Counselor deactivated successfully. They can no longer sign in until reactivated.",
        user
      );
    }
    await User.findByIdAndDelete(req.params.id);
    return responseHandler(res, 200, "Success", existing);
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

    if (userType === "counsellor") {
      const toCount = users.filter((u) => !isExcludedStaffEmail(u.email)).length;
      if (toCount > 0) {
        const { allowed } = await canCreateCounsellor(toCount);
        if (!allowed) {
          return responseHandler(
            res,
            403,
            "Counsellor limit reached. Maximum 10 active counsellors allowed."
          );
        }
      }
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
    let {
      type,
      page,
      searchQuery,
      limit = 10,
      user = "paginated",
      activeOnly,
      inactiveOnly,
    } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skipCount = limit * (page - 1);

    const filter = {};

    if (inactiveOnly === "true" || inactiveOnly === true) {
      filter.status = false;
    } else if (activeOnly === "true" || activeOnly === true) {
      filter.status = { $ne: false };
    }

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
        userType: "counsellor",
        status: { $ne: false },
      });
    } else {
      counsellors = await User.find({
        _id: { $ne: counsellor },
        userType: "counsellor",
        status: { $ne: false },
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

function normalizeExtendedJSON(obj) {
  if (Array.isArray(obj)) {
    return obj.map(normalizeExtendedJSON);
  } else if (obj && typeof obj === "object") {
    if ("$oid" in obj) return obj.$oid;
    if ("$date" in obj) return new Date(obj.$date);

    const normalized = {};
    for (const key in obj) {
      normalized[key] = normalizeExtendedJSON(obj[key]);
    }
    return normalized;
  }
  return obj;
}

exports.seedUsers = async (req, res) => {
  try {
    await User.deleteMany({});

    const rawData = req.file.buffer.toString("utf-8");
    const parsedData = JSON.parse(rawData);

    const users = normalizeExtendedJSON(parsedData);

    await User.insertMany(users);

    return responseHandler(res, 200, "Users seeded successfully!");
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};


