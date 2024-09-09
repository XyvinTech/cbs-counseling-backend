const jwt = require("jsonwebtoken");

exports.generateToken = (userId) => {
  const payload = {
    userId,
  };
  return jwt.sign({ payload }, "5D2B1349ABQWMTF", {});
};
