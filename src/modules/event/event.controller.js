const responseHandler = require("../../helpers/responseHandler");
const fs = require("fs");
const path = require("path");
const Event = require("../../models/eventModel");
const validations = require("../../validations");
const User = require("../../models/userModel");

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

    if (!req.body.counselor) {
      if (req.user.userType === "counsellor") {
        req.body.counselor = [req.userId];
      }
    }

    if (req.body.counselor && req.body.counselor.length > 0) {
      if (req.body.counselor[0] === "*") {
        let allUsers = await User.find({ userType: "counsellor" });
        req.body.counselor = allUsers.map((user) => user._id);
      } else {
        if (req.user.userType === "counsellor") {
          req.body.counselor = [
            ...new Set([...req.body.counselor, req.userId]),
          ];
        }
      }
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

    if (req.body.counselor && req.body.counselor.length > 0) {
      if (req.body.counselor[0] === "*") {
        let allUsers = await User.find({ userType: "counsellor" });
        req.body.counselor = allUsers.map((user) => user._id);
      }
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
    if (!findEvent) {
      return responseHandler(res, 404, "Event not found");
    }
    const filePath = findEvent.requisition_image;
    if (filePath) {
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
    let { page, searchQuery, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skipCount = limit * (page - 1);

    const filter = {};

    if (searchQuery) {
      filter.$or = [{ title: { $regex: searchQuery, $options: "i" } }];
    }

    let user = req.user;
    if (user.userType === "counsellor") {
      filter.counselor = { $in: [user._id] };
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

exports.getCalender = async (req, res) => {
  try {
    let user = req.user;
    let filter = {};
    if (user.userType === "counsellor") {
      filter.counselor = { $in: [user._id] };
    }
    const events = await Event.find(filter);
    if (events.length > 0) {
      const mappedData = events.map((event) => {
        return {
          _id: event._id,
          title: event.title,
          start: event.date,
          end: event.date,
          venue: event.venue,
          guest: event.guest,
          type: event.type,
          details: event.details,
          creator: event.creator,
          counselor: event.counselor,
          start_time: event.start_time,
          end_time: event.end_time,
          requisition_description: event.requisition_description,
          requisition_image: event.requisition_image,
        };
      });
      return responseHandler(res, 200, "Events found", mappedData);
    }
    return responseHandler(res, 404, "No Events found");
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.getEvent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return responseHandler(res, 400, "Event ID is required");
    }
    let user = req.user;
    let filter = {
      _id: id,
    };
    if (user.userType === "counsellor") {
      filter.counselor = { $in: [user._id] };
    }
    const event = await Event.findById(filter);
    if (event) {
      return responseHandler(res, 200, "Success", event);
    }
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};
