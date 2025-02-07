const responseHandler = require("../../helpers/responseHandler");
const User = require("../../models/userModel");
const { hashPassword, comparePasswords } = require("../../utils/bcrypt");
const { generateOTP } = require("../../utils/generateOTP");
const { generateToken } = require("../../utils/generateToken");
const sendMail = require("../../utils/sendMail");
const validation = require("../../validations");

exports.signup = async (req, res) => {
  try {
    const { error } = validation.createAdminSchema.validate(req.body, {
      abortEarly: true,
    });
    if (error) {
      return responseHandler(res, 400, `Invalid input: ${error.message}`);
    }

    const findUser = await User.findOne({ email: req.body.email });
    if (findUser) return responseHandler(res, 400, "Failure");

    req.body.userType = "admin";
    const hashedPassword = await hashPassword(req.body.password);
    req.body.password = hashedPassword;
    const user = await User.create(req.body);
    return responseHandler(res, 200, "Success", user);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.login = async (req, res) => {
  try {
    const { error } = validation.loginSchema.validate(req.body, {
      abortEarly: true,
    });
    if (error) {
      return responseHandler(res, 400, `Invalid input: ${error.message}`);
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    const comparePassword = await comparePasswords(password, user.password);
    if (!comparePassword) {
      return responseHandler(res, 401, "Invalid password");
    }
    const token = generateToken(user._id);
    const data = {
      token,
      userType: user.userType,
    };
    return responseHandler(res, 200, "Success", data);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return responseHandler(res, 400, "Email is required");
    }

    const user = await User.findOne({ email });
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

    const user = await User.findOne({ email });
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
    const id = req.user._id;
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

    const user = await User.findById(id);
    if (!user) {
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
