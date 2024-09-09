const PDFDocument = require("pdfkit");

// Function to create a counseling session report PDF with dummy data
exports.createReport = () => {
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

    // Dummy data
    const studentName = "Anjana";
    const contact = "9896567867";
    const email = "anjanavu2000@gmail.com";
    const caseId = "CS_003";
    const sessionId = "SC_011";
    const appointmentDate = "Sep 09, 2024, 09:00 - 12:00";
    const counsellingType = "Career";
    const grade = "-";
    const reasonForCounselling = "Guidance on future career choices and opportunities.";
    const caseDetails = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
    Sed consectetur molestie elit vel sollicitudin. Fusce erat sapien, mollis non tellus eget, 
    vehicula mollis erat. Sed suscipit rhoncus ligula eget commodo. Integer volutpat blandit 
    turpis eu euismod. Fusce placerat tristique est congue mollis. Aenean a hendrerit neque.`;
    const counsellorName = "John Doe";

    // Title
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor("#0B3559")
      .text("Counseling Session Report", { align: "center" });

    // Student Info
    // if (studentPhoto) {
    //   doc.image(studentPhoto, 50, 80, { width: 100 });
    // }

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(studentName, 160, 80)
      .fontSize(12)
      .font("Helvetica")
      .text(counsellingType, { align: "left" })
      .text(contact, { align: "left" })
      .text(email, { align: "left" });

    // Case and Session Info
    doc
      .moveDown()
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(`Case ID: ${caseId}`, 50, 160)
      .text(`Session No: ${sessionId}`, 300, 160)
      .text(`Grade: ${grade}`, 50, 180)
      .text(`Appointment Date: ${appointmentDate}`, 300, 180)
      .text(`Type of Counselling: ${counsellingType}`, 50, 200)
      .text(`Reason for Counselling/Referral:`, 50, 220);

    doc
      .moveDown()
      .font("Helvetica")
      .fontSize(12)
      .text(reasonForCounselling, 50, 240, { align: "justify" });

    // Case Details
    doc
      .moveDown()
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("Case Details:", 50, 300);

    doc
      .moveDown()
      .font("Helvetica")
      .fontSize(12)
      .text(caseDetails, 50, 320, { align: "justify" });

    // Counsellor Info
    doc
      .moveDown()
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(`Counsellor: ${counsellorName}`, 50, 450);

    // Ending and Signature
    doc
      .font("Helvetica")
      .fontSize(12)
      .text(
        "Thank you for your commitment to our students' well-being.",
        50,
        500
      );

    doc.end();
  });
};
