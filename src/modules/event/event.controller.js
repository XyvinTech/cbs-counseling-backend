const responseHandler = require("../../helpers/responseHandler");
const Event = require("../../models/eventModel");
const validations = require("../../validations");

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
    req.body.creator = req.user._id;
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

exports.bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return responseHandler(
        res,
        400,
        "A non-empty array of Event IDs is required"
      );
    }

    const failedDeletions = [];

    const deletionResults = await Promise.allSettled(
      ids.map(async (id) => {
        const filePath = await Event.findById(id);
        if (!filePath) {
          failedDeletions.push(id);
          return Promise.reject(new Error(`Event with ID ${id} not found`));
        }

        const absolutePath = uploadDir + filePath.requisition_image;

        try {
          await fs.promises.access(absolutePath);
          await fs.promises.unlink(absolutePath);
          console.log("🚀 ~ File deleted successfully.");
        } catch (err) {
          console.error(
            `Failed to delete file for event ID ${id}: ${err.message}`
          );
          failedDeletions.push(id);
        }

        return Event.findByIdAndDelete(id);
      })
    );

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

exports.getEvents = async (req, res) => {
  try {
    const { page, searchQuery, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skipCount = limit * (page - 1);

    const filter = {};

    if (searchQuery) {
      filter.$or = [{ title: { $regex: searchQuery, $options: "i" } }];
    }

    const count = await Event.countDocuments(filter);
    const events = await Event.find(filter)
      .skip(skipCount)
      .limit(limit)
      .sort({ _id: -1 })
      .lean();

    return responseHandler(res, 200, "Success", events, count);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};
