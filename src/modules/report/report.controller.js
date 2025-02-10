const responseHandler = require("../../helpers/responseHandler");

exports.report = async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.query;
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};
