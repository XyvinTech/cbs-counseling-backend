const responseHandler = require("../../helpers/responseHandler");
const Session = require("../../models/sessionModel");
const Time = require("../../models/timeModel");
const TimeRemovalLog = require("../../models/timeRemovalLog");
const validations = require("../../validations");

exports.createTime = async (req, res) => {
  try {
    const addTimeValidator = validations.addTimeSchema.validate(req.body, {
      abortEarly: true,
    });
    if (addTimeValidator.error) {
      return responseHandler(
        res,
        400,
        `Invalid input: ${addTimeValidator.error}`
      );
    }

    req.body.user = req.userId;

    const existingTime = await Time.findOne({
      user: req.userId,
      day: req.body.day,
    });

    if (existingTime) {
      if (req.body.times.length === 0) {
        await Time.findByIdAndDelete(existingTime._id);
        return responseHandler(res, 200, "Time deleted successfully");
      }

      const updatedTime = await Time.findByIdAndUpdate(
        existingTime._id,
        { times: req.body.times },
        { new: true }
      );

      return updatedTime
        ? responseHandler(res, 201, "Time updated successfully", updatedTime)
        : responseHandler(res, 400, "Time update failed");
    }

    const newTime = await Time.create(req.body);
    return responseHandler(res, 201, "Time created successfully", newTime);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};

exports.getTimes = async (req, res) => {
  try {
    const times = await Time.find({ user: req.userId });
    if (!times) return responseHandler(res, 404, "No times found");
    return responseHandler(res, 200, "Times found", times);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.deleteTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { times, reason } = req.body;

    const existingTime = await Time.findById(id);

    if (!existingTime) {
      return responseHandler(res, 404, "Time not found");
    }

    if (Array.isArray(times) && times.length === 0) {
      await Time.findByIdAndDelete(id);
      return responseHandler(res, 200, "Time deleted successfully");
    }

    for (const deleteInterval of times) {
      const intervalExists = existingTime.times.some(
        (existingInterval) =>
          deleteInterval.start === existingInterval.start &&
          deleteInterval.end === existingInterval.end
      );

      if (intervalExists) {
        await TimeRemovalLog.create({
          user: existingTime.user,
          day: existingTime.day,
          time: {
            start: deleteInterval.start,
            end: deleteInterval.end,
          },
          reason: reason || "No reason provided",
        });
      }
    }

    const updatedTimes = existingTime.times.filter(
      (existingInterval) =>
        !times.some(
          (deleteInterval) =>
            deleteInterval.start === existingInterval.start &&
            deleteInterval.end === existingInterval.end
        )
    );

    const updatedTime = await Time.findByIdAndUpdate(
      id,
      { $set: { times: updatedTimes } },
      { new: true }
    );

    return responseHandler(res, 200, "Time updated successfully", updatedTime);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};

exports.getAvailableTimes = async (req, res) => {
  try {
    const { id } = req.params;
    const { day, date } = req.query;
    const currentDate = new Date(date);
    const previousDate = new Date(currentDate);
    previousDate.setDate(currentDate.getDate() - 1);
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 1);

    const filter = {
      user: id,
      session_date: { $gte: previousDate, $lte: nextDate },
    };
    const session = await Session.find(filter);

    const times = await Time.findOne({ user: id, day });

    if (!times || !times.times || times.times.length === 0) {
      return responseHandler(res, 404, "No available times found");
    }

    const availableTimes = times.times.filter(
      (time) =>
        !session.some(
          (sess) =>
            sess.session_time.start === time.start &&
            sess.session_time.end === time.end
        )
    );

    return responseHandler(res, 200, "Available times found", availableTimes);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};

exports.getDays = async (req, res) => {
  try {
    const { id } = req.params;
    const times = await Time.find({ user: id });
    if (!times) return responseHandler(res, 404, "No times found");
    const days = times
      .filter((time) => Array.isArray(time.times) && time.times.length > 0)
      .map((time) => time.day);
    return responseHandler(res, 200, "Days found", days);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error ${error.message}`);
  }
};
