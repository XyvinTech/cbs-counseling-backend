const User = require("../models/userModel");

/** Licensed counselor seats (active counsellors only; admins excluded). */
const MAX_ACTIVE_COUNSELLORS = 10;
const EXCLUDED_EMAIL = "ttj@duck.com";

function isExcludedStaffEmail(email) {
  if (!email) return false;
  return String(email).trim().toLowerCase() === EXCLUDED_EMAIL;
}

const activeCounsellorFilter = () => ({
  userType: "counsellor",
  email: { $nin: [EXCLUDED_EMAIL] },
  status: { $ne: false },
});

const activeAdminFilter = () => ({
  userType: "admin",
  status: { $ne: false },
});

async function getActiveCounsellorCount() {
  return User.countDocuments(activeCounsellorFilter());
}

async function getActiveAdminCount() {
  return User.countDocuments(activeAdminFilter());
}

async function canCreateCounsellor(countToAdd = 1) {
  const currentCount = await getActiveCounsellorCount();
  const maxCount = MAX_ACTIVE_COUNSELLORS;
  const allowed = currentCount + countToAdd <= maxCount;
  return { allowed, currentCount, maxCount };
}

/** Staff-count API: counsellor cap + separate admin tally */
async function getStaffCountPayload() {
  const [counsellorCount, adminCount] = await Promise.all([
    getActiveCounsellorCount(),
    getActiveAdminCount(),
  ]);
  return {
    currentCount: counsellorCount,
    maxCount: MAX_ACTIVE_COUNSELLORS,
    counsellorCount,
    adminCount,
    maxCounsellors: MAX_ACTIVE_COUNSELLORS,
  };
}

module.exports = {
  MAX_ACTIVE_COUNSELLORS,
  /** @deprecated use MAX_ACTIVE_COUNSELLORS — kept for any stray requires */
  MAX_STAFF_USERS: MAX_ACTIVE_COUNSELLORS,
  EXCLUDED_EMAIL,
  isExcludedStaffEmail,
  getActiveCounsellorCount,
  getActiveAdminCount,
  canCreateCounsellor,
  getStaffCountPayload,
};
