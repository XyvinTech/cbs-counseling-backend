const sql = require("../helpers/sql");

class Session {
  static async createTable() {
    // Ensure the UUID extension is enabled
    await sql`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `;

    // Create a sequence for session_id
    await sql`
      CREATE SEQUENCE IF NOT EXISTS session_id_seq START 1;
    `;

    // Create the Sessions table with UUID primary key and session_id
    await sql`
      CREATE TABLE IF NOT EXISTS Sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        session_id TEXT UNIQUE,
        "user" UUID REFERENCES Users(id),
        case_id UUID REFERENCES Cases(id),
        session_date DATE,
        session_time JSONB,
        interactions VARCHAR(255),
        type VARCHAR(255),
        status VARCHAR(255) DEFAULT 'pending' CHECK (status IN ('pending', 'progress', 'cancelled', 'completed', 'rescheduled')),
        counsellor UUID REFERENCES Users(id),
        description TEXT,
        report TEXT,
        case_details TEXT,
        reschedule_remark TEXT,
        cancel_remark TEXT,
        c_reschedule_remark TEXT,
        c_cancel_remark TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
  }

  static async create({
    user,
    session_date,
    session_time,
    type,
    status = "pending",
    counsellor,
    description = null,
    report = null,
  }) {
    const [session] = await sql`
  INSERT INTO Sessions (
    "user", session_date, session_time, type, status, counsellor, description, report
  ) VALUES (
    ${user}, ${session_date}, ${sql.json(
      session_time
    )}, ${type}, ${status}, ${counsellor}, ${description}, ${report}
  )
  RETURNING 
    id,
    session_id,
    session_date,
    session_time,
    type,
    status,
    description,
    counsellor,
    report,
    (SELECT email FROM Users WHERE id = "user") AS user_email,
    (SELECT name FROM Users WHERE id = "user") AS user_name,
    (SELECT email FROM Users WHERE id = counsellor) AS counsellor_email,
    (SELECT name FROM Users WHERE id = counsellor) AS counsellor_name
`;
    return session;
  }

  static async findAll({
    page = 1,
    limit = 10,
    searchQuery = "",
    status = null,
  } = {}) {
    const offset = (page - 1) * limit;
    let filterCondition = sql``;

    if (status)
      filterCondition = sql` ${filterCondition} WHERE Sessions.status = ${status}`;

    if (searchQuery) {
      filterCondition = sql`
        AND Users.name ILIKE ${"%" + searchQuery + "%"}
        OR Counsellors.name ILIKE ${"%" + searchQuery + "%"}
      `;
    }

    return await sql`
      SELECT 
        Sessions.*,
        Users.name as user_name,
        Counsellors.name as counsellor_name
      FROM Sessions
      LEFT JOIN Users ON Sessions.user = Users.id
      LEFT JOIN Users as Counsellors ON Sessions.counsellor = Counsellors.id
      ${filterCondition}
      ORDER BY Sessions."createdAt" DESC
      OFFSET ${offset} LIMIT ${limit}
    `;
  }

  static async findAllByUserId({
    userId,
    page = 1,
    limit = 10,
    searchQuery = "",
    status = null,
  } = {}) {
    const offset = (page - 1) * limit;
    let filterCondition = sql` WHERE Sessions."user" = ${userId} `;

    if (status)
      filterCondition = sql` ${filterCondition} AND Sessions.status = ${status}`;

    if (searchQuery) {
      filterCondition = sql`
        ${filterCondition} AND Counsellors.name ILIKE ${"%" + searchQuery + "%"}
      `;
    }

    const query = sql`
      SELECT 
        Sessions.*,
        Users.name as user_name,
        Counsellors.name as counsellor_name,
        Cases.case_id as case_id,
        Cases.id as caseid
      FROM Sessions
      LEFT JOIN Users ON Sessions."user" = Users.id
      LEFT JOIN Cases ON Sessions.case_id = Cases.id
      LEFT JOIN Users as Counsellors ON Sessions.counsellor = Counsellors.id
      ${filterCondition}
      ORDER BY Sessions."createdAt" DESC
      OFFSET ${offset} LIMIT ${limit}
    `;

    return await query;
  }

  static async findAllByCounsellorId({
    userId,
    page = 1,
    limit = 10,
    searchQuery = "",
    status = null,
  } = {}) {
    const offset = (page - 1) * limit;
    let filterCondition = sql` WHERE Sessions.counsellor = ${userId} `;

    if (status) {
      filterCondition = sql`${filterCondition} AND Sessions.status = ${status}`;
    }

    if (searchQuery) {
      filterCondition = sql`
        ${filterCondition} AND Users.name ILIKE ${"%" + searchQuery + "%"}
      `;
    }

    const query = sql`
    SELECT 
      Sessions.*,
      Users.name as user_name,
      Users.designation as grade,
      Users.division as division,
      Counsellors.name as counsellor_name,
      Cases.case_id as caseid,
      Cases.referer as case_referer,
      Cases.referer_remark as referer_remark,
      (
        SELECT json_agg(sub_sessions.case_details)
        FROM Sessions as sub_sessions
        WHERE sub_sessions.case_id = Sessions.case_id
      ) as case_details_array
    FROM Sessions
    LEFT JOIN Users ON Sessions."user" = Users.id
    LEFT JOIN Cases ON Sessions."case_id" = Cases.id
    LEFT JOIN Users as Counsellors ON Sessions.counsellor = Counsellors.id
    ${filterCondition}
    ORDER BY Sessions."createdAt" DESC
    OFFSET ${offset} LIMIT ${limit}
    `;

    return await query;
  }

  static async findRemarksByCounsellorId({
    userId,
    page = 1,
    limit = 10,
    searchQuery = "",
    status = null,
  } = {}) {
    const offset = (page - 1) * limit;

    // Construct JSONB value directly
    const userIdJsonb = JSON.stringify([userId]);

    let filterCondition = sql`WHERE Cases.referer @> ${userIdJsonb}::jsonb`;

    if (status) {
      filterCondition = sql`${filterCondition} AND Sessions.status = ${status}`;
    }

    if (searchQuery) {
      filterCondition = sql`${filterCondition} AND Users.name ILIKE ${
        "%" + searchQuery + "%"
      }`;
    }

    const query = sql`
      SELECT 
        Sessions.*,
        Users.name as user_name,
        Users.designation as grade,
        Users.division as division,
        Counsellors.name as counsellor_name,
        Cases.case_id as caseid,
        Cases.referer as case_referer,
        Cases.referer_remark as referer_remark,
        (
          SELECT json_agg(sub_sessions.case_details)
          FROM Sessions as sub_sessions
          WHERE sub_sessions.case_id = Sessions.case_id
        ) as case_details_array
      FROM Sessions
      LEFT JOIN Users ON Sessions."user" = Users.id
      LEFT JOIN Cases ON Sessions."case_id" = Cases.id
      LEFT JOIN Users as Counsellors ON Sessions.counsellor = Counsellors.id
      ${filterCondition}
      ORDER BY Sessions."createdAt" DESC
      OFFSET ${offset} LIMIT ${limit}
    `;

    return await query;
  }

  static async find() {
    const [session] = await sql`
      SELECT * FROM Sessions 
    `;
    return session;
  }

  static async count({ id, status }) {
    let filterCondition = sql``;

    if (id && status) {
      filterCondition = sql`
        WHERE "user" = ${id} AND "status" = ${status}
      `;
    } else if (id) {
      filterCondition = sql`
        WHERE "user" = ${id}
      `;
    } else if (status) {
      filterCondition = sql`
        WHERE "status" = ${status}
      `;
    }

    const [result] = await sql`
      SELECT COUNT(*) AS count
      FROM Sessions
      ${filterCondition}
    `;

    return result.count;
  }

  static async counsellor_count({ id, status }) {
    let filterCondition = sql``;

    if (id && status) {
      filterCondition = sql`
        WHERE "counsellor" = ${id} AND "status" = ${status}
      `;
    } else if (id) {
      filterCondition = sql`
        WHERE "counsellor" = ${id}
      `;
    } else if (status) {
      filterCondition = sql`
        WHERE "status" = ${status}
      `;
    }

    const [result] = await sql`
      SELECT COUNT(*) AS count
      FROM Sessions
      ${filterCondition}
    `;

    return result.count;
  }

  static async findByUserId(id) {
    const session = await sql`
      SELECT * FROM Sessions 
      WHERE "user" = ${id} 
      AND status IN ('pending', 'progress')
    `;
    return session;
  }

  static async findByCounseller(id, pre, next) {
    const session = await sql`
      SELECT * FROM Sessions 
      WHERE "counsellor" = ${id} 
      AND session_date::date BETWEEN ${pre} AND ${next}
      AND status IN ('pending', 'progress')
    `;
    return session;
  }

  static async findByCounsellerDate(id, date) {
    const session = await sql`
      SELECT * FROM Sessions 
      WHERE "counsellor" = ${id} 
      AND session_date = ${date}
      AND status IN ('pending', 'progress')
    `;
    return session;
  }

  static async findAllByCounsellerId(id) {
    const session = await sql`
      SELECT * FROM Sessions 
      WHERE "counsellor" = ${id} 
      AND status = 'pending'
    `;
    return session;
  }

  static async findForExcel({ userId, status, student }) {
    const session = await sql`
      SELECT 
        Sessions.*,
        Users.name as user_name,
        Cases.case_id as caseid
      FROM Sessions
      LEFT JOIN Users ON Sessions."user" = Users.id
      LEFT JOIN Cases ON Sessions."case_id" = Cases.id
      WHERE "counsellor" = ${userId}
    `;
    return session;
  }

  static async findAllByCaseId(id) {
    const session = await sql`
      SELECT Sessions.*, 
      Users.name as user_name,
      Counsellors.name as counsellor_name
      FROM Sessions
      LEFT JOIN Users ON Sessions.user = Users.id
      LEFT JOIN Users as Counsellors ON Sessions.counsellor = Counsellors.id
      WHERE "case_id" = ${id}
      ORDER BY Sessions."createdAt" DESC
    `;
    return session;
  }

  static async findById(id) {
    const [session] = await sql`
      SELECT 
        Sessions.*,
        Users.name as user_name,
        Users.mobile as user_mobile,
        Users.designation as user_designation,
        Users.division as user_division,
        Counsellors.name as counsellor_name,
        Counsellors.mobile as counsellor_mobile,
        Users.email as user_email,
        Counsellors.email as counsellor_email,
        Counsellors.designation as counsellor_designation,
        Cases.status as case_status,
        Cases.case_id as case_id,
        Cases.id as caseid,
        Cases.referer as case_referer,
        Referers.name as referer_name,
        Cases.referer_remark as referer_remark
      FROM Sessions
      LEFT JOIN Users ON Sessions.user = Users.id
      LEFT JOIN Users as Counsellors ON Sessions.counsellor = Counsellors.id
      LEFT JOIN Cases ON Sessions.case_id = Cases.id
      LEFT JOIN Users as Referers ON (Cases.referer->>'id')::UUID = Referers.id
      WHERE Sessions.id = ${id}
    `;
    return session;
  }

  static async update(
    id,
    {
      session_date,
      session_time,
      type,
      status,
      counsellor,
      description,
      reschedule_remark,
      report,
    }
  ) {
    const [session] = await sql`
      UPDATE Sessions SET
        session_date = ${session_date},
        session_time = ${session_time},
        type = ${type},
        status = ${status},
        counsellor = ${counsellor},
        reschedule_remark = ${reschedule_remark},
        description = ${description},
        report = ${report},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return session;
  }

