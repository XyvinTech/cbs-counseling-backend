require("dotenv").config();
const nodemailer = require("nodemailer");
const sendMail = async (data) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "nodetest4342",
        pass: "tucandzsgzzgqxdd",
      },
    });

    const mailOptions = {
      from: "nodetest4342",
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
