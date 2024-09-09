const sql = require("../helpers/sql");

class Event {
  static async createTable() {
    // Ensure the UUID extension is enabled
    await sql`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `;

    // Create the Events table with UUID primary key
    await sql`
      CREATE TABLE IF NOT EXISTS Events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255),
        date DATE,
        time TIME,
        venue VARCHAR(255),
        guest VARCHAR(255),
        requisition_image VARCHAR(255),
        remainder VARCHAR(255)[],
        details TEXT,
        requisition_description TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
  }

  static async create({
    title,
    date,
    time,
    venue,
    guest,
    requisition_image = null,
    remainder,
    details,
    requisition_description,
  }) {
    const [event] = await sql`
      INSERT INTO Events (
        title, date, time, venue, guest, requisition_image, remainder, details, requisition_description
      ) VALUES (
        ${title}, ${date}, ${time}, ${venue}, ${guest}, ${requisition_image}, ${sql.array(
      remainder
    )}, ${details}, ${requisition_description}
      )
      RETURNING *
    `;
    return event;
  }

  static async findAllForCalender() {
    return await sql`
      SELECT id, title, date
      FROM Events
    `;
  }

  static async findAll({ page = 1, limit = 10, searchQuery = "" } = {}) {
    const offset = (page - 1) * limit;
    let filterCondition = sql``;

    if (searchQuery) {
      filterCondition = sql`
        WHERE title ILIKE ${"%" + searchQuery + "%"}
        OR details ILIKE ${"%" + searchQuery + "%"}
      `;
    }

    return await sql`
      SELECT id, title, date, time, venue, guest, requisition_image, remainder, details, requisition_description, "createdAt", "updatedAt"
      FROM Events
      ${filterCondition}
      OFFSET ${offset} LIMIT ${limit}
    `;
  }

  static async findById(id) {
    const [event] = await sql`
      SELECT * FROM Events WHERE id = ${id}
    `;
    return event;
  }

  static async update(
    id,
    {
      title,
      date,
      time,
      venue,
      guest,
      requisition_image,
      remainder,
      details,
      requisition_description,
    }
  ) {
    const [event] = await sql`
      UPDATE Events SET
        title = ${title},
        date = ${date},
        time = ${time},
        venue = ${venue},
        guest = ${guest},
        requisition_image = ${requisition_image},
        remainder = ${sql.array(remainder)},
        details = ${details},
        requisition_description = ${requisition_description},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return event;
  }

  static async count() {
    const [result] = await sql`
      SELECT COUNT(*) FROM Events
    `;
    return result.count;
  }

  static async delete(id) {
    await sql`
      DELETE FROM Events WHERE id = ${id}
    `;
    return true;
  }
}

module.exports = Event;