  static async c_reschedule(
    id,
    { session_date, session_time, c_reschedule_remark }
  ) {
    const [session] = await sql`
      UPDATE Sessions SET
        session_date = ${session_date},
        session_time = ${session_time},
        c_reschedule_remark = ${c_reschedule_remark},
        status = 'progress',
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return session;
  }

  static async close(id, { case_details, interactions }) {
    const [session] = await sql`
      UPDATE Sessions SET
        status = 'completed',
        case_details = ${case_details},
        interactions = ${interactions},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return session;
  }

  static async cancel(id, { cancel_remark }) {
    const [session] = await sql`
      UPDATE Sessions SET
        status = 'cancelled',
        cancel_remark = ${cancel_remark},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return session;
  }

  static async c_cancel(id, { c_cancel_remark }) {
    const [session] = await sql`
      UPDATE Sessions SET
        status = 'cancelled',
        c_cancel_remark = ${c_cancel_remark},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return session;
  }

  static async add_details(id, { details, interactions }) {
    const [session] = await sql`
      UPDATE Sessions SET
        case_details = ${details},
        interactions = ${interactions},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return session;
  }

  static async accept(id) {
    const [session] = await sql`
      UPDATE Sessions SET
        status = 'progress',
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *,
      (SELECT email FROM Users WHERE id = "user") AS "user_email",
      (SELECT email FROM Users WHERE id = counsellor) AS "counsellor_email"
    `;
    return session;
  }

  static async countSessionsById(userid, counsellorid) {
    const [result] = await sql`
      SELECT 
        COUNT(*) as session_count
      FROM Sessions
      WHERE "user" = ${userid} AND counsellor = ${counsellorid}
    `;
    return result.session_count;
  }

  static async delete(id) {
    await sql`
      DELETE FROM Sessions WHERE id = ${id}
    `;
    return true;
  }

  static async dropTable() {
    await sql`
      DROP TABLE IF EXISTS ${sql("cases")} CASCADE;
    `;
  }
}

module.exports = Session;
