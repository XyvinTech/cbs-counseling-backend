/**
 * @swagger
 * tags:
 *   - name: User
 *     description: User related endpoints
 *   - name: Session
 *     description: Session related endpoints
 *   - name: List
 *     description: List related endpoints
 *   - name: Notification
 *     description: Notification related endpoints
 */

/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: User login
 *     description: API endpoint for user login
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "philip@gmail.com"
 *               password:
 *                 type: string
 *                 example: "12345"
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Email and password are required
 *       404:
 *         description: User not found
 *       401:
 *         description: Invalid password
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Get Student details
 *     description: API endpoint for getting student details
 *     tags:
 *       - User
 *     responses:
 *       200:
 *         description: User found
 *       400:
 *         description: User ID is required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /user/session:
 *   post:
 *     summary: Create new Session
 *     description: API endpoint for creating a new counseling session
 *     tags:
 *       - Session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               session_date:
 *                 type: string
 *                 format: date
 *                 example: "2023-06-28"
 *               session_time:
 *                 type: object
 *                 properties:
 *                   start:
 *                     type: string
 *                     format: time
 *                     example: "10:00"
 *                   end:
 *                     type: string
 *                     format: time
 *                     example: "11:00"
 *                 required:
 *                   - start
 *                   - end
 *               type:
 *                 type: string
 *                 example: "career"
 *               counsellor:
 *                 type: string
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               description:
 *                 type: string
 *                 example: "A brief description of the session"
 *               report:
 *                 type: string
 *                 example: "Detailed report of the session"
 *     responses:
 *       201:
 *         description: New Session created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /user/list:
 *   get:
 *     summary: List sessions or reports
 *     description: API endpoint for listing sessions or reports based on type
 *     tags:
 *       - List
 *     parameters:
 *       - name: type
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           enum: [sessions, cases, events, counselling-type]
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - name: searchQuery
 *         in: query
 *         schema:
 *           type: string
 *         description: Optional search query to filter results
 *     responses:
 *       200:
 *         description: Sessions found
 *       404:
 *         description: No sessions found or invalid type
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /user/reschedule/{id}:
 *   put:
 *     summary: Reschedule a session
 *     description: API endpoint for rescheduling a session
 *     tags:
 *       - Session
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the session to reschedule
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               session_date:
 *                 type: string
 *                 format: date
 *                 example: "2023-07-01"
 *               session_time:
 *                 type: string
 *                 format: time
 *                 example: "15:30:00"
 *     responses:
 *       200:
 *         description: Session rescheduled successfully
 *       400:
 *         description: Session date & time is required or You can't reschedule this session or Session reschedule failed
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /user/counseller/{id}/times:
 *   get:
 *     summary: Counsellor available times
 *     description: API endpoint for getting available times for a specific day
 *     tags:
 *       - Counsellor
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the counsellor
 *       - name: day
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           example: "Monday"
 *       - name: date
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2023-06-28"
 *         description: Day of the week to find available times
 *     responses:
 *       200:
 *         description: Times found
 *       404:
 *         description: No times found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /user/counsellors:
 *   get:
 *     summary: Get all counsellors
 *     description: API endpoint to retrieve all counsellors, optionally filtered by type
 *     tags:
 *       - Counsellor
 *     parameters:
 *       - name: counsellorType
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter counsellors by type
 *     responses:
 *       200:
 *         description: Counsellors found
 *       404:
 *         description: No counsellors found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /user/sessions/{caseId}:
 *   get:
 *     summary: Get sessions by case ID
 *     description: Retrieve all sessions associated with a specific case ID.
 *     tags:
 *       - Session
 *     parameters:
 *       - name: caseId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the case to retrieve sessions for
 *     responses:
 *       200:
 *         description: Sessions found
 *       404:
 *         description: No sessions found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /user/session/{id}:
 *   get:
 *     summary: Get a session by ID
 *     description: Retrieve details of a specific session using its ID.
 *     tags:
 *       - Session
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the session to retrieve
 *     responses:
 *       200:
 *         description: Session found
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /user/cancel-session/{id}:
 *   put:
 *     summary: Cancel a session
 *     description: Cancels a session by its ID.
 *     tags:
 *       - Session
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the session to cancel
 *     responses:
 *       200:
 *         description: Session cancelled successfully
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /user/counseller/full-times/{id}:
 *   get:
 *     summary: Counsellor full times
 *     description: API endpoint for getting full times
 *     tags:
 *       - Counsellor
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the counsellor
 *     responses:
 *       200:
 *         description: Times found
 *       404:
 *         description: No times found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /user/profile/{id}:
 *   put:
 *     summary: Edit Student details
 *     description: API endpoint for updating student details
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the student
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "New Student Name"
 *               email:
 *                 type: string
 *                 example: "student@example.com"
 *               password:
 *                 type: string
 *                 example: "newpassword123"
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               designation:
 *                 type: string
 *                 example: "BCA"
 *               status:
 *                 type: boolean
 *                 example: true
 *               parentContact:
 *                 type: string
 *                 example: "8765432109"
 *     responses:
 *       200:
 *         description: Admin updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /user/notifications:
 *   get:
 *     summary: Get notifications for a user
 *     description: Retrieve all notifications associated with the authenticated user.
 *     tags:
 *       - Notification
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       400:
 *         description: No notifications found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /user/notification/{id}:
 *   put:
 *     summary: Mark a notification as read
 *     description: Mark a specific notification as read using its ID.
 *     tags:
 *       - Notification
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the notification to be marked as read
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal Server Error
 */
