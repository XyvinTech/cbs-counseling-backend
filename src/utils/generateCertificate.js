const PDFDocument = require("pdfkit");

// The createCertificate function definition
exports.createCertificate = (name, issueDate) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 50,
    });

    // Create a buffer to hold the PDF data
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

    // Background
    doc.image("bg.jpg", 0, 0, {
      width: 841.89,
      height: 595.28,
    });

    // Title
    doc
      .font("Helvetica-Bold")
      .fontSize(24)
      .fillColor("#0B3559")
      .text("SPECIAL40", 50, 60, { align: "center" });

    doc.fontSize(18).text("CERTIFICATE OF COUNSELLING", { align: "center" });

    // Candidate Name
    doc
      .font("Helvetica-Bold")
      .fontSize(24)
      .fillColor("#0B3559")
      .text(name, { align: "center" });

    // Description
    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#000000")
      .text(
        `For successfully completing the two-month pre-employment training program with 
          CAPITAIRE Consultants LLP, which focuses on upskilling the working knowledge of 
          Accounting, Taxation, and Business for Commerce Graduates.`,
        50,
        150,
        { align: "center" }
      );

    // Period of Training
    doc
      .font("Helvetica")
      .fontSize(12)
      .text("Period of Training: 06 September 2023 to 09 November 2023", {
        align: "center",
      });

    // Signature
    doc.font("Helvetica").fontSize(12).text("CA. Sreejith Kuniyil", 50, 500);

    doc.font("Helvetica").fontSize(12).text("Managing Partner", 50, 515);

    doc
      .font("Helvetica")
      .fontSize(12)
      .text("CAPITAIRE Consultants LLP", 50, 530);

    // Issue Date
    doc
      .font("Helvetica")
      .fontSize(12)
      .text(`Issue Date: ${issueDate}`, 700, 500);

    doc.end();
  });
};
