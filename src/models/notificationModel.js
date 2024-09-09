const sql = require("../helpers/sql");

class Notification {
  static async createTable() {
    // Ensure the UUID extension is enabled
    await sql`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `;

    // Create the Cases table with UUID primary key
    await sql`
      CREATE TABLE IF NOT EXISTS Notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user" UUID REFERENCES Users(id),
        case_id UUID REFERENCES Cases(id),
        session UUID REFERENCES Sessions(id),
        details TEXT,
        isRead BOOLEAN DEFAULT FALSE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
  }

  static async create({ user, caseId, session, details, isRead = false }) {
    const [notification] = await sql`
      INSERT INTO Notifications (
        "user", case_id, session, details, isRead
      ) VALUES (
        ${user}, ${caseId}, ${session}, ${details}, ${isRead}
      )
      RETURNING *
    `;
    return notification;
  }

  static async findByUserId(userId) {
    const notifications = await sql`
      SELECT * FROM Notifications
      WHERE "user" = ${userId}
      AND isRead = FALSE
      ORDER BY "createdAt" DESC
    `;
    return notifications;
  }

  static async markAsRead(id) {
    const [notification] = await sql`
      UPDATE Notifications
      SET isRead = TRUE, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return notification;
  }

  static async updateStatusToTrue(notificationIds) {
    await sql`
      UPDATE Notifications
      SET isRead = TRUE, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id IN (${sql(notificationIds)})
    `;
  }
}

module.exports = Notification;
