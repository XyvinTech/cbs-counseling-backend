const responseHandler = require("../../helpers/responseHandler");

exports.report = async (req, res) => {
  try {
    const {
      reportType,
      startDate,
      endDate,
      counselingType,
      counsellor,
      grNumber,
    } = req.query;
    let data = [];
    let headers = [];
    const filter = {};
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};
