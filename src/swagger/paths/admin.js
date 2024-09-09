/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Admin related endpoints
 *   - name: Case
 *     description: Case related endpoints
 *   - name: Dashboard
 *     description: Dashboard related endpoints
 *   - name: Event
 *     description: Event related endpoints
 *   - name: CounsellingType
 *     description: CounsellingType related endpoints
 */

/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Admin login
 *     description: API endpoint for admin login
 *     tags:
 *       - Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "ttj@duck.com"
 *               password:
 *                 type: string
 *                 example: "12345"
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Bad request
 *       404:
 *         description: Admin not found
 *       401:
 *         description: Invalid password
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /admin:
 *   post:
 *     summary: Create new Admin
 *     description: API endpoint for creating a new admin
 *     tags:
 *       - Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Admin Name"
 *               email:
 *                 type: string
 *                 example: "admin@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: New Admin created successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Admin with this email already exists
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /admin:
 *   get:
 *     summary: Get Admin details
 *     description: API endpoint for getting admin details
 *     tags:
 *       - Admin
 *     responses:
 *       200:
 *         description: Admin found
 *       400:
 *         description: Admin ID is required
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /admin/admin/{id}:
 *   put:
 *     summary: Edit Admin details
 *     description: API endpoint for editing admin details
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "New Admin Name"
 *               email:
 *                 type: string
 *                 example: "newadmin@example.com"
 *               password:
 *                 type: string
 *                 example: "newpassword123"
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
 * /admin/admin/{id}:
 *   delete:
 *     summary: Delete Admin
 *     description: API endpoint for deleting an admin
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the admin
 *     responses:
 *       200:
 *         description: Admin deleted successfully
 *       400:
 *         description: Admin ID is required
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /admin/counsellor:
 *   post:
 *     summary: Create new Counsellor
 *     description: API endpoint for creating a new Counsellor
 *     tags:
 *       - Admin
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
 *               password:
 *                 type: string
 *                 example: "password123"
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               designation:
 *                 type: string
 *                 example: "Dermatologist"
 *               userType:
 *                 type: string
 *                 example: "counsellor"
 *               counsellorType:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["career", "behavioral", "special needs"]
 *     responses:
 *       201:
 *         description: New Counsellor created successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Counsellor with this email already exists
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /admin/student:
 *   post:
 *     summary: Create new Student
 *     description: API endpoint for creating a new Student
 *     tags:
 *       - Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Student Name"
 *               email:
 *                 type: string
 *                 example: "student@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               designation:
 *                 type: string
 *                 example: "BCA"
 *               userType:
 *                 type: string
 *                 example: "student"
 *               parentContact:
 *                 type: string
 *                 example: "8765432109"
 *     responses:
 *       201:
 *         description: New Student created successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Student with this email already exists
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /admin/student/{id}:
 *   delete:
 *     summary: Delete Student
 *     description: API endpoint for deleting an student
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the student
 *     responses:
 *       200:
 *         description: Student deleted successfully
 *       400:
 *         description: Student ID is required
 *       404:
 *         description: Student not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /admin/student/{id}:
 *   put:
 *     summary: Edit Student details
 *     description: API endpoint for updating student details
 *     tags:
 *       - Admin
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
 * /admin/counsellor/{id}:
 *   put:
 *     summary: Edit Counsellor details
 *     description: API endpoint for updating counsellor details
 *     tags:
 *       - Admin
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
 * /admin/list:
 *   get:
 *     summary: List students or counsellers
 *     description: API endpoint for listing data
 *     tags:
 *       - List
 *     parameters:
 *       - name: type
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           enum: [students, counsellers, events, sessions, cases, counselling-type]
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
 *         description: Data found
 *       404:
 *         description: No Data found or invalid type
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /admin/sessions/{userId}:
 *   get:
 *     summary: Get user sessions
 *     description: API endpoint to retrieve all sessions for a specific user
 *     tags:
 *       - Session
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the user whose sessions are to be retrieved
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - name: searchQuery
 *         in: query
 *         schema:
 *           type: string
 *         description: Optional search query to filter sessions
 *     responses:
 *       200:
 *         description: Sessions found
 *       404:
 *         description: No Sessions found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /admin/user/{id}:
 *   get:
 *     summary: Get user details
 *     description: API endpoint to retrieve user details by ID
 *     tags:
 *       - User
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the user to retrieve
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 *       400:
 *         description: User ID is required
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /admin/counsellor/sessions/{counsellorId}:
 *   get:
 *     summary: Get counsellor sessions
 *     description: API endpoint to retrieve all sessions for a specific counsellor
 *     tags:
 *       - Session
 *     parameters:
 *       - name: counsellorId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the counsellor whose sessions are to be retrieved
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - name: searchQuery
 *         in: query
 *         schema:
 *           type: string
 *         description: Optional search query to filter sessions
 *     responses:
 *       200:
 *         description: Sessions found
 *       404:
 *         description: No Sessions found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /admin/counsellor/cases/{counsellorId}:
 *   get:
 *     summary: Get counsellor cases
 *     description: API endpoint to retrieve all cases for a specific counsellor
 *     tags:
 *       - Case
 *     parameters:
 *       - name: counsellorId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the counsellor whose cases are to be retrieved
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - name: searchQuery
 *         in: query
 *         schema:
 *           type: string
 *         description: Optional search query to filter cases
 *     responses:
 *       200:
 *         description: Cases found
 *       404:
 *         description: No Cases found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /admin/counsellors:
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
 * /admin/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Retrieves counts of students, counsellors, cases, and sessions.
 *     parameters:
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
 *         description: Optional status filter
 *     tags:
 *       - Dashboard
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /admin/event:
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
 * /admin/sessions/{caseId}/case:
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
 * /admin/session/{id}:
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
 * /admin/user/delete-many:
 *   post:
 *     summary: Delete multiple user
 *     description: This endpoint deletes multiple user based on the provided array of user IDs.
 *     tags:
 *       - Admin
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
 *                 example: ["user-id", "user-id"]
 *             required:
 *               - ids
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /admin/event/delete-many:
 *   post:
 *     summary: Delete multiple event
 *     description: This endpoint deletes multiple event based on the provided array of event IDs.
 *     tags:
 *       - Event
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
 *                 example: ["event-id", "event-id"]
 *             required:
 *               - ids
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /admin/event/{id}:
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
 * /admin/event/{id}:
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
 * /admin/counsellor/add-bulk:
 *   post:
 *     summary: Create multiple counsellors in bulk
 *     description: This endpoint allows you to create multiple counsellors by providing an array of user data.
 *     tags:
 *       - Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                   format: email
 *                 password:
 *                   type: string
 *                 mobile:
 *                   type: string
 *                 userType:
 *                   type: string
 *                   example: "counsellor"
 *               counsellorType:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["career", "behavioral", "special needs"]
 *             example:
 *               - name: "John Doe"
 *                 email: "john.doe@example.com"
 *                 password: "securePassword123"
 *                 mobile: "1234567890"
 *                 userType: "counsellor"
 *                 counsellorType: "academic"
 *                 designation: "Senior Counsellor"
 *               - name: "Jane Smith"
 *                 email: "jane.smith@example.com"
 *                 password: "anotherSecurePassword"
 *                 mobile: "0987654321"
 *                 userType: "counsellor"
 *                 counsellorType: "career"
 *                 designation: "Junior Counsellor"
 *     responses:
 *       201:
 *         description: Counsellors created successfully
 *       400:
 *         description: Invalid input or Counsellor creation failed
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /admin/student/add-bulk:
 *   post:
 *     summary: Create multiple students in bulk
 *     description: This endpoint allows the creation of multiple students at once by providing an array of student details.
 *     tags:
 *       - Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                   format: email
 *                 password:
 *                   type: string
 *                 mobile:
 *                   type: string
 *                 userType:
 *                   type: string
 *                   example: student
 *                 parentContact:
 *                   type: string
 *                 designation:
 *                   type: string
 *               example:
 *                 name: "John Doe"
 *                 email: "johndoe@example.com"
 *                 password: "securepassword"
 *                 mobile: "1234567890"
 *                 userType: "student"
 *                 parentContact: "0987654321"
 *                 designation: "Grade 10"
 *     responses:
 *       201:
 *         description: Students created successfully
 *       400:
 *         description: Invalid input or creation failed
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /admin/counselling-type:
 *   post:
 *     summary: Create a new counselling type
 *     description: This endpoint allows the creation of a new counselling type by providing the type name.
 *     tags:
 *       - CounsellingType
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Career Counselling"
 *                 description: Name of the counselling type
 *     responses:
 *       201:
 *         description: Counselling type created successfully
 *       400:
 *         description: Counselling type name is required or creation failed
 *       500:
 *         description: Internal Server Error
 *
 * /admin/counselling-type/{id}:
 *   put:
 *     summary: Update an existing counselling type
 *     description: This endpoint allows updating an existing counselling type by providing the type ID and the new name.
 *     tags:
 *       - CounsellingType
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the counselling type to be updated
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Counselling Type"
 *                 description: New name for the counselling type
 *     responses:
 *       200:
 *         description: Counselling type updated successfully
 *       400:
 *         description: Counselling type name or ID is required, or update failed
 *       500:
 *         description: Internal Server Error
 *
 *   delete:
 *     summary: Delete an existing counselling type
 *     description: This endpoint allows deleting a counselling type by providing the type ID.
 *     tags:
 *       - CounsellingType
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the counselling type to be deleted
 *     responses:
 *       200:
 *         description: Counselling type deleted successfully
 *       400:
 *         description: Counselling type ID is required
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /admin/big-calendar:
 *   get:
 *     summary: Get Calender details
 *     description: API endpoint for getting event calendar
 *     tags:
 *       - Calender
 *     responses:
 *       200:
 *         description: Admin calendar
 *       404:
 *         description: Admin calendar not found
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
