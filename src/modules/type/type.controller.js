const responseHandler = require("../../helpers/responseHandler");
const Type = require("../../models/typeModel");

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

exports.bulkDelete = async (req, res) => {
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

exports.getCounsellingTypes = async (req, res) => {
  try {
    const { page, limit = 10, searchQuery } = req.query;
    const filter = {};

    if (searchQuery) {
      filter.name = { $regex: searchQuery, $options: "i" };
    }

    const skipCount = limit * (page - 1);

    const types = await Type.find(filter)
      .skip(skipCount)
      .limit(limit)
      .sort({ _id: -1 });
    return responseHandler(res, 200, "Success", types, types.length);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};

exports.getCounsellingType = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return responseHandler(res, 400, "Counselling type ID is required");
    }
    const type = await Type.findById(id);
    if (type) {
      return responseHandler(res, 200, "Success", type);
    }
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};
