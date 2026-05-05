const responseHandler = require("../../helpers/responseHandler");
const User = require("../../models/userModel");
const csv = require("csv-parser");
const { Readable } = require("stream");

function normalizeCode(code) {
  return String(code).trim();
}

function normalizePhone(phone) {
  if (!phone) return phone;
  phone = String(phone).trim();
  if (!phone.startsWith("968") && !phone.startsWith("+968")) {
    phone = "+968" + phone;
  }
  return phone;
}

exports.importUsersCSV = async (req, res) => {
  try {
    if (!req.file) {
      return responseHandler(res, 400, "No CSV file uploaded.");
    }

    // 🔥 Fix StudentReferencesCode types (from numbers to strings)
    const fixResult = await User.updateMany(
      {
        StudentReferencesCode: {
          $type: ["int", "long", "double"],
        },
      },
      [
        {
          $set: {
            StudentReferencesCode: {
              $toString: "$StudentReferencesCode",
            },
          },
        },
      ]
    );

    const results = [];
    const seenCodes = new Set();
    const batchSize = 500;

    const expectedHeaders = [
      "StudentReferencesCode",
      "designation",
      "division",
      "name",
      "gender",
      "email",
      "mobile",
      "parentContact",
      "userType",
    ];
    let headersValid = true;

    const stream = Readable.from(req.file.buffer);

    stream
      .pipe(csv())
      .on("headers", (headers) => {
        const isValid = expectedHeaders.every((h) => headers.includes(h));
        if (!isValid) {
          headersValid = false;
        }
      })
      .on("data", (data) => {
        if (headersValid) results.push(data);
      })
      .on("error", (error) => {
        return responseHandler(res, 500, `CSV parse error: ${error.message}`);
      })
      .on("end", async () => {
        if (!headersValid) {
          return responseHandler(res, 400, "CSV headers do not match the expected format. Please download existing users to get the correct format.");
        }

        try {
          for (let i = 0; i < results.length; i += batchSize) {
            const batch = results.slice(i, i + batchSize);
            const bulkOps = [];

            for (let user of batch) {
              let {
                StudentReferencesCode,
                designation,
                division,
                name,
                gender,
                email,
                mobile,
                parentContact,
                userType,
              } = user;

              if (!StudentReferencesCode) {
                continue;
              }

              StudentReferencesCode = normalizeCode(StudentReferencesCode);
              mobile = normalizePhone(mobile);
              parentContact = normalizePhone(parentContact);

              seenCodes.add(StudentReferencesCode);

              bulkOps.push({
                updateOne: {
                  filter: { StudentReferencesCode },
                  update: {
                    $set: {
                      designation,
                      division,
                      name,
                      gender,
                      email,
                      mobile,
                      parentContact,
                      userType,
                      status: true,
                    },
                  },
                  upsert: true,
                },
              });
            }

            if (bulkOps.length > 0) {
              const result = await User.bulkWrite(bulkOps);
            }
          }

          if (seenCodes.size > 0) {
            const inactiveResult = await User.updateMany(
              {
                StudentReferencesCode: {
                  $nin: Array.from(seenCodes),
                },
              },
              { $set: { status: false } }
            );
          }

          return responseHandler(res, 200, "Users imported successfully!");
        } catch (error) {
          return responseHandler(res, 500, `Error processing CSV: ${error.message}`);
        }
      });
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};

exports.exportUsersCSV = async (req, res) => {
  try {
    const users = await User.find({ status: { $ne: false } }).lean();
    
    const fields = [
      "StudentReferencesCode",
      "designation",
      "division",
      "name",
      "gender",
      "email",
      "mobile",
      "parentContact",
      "userType",
    ];

    const csvRows = [];
    csvRows.push(fields.join(","));

    for (const user of users) {
      const values = fields.map((field) => {
        let value = user[field];
        if (value === undefined || value === null) {
          value = "";
        } else {
          value = String(value).replace(/"/g, '""');
          if (value.includes(',') || value.includes('\n') || value.includes('"')) {
            value = `"${value}"`;
          }
        }
        return value;
      });
      csvRows.push(values.join(","));
    }

    const csvString = csvRows.join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="student.csv"');
    
    return res.status(200).send(csvString);
  } catch (error) {
    return responseHandler(res, 500, `Internal Server Error: ${error.message}`);
  }
};
