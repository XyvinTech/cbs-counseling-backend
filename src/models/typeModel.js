const sql = require("../helpers/sql");

class Type {
  static async createTable() {
    // Ensure the UUID extension is enabled
    await sql`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS Types (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
  }

  static async create({ name }) {
    const [type] = await sql`
      INSERT INTO Types (name)
      VALUES (${name})
      RETURNING *
    `;
    return type;
  }

  static async findAll() {
    const types = await sql`
      SELECT *
      FROM Types
    `;
    return types;
  }

  static async findById(id) {
    const [type] = await sql`
      SELECT *
      FROM Types
      WHERE id = ${id}
    `;
    return type;
  }

  static async update(id, { name }) {
    const [updatedType] = await sql`
      UPDATE Types
      SET name = ${name}
      WHERE id = ${id}
      RETURNING *
    `;
    return updatedType;
  }

  static async delete(id) {
    const [deletedType] = await sql`
      DELETE FROM Types
      WHERE id = ${id}
      RETURNING *
    `;
    return deletedType;
  }
}

module.exports = Type;
