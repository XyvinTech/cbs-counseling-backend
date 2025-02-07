require("dotenv").config();
const { MAILER_EMAIL, MAILER_PASSWORD } = process.env;
const nodemailer = require("nodemailer");
const sendMail = async (data) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: MAILER_EMAIL,
        pass: MAILER_PASSWORD,
      },
    });

    const mailOptions = {
      from: MAILER_EMAIL,
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
