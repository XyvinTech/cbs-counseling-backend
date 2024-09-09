/**
 * @swagger
 * tags:
 *   - name: Counsellor
 *     description: Counsellor related endpoints
 *   - name: Report
 *     description: Report related endpoints
 *   - name: Calender
 *     description: Calender related endpoints
 */

/**
 * @swagger
 * /counsellor/login:
 *   post:
 *     summary: Counsellor login
 *     description: API endpoint for counsellor login
 *     tags:
 *       - Counsellor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "counsellor@example.com"
 *               password:
 *                 type: string
 *                 example: "12345"
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Bad request
 *       404:
 *         description: Counsellor not found
 *       401:
 *         description: Invalid password
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /counsellor:
 *   get:
 *     summary: Get Counsellor details
 *     description: API endpoint for getting counsellor details
 *     tags:
 *       - Counsellor
 *     responses:
 *       200:
 *         description: Counsellor found
 *       400:
 *         description: Counsellor ID is required
 *       404:
 *         description: Counsellor not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /counsellor/big-calendar:
 *   get:
 *     summary: Get Calender details
 *     description: API endpoint for getting event calendar
 *     tags:
 *       - Calender
 *     responses:
 *       200:
 *         description: Counsellor calendar
 *       404:
 *         description: Counsellor calendar not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /counsellor/times:
 *   post:
 *     summary: Add new times
 *     description: API endpoint for adding new times
 *     tags:
 *       - Counsellor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               day:
 *                 type: string
 *                 example: "Monday"
 *               times:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     start:
 *                       type: string
 *                       example: "10:00"
 *                     end:
 *                       type: string
 *                       example: "11:00"
 *     responses:
 *       201:
 *         description: Time created successfully
 *       400:
 *         description: Invalid input or Time creation failed
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /counsellor/times:
 *   get:
 *     summary: Get times
 *     description: API endpoint for retrieving times
 *     tags:
 *       - Counsellor
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
 * /counsellor/list:
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
 *           enum: [sessions, cases, remarks, events, counselling-type]
 *         description: Type of data to list (currently only supports "sessions", "cases", "events")
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
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *         description: Optional status query to filter results
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
 * /counsellor/accept-session/{id}:
 *   put:
 *     summary: Accept a session
 *     description: API endpoint to accept a session and update its status
 *     tags:
 *       - Session
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the session to accept
 *     responses:
 *       200:
 *         description: Session accepted successfully
 *       400:
 *         description: Session acceptance failed
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /counsellor/counsellors:
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
 * /counsellor/add-entry/{id}:
 *   post:
 *     summary: Add an entry to a case
 *     description: Add a session entry to a specific case and optionally close or refer the case.
 *     tags:
 *       - Session
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the case to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               details:
 *                 type: string
 *               close:
 *                 type: boolean
 *               refer:
 *                 type: string
 *                 format: uuid
 *               date:
 *                 type: string
 *                 format: date
 *               concern_raised:
 *                 type: string
 *                 format: date
 *               time:
 *                 type: string
 *                 format: time
 *               remarks:
 *                 type: string
 *               session_id:
 *                 type: string
 *                 format: uuid
 *               user_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Case closed successfully
 *       201:
 *         description: Session created successfully
 *       400:
 *         description: Invalid input or operation failed
 *       404:
 *         description: Case or session not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /counsellor/sessions/{caseId}:
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
 *           format: uuid
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
 * /counsellor/session/{id}:
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
 *           format: uuid
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
 * /counsellor/reschedule/{id}:
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
 *           format: uuid
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
 * /counsellor/counsellors/{id}/times:
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
 *           format: uuid
 *         description: ID of the counsellor
 *       - name: day
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           example: "Monday"
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
 * /counsellor/cancel-session/{id}:
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
 *           format: uuid
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
 * /counsellor/report:
 *   post:
 *     summary: Create a new report
 *     description: This endpoint creates a new report with the provided name and date.
 *     tags:
 *       - Report
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-07-16"
 *             required:
 *               - name
 *               - date
 *     responses:
 *       200:
 *         description: Report created successfully
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /counsellor/profile/{id}:
 *   put:
 *     summary: Edit Counsellor details
 *     description: API endpoint for updating counsellor details
 *     tags:
 *       - Counsellor
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the counsellor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Counsellor Name"
 *               email:
 *                 type: string
 *                 example: "counsellor@example.com"
 *               status:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Counsellor updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Counsellor not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /counsellor/notifications:
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
 * /counsellor/notification/{id}:
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
 *           format: uuid
 *         description: ID of the notification to be marked as read
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /counsellor/student-report:
 *   post:
 *     summary: Create a student report
 *     description: This endpoint generates a report for a student.
 *     tags:
 *       - Report
 *     responses:
 *       200:
 *         description: Report created successfully
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /counsellor/sessions-excel:
 *   get:
 *     summary: Get sessions report in Excel format
 *     description: This endpoint retrieves session data filtered by student and status, and returns it in a format suitable for Excel export.
 *     tags:
 *       - Session
 *     parameters:
 *       - in: query
 *         name: student
 *         schema:
 *           type: string
 *         description: The ID of the student to filter sessions by
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: The status of the sessions to filter by (e.g., 'completed', 'pending')
 *     responses:
 *       200:
 *         description: Report created successfully
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /counsellor/event:
 *   post:
 *     summary: Create a new event
 *     description: This endpoint creates a new event with the provided details.
 *     tags:
 *       - Event
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2023-06-28"
 *               time:
 *                 type: string
 *                 format: time
 *                 example: "15:30:00"
 *               venue:
 *                 type: string
 *               remainder:
 *                 type: array
 *                 items:
 *                   type: string
 *               details:
 *                 type: string
 *               guest:
 *                 type: string
 *               requisition_description:
 *                 type: string
 *               requisition_image:
 *                 type: string
 *     responses:
 *       201:
 *         description: New Event created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /counsellor/event/{id}:
 *   put:
 *     summary: Edit an event
 *     description: This endpoint allows you to edit an existing event by providing the event ID and updated data.
 *     tags:
 *       - Event
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the event to be edited
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               time:
 *                 type: string
 *                 format: time
 *               event_image:
 *                 type: string
 *               status:
 *                 type: boolean
 *             example:
 *               title: "Annual Meeting"
 *               description: "A meeting to discuss the annual targets and achievements."
 *               date: "2024-07-20"
 *               time: "14:00:00"
 *               event_image: "https://example.com/image.png"
 *               status: true
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       400:
 *         description: Invalid input or Event update failed
 *       404:
 *         description: Event not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /counsellor/event/{id}:
 *   delete:
 *     summary: Delete an event
 *     description: This endpoint deletes an event by its ID.
 *     tags:
 *       - Event
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the event to be deleted
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       400:
 *         description: Event deletion failed
 *       404:
 *         description: Event not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /admin/counselling-type/delete-many:
 *   post:
 *     summary: Delete multiple type
 *     description: This endpoint deletes multiple type based on the provided array of type IDs.
 *     tags:
 *       - CounsellingType
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: ["id", "id"]
 *             required:
 *               - ids
 *     responses:
 *       200:
 *         description: Type deleted successfully
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /counsellor/case/referee-remark/{id}:
 *   put:
 *     summary: Add a referee remark to a case
 *     description: This endpoint allows a counsellor to add their remark to an existing case. The counsellor's name and the remark are added to the case's list of remarks.
 *     tags:
 *       - Case
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the case to update with a new referee remark
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remark:
 *                 type: string
 *                 example: "Provided additional insights on the case."
 *     responses:
 *       200:
 *         description: Remark updated successfully
 *       400:
 *         description: Remark update failed
 *       500:
 *         description: Internal Server Error
 */
