const moment = require("moment-timezone");
const PDFDocument = require("pdfkit");

exports.generateCasePDF = (cases) => {
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

    const {
      form_id,
      case_id,
      concern_raised,
      createdAt,
      updatedAt,
      status,
      session_ids,
    } = cases;
    const studentName = form_id.name || "N/A";
    const grNumber = form_id.grNumber || "N/A";
    const className = form_id.class || "N/A";
    const refereeName = form_id.refereeName || "Student";
    const email = form_id.email || "N/A";

    const concernRaised = moment(concern_raised).format("DD-MM-YYYY");
    const caseCreated = moment(createdAt).format("DD-MM-YYYY");
    const lastUpdated = moment(updatedAt).format("DD-MM-YYYY");

    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor("#0B3559")
      .text("Counseling Case Report", { align: "center" })
      .moveDown(1);

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke("#0B3559").moveDown(1);

    function drawRoundedRect(
      x,
      y,
      width,
      height,
      radius,
      fillColor,
      strokeColor
    ) {
      doc
        .moveTo(x + radius, y)
        .lineTo(x + width - radius, y)
        .quadraticCurveTo(x + width, y, x + width, y + radius)
        .lineTo(x + width, y + height - radius)
        .quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
        .lineTo(x + radius, y + height)
        .quadraticCurveTo(x, y + height, x, y + height - radius)
        .lineTo(x, y + radius)
        .quadraticCurveTo(x, y, x + radius, y)
        .fillAndStroke(fillColor, strokeColor);
    }

    const boxWidth = 230;
    const boxHeight = 140;
    const startX = 50;
    const startY = doc.y;
    const gap = 20;

    drawRoundedRect(
      startX,
      startY,
      boxWidth,
      boxHeight,
      10,
      "#F1E8FF",
      "#0B3559"
    );
    drawRoundedRect(
      startX + boxWidth + gap,
      startY,
      boxWidth,
      boxHeight,
      10,
      "#F1E8FF",
      "#0B3559"
    );

    doc
      .fillColor("#333333")
      .font("Helvetica-Bold")
      .fontSize(14)
      .text("Student Information", startX + 10, startY + 10);
    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#555555")
      .text(`Name: ${studentName}`, startX + 10, startY + 30)
      .text(`GR Number: ${grNumber}`, startX + 10, startY + 50)
      .text(`Class: ${className}`, startX + 10, startY + 70)
      .text(`Referee: ${refereeName}`, startX + 10, startY + 90)
      .text(`Email: ${email}`, startX + 10, startY + 110);

    doc
      .fillColor("#333333")
      .font("Helvetica-Bold")
      .fontSize(14)
      .text("Case Details", startX + boxWidth + gap + 10, startY + 10);
    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#555555")
      .text(`Case ID: ${case_id}`, startX + boxWidth + gap + 10, startY + 30)
      .text(
        `Concern raised: ${concernRaised}`,
        startX + boxWidth + gap + 10,
        startY + 50
      )
      .text(
        `Case Opened: ${caseCreated}`,
        startX + boxWidth + gap + 10,
        startY + 70
      )
      .text(
        `Last Updated: ${lastUpdated}`,
        startX + boxWidth + gap + 10,
        startY + 90
      )
      .text(`Status: ${status}`, startX + boxWidth + gap + 10, startY + 110);

    doc.moveDown(2);

    const pageWidth = doc.page.width;
    const marginLeft = 50;
    const textWidth = doc.widthOfString("Session Details");
    const centerX = (pageWidth - textWidth) / 2 - marginLeft + 10;

    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor("#0B3559")
      .text("Session Details", centerX, doc.y, { underline: true });

    session_ids.forEach((session, index) => {
      const sessionDate = moment(session.session_date).format("DD-MM-YYYY");
      const sessionStart = session.session_time.start;
      const sessionEnd = session.session_time.end;
      const sessionType = session.type;
      const sessionStatus = session.status;
      const sessionCounsellor = session.counsellor.name;
      const sessionDescription = session.description.trim();
      const sessionCaseDetails = session.case_details.trim();

      doc
        .fillColor("#333333")
        .font("Helvetica-Bold")
        .fontSize(14)
        .text(`Session #${index + 1}: ${session.session_id}`, 60, doc.y + 10)
        .font("Helvetica")
        .fontSize(12)
        .fillColor("#555555")
        .text(`Date: ${sessionDate} | Time: ${sessionStart} - ${sessionEnd}`)
        .text(`Type: ${sessionType}`)
        .text(`Status: ${sessionStatus}`)
        .text(`Counsellor: ${sessionCounsellor}`);

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#333333")
        .text("Session Description:", { underline: true });

      doc
        .font("Helvetica")
        .fontSize(12)
        .fillColor("#555555")
        .text(sessionDescription, { align: "justify", indent: 20 })
        .moveDown(0.5);

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#333333")
        .text("Case Details:", { underline: true });

      doc
        .font("Helvetica")
        .fontSize(12)
        .fillColor("#555555")
        .text(sessionCaseDetails, { align: "justify", indent: 20 })
        .moveDown(1.5);
    });

    doc
      .font("Helvetica-Oblique")
      .fontSize(12)
      .fillColor("#0B3559")
      .text("Thank you for your commitment to our students' well-being.", {
        align: "center",
        lineGap: 5,
      })
      .moveDown(2);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke("#0B3559");

    doc.end();
  });
};
