require("dotenv").config();
const nodemailer = require("nodemailer");
const sendMail = async (data) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "noreply.able@iswkoman.com",
        pass: "gujaisdmfvjllkoq",
      },
    });

    const mailOptions = {
      from: "noreply.able@iswkoman.com",
      to: data.to,
      subject: data.subject,
      text: data.text,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("🚀 ~ Email sent: ~ response: " + info.response);
      }
    });
  } catch (error) {
    console.log("🚀 ~ sendMail ~ error:", error);
  }
};

module.exports = sendMail;
