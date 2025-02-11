const moment = require("moment-timezone");
const PDFDocument = require("pdfkit");

// Function to create a counseling session report PDF
exports.createReport = (session) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    let buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      try {
        let pdfData = Buffer.concat(buffers);
        let base64String = pdfData.toString("base64");
        resolve(base64String);
      } catch (error) {
        reject(error);
      }
    });

    // Extract session data
    const studentName = session.form_id.name || "N/A";
    const grNumber = session.form_id.grNumber || "N/A";
    const className = session.form_id.class || "N/A";
    const refereeName = session.form_id.refereeName || "Student";
    const email = session.form_id.email || "N/A";
    const sessionId = session.session_id || "N/A";
    const sessionDate =
      moment(session.session_date).format("DD-MM-YYYY") || "N/A";
    const sessionTime =
      `${session.session_time.start} - ${session.session_time.end}` || "N/A";
    const status = session.status || "N/A";
    const description = session.description || "N/A";
    const caseDetails = session.case_details || "N/A";
    const counsellingType = session.type || "N/A";
    const counsellor = session.counsellor.name || "N/A";

    // Title with decoration
    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor("#0B3559")
      .text("Counseling Session Report", { align: "center", underline: true })
      .moveDown(1);

    // Add horizontal line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke("#0B3559").moveDown(1);

    // Student Info
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#333333")
      .text("Student Information", { underline: true })
      .moveDown(0.5);

    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#555555")
      .text(`Name: ${studentName}`)
      .text(`GR Number: ${grNumber}`)
      .text(`Class: ${className}`)
      .text(`Referee: ${refereeName}`)
      .text(`Email: ${email}`)
      .moveDown(1);

    // Session Details
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#333333")
      .text("Session Information", { underline: true })
      .moveDown(0.5);

    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#555555")
      .text(`Session ID: ${sessionId}`)
      .text(`Date: ${sessionDate}`)
      .text(`Time: ${sessionTime}`)
      .text(`Status: ${status}`)
      .text(`Type: ${counsellingType}`)
      .moveDown(1);

    // Case Details with highlighted header
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#333333")
      .text("Case Details", { underline: true })
      .moveDown(0.5);

    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#555555")
      .text(caseDetails, { align: "justify" })
      .moveDown(1);

    // Description section with indentation
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#333333")
      .text("Session Description", { underline: true })
      .moveDown(0.5);

    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#555555")
      .text(description, { align: "justify", indent: 20 })
      .moveDown(1);

    // Counsellor Information
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#333333")
      .text("Counsellor Information", { underline: true })
      .moveDown(0.5);

    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#555555")
      .text(`Counsellor: ${counsellor}`)
      .moveDown(1);

    // Footer with decorative text
    doc
      .font("Helvetica-Oblique")
      .fontSize(12)
      .fillColor("#0B3559")
      .text("Thank you for your commitment to our students' well-being.", {
        align: "center",
        lineGap: 5,
      })
      .moveDown(2);

    // Decorative footer line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke("#0B3559");

    doc.end();
  });
};
