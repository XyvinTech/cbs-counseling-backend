const sql = require("../helpers/sql");

class Admin {
    static async createTable() {
      // Ensure the UUID extension is enabled
      await sql`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      `;
  
      // Create the Admins table with UUID primary key
      await sql`
        CREATE TABLE IF NOT EXISTS Admins (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          status BOOLEAN DEFAULT FALSE,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
    }

  static async create({ name, email, password }) {
    const [admin] = await sql`
      INSERT INTO Admins (name, email, password)
      VALUES (${name}, ${email}, ${password})
      RETURNING *
    `;
    return admin;
  }

  static async findAll({ page = 1, limit = 10, searchQuery = '' } = {}) {
    const offset = (page - 1) * limit;
    let filterCondition = sql``;

    if (searchQuery) {
      filterCondition = sql`
        WHERE name ILIKE ${'%' + searchQuery + '%'}
        OR email ILIKE ${'%' + searchQuery + '%'}
      `;
    }

    return await sql`
      SELECT id, name, email, status, "createdAt", "updatedAt"
      FROM Admins
      ${filterCondition}
      OFFSET ${offset} LIMIT ${limit}
    `;
  }

  static async findById(id) {
    const [admin] = await sql`
      SELECT * FROM Admins WHERE id = ${id}
    `;
    return admin;
  }

  static async findOne(criteria) {
    const key = Object.keys(criteria)[0];
    const value = criteria[key];
    const [admin] = await sql`
      SELECT * FROM Admins WHERE ${sql(key)} = ${value}
    `;
    return admin;
  }
  

  static async update(id, { name, email, status }) {
    const [admin] = await sql`
      UPDATE Admins SET
        name = ${name},
        email = ${email},
        status = ${status},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return admin;
  }

  static async delete(id) {
    await sql`
      DELETE FROM Admins WHERE id = ${id}
    `;
    return true;
  }
}

module.exports = Admin;
