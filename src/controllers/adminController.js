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
      userType = user ? user.usertype : null;
    }

    if (!user) {
      return responseHandler(res, 404, "User not found");
    }

    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      return responseHandler(res, 401, "Invalid password");
    }

    const token = generateToken(user.id);
    return responseHandler(res, 200, "Login successful", {
      token,
      userType,
    });
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
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

    const updateAdmin = await Admin.update(id, req.body, {
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

    const deleteAdmin = await Admin.delete(id);
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

    const hashedPassword = await hashPassword(req.body.password);
    req.body.password = hashedPassword;
    const user = await User.create(req.body);
    const day = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    for (let i = 0; i < day.length; i++) {
      await Time.create({
        user: user.id,
        day: day[i],
        times: times.times,
      });
    }
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
        const hashedPassword = await hashPassword(user.password);
        return {
          ...user,
          password: hashedPassword,
        };
      })
    );

    // Create counsellors
    const users = await User.createMany(hashedUsers);

    // Create time entries for each newly created counsellor
    const day = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
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
    await Time.createMany(timeEntries);

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
        const hashedPassword = await hashPassword(user.password);
        return {
          ...user, // Spread the user object to retain other properties
          password: hashedPassword, // Replace the plain password with the hashed password
        };
      })
    );

    const users = await User.createMany(hashedUsers);
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

    const deleteCounsellor = await User.delete(id);
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
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return responseHandler(
        res,
        400,
        "A non-empty array of Counsellor IDs is required"
      );
    }
    const deletionResults = await Promise.all(
      ids.map(async (id) => {
        return await User.delete(id);
      })
    );

    if (deletionResults) {
      return responseHandler(res, 200, "Counsellors deleted successfully!");
    } else {
      return responseHandler(res, 400, "Some counsellor deletions failed.");
    }
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
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

    const hashedPassword = await hashPassword(req.body.password);
    req.body.password = hashedPassword;
    const user = await User.create(req.body);
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

    const deleteStudent = await User.delete(id);
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
    const { type, page, searchQuery, limit } = req.query;
    if (type === "students") {
      const student = await User.findAll({
        page,
        searchQuery,
        userType: "student",
      });
      if (student.length > 0) {
        const totalCount = await User.count({ userType: "student" });
        return responseHandler(res, 200, "Students found", student, totalCount);
      }
      return responseHandler(res, 404, "No Students found");
    } else if (type === "counsellers") {
      const student = await User.findAll({
        page,
        searchQuery,
        userType: "counsellor",
      });
      if (student.length > 0) {
        const totalCount = await User.count({ userType: "counsellor" });
        return responseHandler(
          res,
          200,
          "Counsellers found",
          student,
          totalCount
        );
      }
      return responseHandler(res, 404, "No counsellers found");
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
    } else if (type === "sessions") {
      const sessions = await Session.findAll({
        page,
        limit,
        searchQuery,
      });
      if (sessions.length > 0) {
        const totalCount = await Session.count({});
        return responseHandler(res, 200, "Reports found", sessions, totalCount);
      }
      return responseHandler(res, 404, "No reports found");
    } else if (type === "cases") {
      const sessions = await Case.find({
        page,
        limit,
        searchQuery,
      });
      if (sessions.length > 0) {
        const totalCount = await Session.count({});
        return responseHandler(res, 200, "Reports found", sessions, totalCount);
      }
      return responseHandler(res, 404, "No reports found");
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

exports.getUserSessions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page, searchQuery } = req.query;
    const sessions = await Session.findAllByUserId({
      userId,
      page,
      searchQuery,
    });
    const mappedData = sessions.map((session) => {
      return {
        id: session.id,
        session_date: session.session_date,
        session_time: session.session_time,
        name: session.name,
        counsellor_name: session.counsellor_name,
        counsellor_type: session.type,
      };
    });
    if (sessions.length > 0) {
      const totalCount = await Session.count({ id: userId });
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
    const { page, searchQuery } = req.query;
    const sessions = await Session.findAllByCounsellorId({
      userId,
      page,
      searchQuery,
    });
    const mappedData = sessions.map((session) => {
      return {
        id: session.id,
        session_id: session.session_id,
        session_date: session.session_date,
        session_time: session.session_time,
        student_name: session.user_name,
        counsellor_type: session.type,
        status: session.status,
      };
    });
    if (sessions.length > 0) {
      const totalCount = await Session.counsellor_count({ id: userId });
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
    const { page, searchQuery } = req.query;
    const cases = await Case.findAllByCounsellorId({
      userId,
      page,
      searchQuery,
    });
    const mappedData = cases.map((case_) => {
      return {
        id: case_.id,
        case_id: case_.case_id,
        case_date: case_.createdAt,
        case_time: case_.createdAt,
        student_name: case_.user_name,
        status: case_.status,
      };
    });
    if (cases.length > 0) {
      const totalCount = await Case.counsellor_count({ id: userId });
      return responseHandler(res, 200, "Cases found", mappedData, totalCount);
    }
    return responseHandler(res, 404, "No Cases found", mappedData);
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

exports.getDashboard = async (req, res) => {
  try {
    const { page, limit, searchQuery, status } = req.query;
    const student_count = await User.count({ userType: "student" });
    const counsellor_count = await User.count({ userType: "counsellor" });
    const case_count = await Case.count();
    const session_count = await Session.count({});
    const event_count = await Event.count();
    const session_list = await Session.findAll({
      page,
      limit,
      searchQuery,
      status,
    });
    const totalCount = await Session.count({ status });
    const dashboard = {
      student_count,
      counsellor_count,
      case_count,
      session_count,
      event_count,
      session_list,
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
    const deletionResults = await Promise.all(
      ids.map(async (id) => {
        return await Event.delete(id);
      })
    );

    if (deletionResults) {
      return responseHandler(res, 200, "Event deleted successfully!");
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

    const type = await Type.update(id, { name });
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
    const type = await Type.delete(id);
    if (type) {
      return responseHandler(res, 200, "Counselling type deleted successfully");
    }
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
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
