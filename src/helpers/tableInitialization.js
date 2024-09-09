const { createTable: createSessionTable } = require("../models/sessionModel");
const { createTable: createUserTable } = require("../models/userModel");
const { createTable: createTimeTable } = require("../models/timeModel");
const { createTable: createAdminTable } = require("../models/adminModel");
const { createTable: createEventTable } = require("../models/eventModel");
const { createTable: createCaseTable } = require("../models/caseModel");
const { createTable: createTypeTable } = require("../models/typeModel");
const {
  createTable: createNotificationTable,
} = require("../models/notificationModel");

async function initializeTables() {
  try {
    await createAdminTable();
    await createUserTable();
    await createCaseTable();
    await createSessionTable();
    await createTimeTable();
    await createEventTable();
    await createNotificationTable();
    await createTypeTable();
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  }
}

module.exports = initializeTables;
