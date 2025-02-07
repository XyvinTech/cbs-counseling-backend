const jwt = require("jsonwebtoken");
const responseHandler = require("../helpers/responseHandler");
const User = require("../models/userModel");

const authVerify = async (req, res, next) => {
  try {
    //? Check for API key
    const apiKey = req.headers["api-key"];
    if (!apiKey) {
      return responseHandler(res, 401, "No API key provided.");
    }
    if (apiKey !== process.env.API_KEY) {
      return responseHandler(res, 401, "Invalid API key.");
    }

    //? Check for authorization header and extract token
    const authHeader = req.headers["authorization"];
    const jwtToken = authHeader && authHeader.split(" ")[1];
    if (!jwtToken) {
      return responseHandler(res, 401, "No token provided.");
    }

    //? Verify JWT token
    const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
    req.userId = decoded.userId;

    //? Find the user in the database
    const user = await User.findById(req.userId);
    if (!user) {
      return responseHandler(res, 401, "User not found.");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return responseHandler(res, 403, "Invalid token.");
    }
    if (error.name === "TokenExpiredError") {
      return responseHandler(res, 403, "Token has expired.");
    }
    return responseHandler(res, 500, "Failed to authenticate token.");
  }
};

module.exports = authVerify;
