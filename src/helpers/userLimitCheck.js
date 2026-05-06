const User = require("../models/userModel");

const MAX_STAFF_USERS = 10;
const EXCLUDED_EMAIL = "ttj@duck.com";

function isExcludedStaffEmail(email) {
  if (!email) return false;
  return String(email).trim().toLowerCase() === EXCLUDED_EMAIL;
}

const staffUserFilter = () => ({
  userType: { $in: ["admin", "counsellor"] },
  email: { $nin: [EXCLUDED_EMAIL] },
});

async function getStaffUserCount() {
  return User.countDocuments(staffUserFilter());
}

async function canCreateStaffUser(countToAdd = 1) {
  const currentCount = await getStaffUserCount();
  const maxCount = MAX_STAFF_USERS;
  const allowed = currentCount + countToAdd <= maxCount;
  return { allowed, currentCount, maxCount };
}

module.exports = {
  MAX_STAFF_USERS,
  EXCLUDED_EMAIL,
  isExcludedStaffEmail,
  getStaffUserCount,
  canCreateStaffUser,
};
