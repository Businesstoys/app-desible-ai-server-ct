// const nodemailer = require('nodemailer')
// let privateKey = process.env.EMAIL_PRIVATE_KEY || ''
// privateKey = privateKey.replace(/\\n/g, '\n')

// const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 465,
//   secure: true,
//   auth: {
//     type: 'OAuth2',
//     user: process.env.GSUITE_EMAIL,
//     serviceClient: process.env.EMAIL_CLIENT_ID,
//     privateKey
//   }
// })

// const sendMail = async ({
//   toEmail,
//   text,
//   subject,
//   cc = []
// }) => {
//   try {
//     await transporter.verify()
//     const message = {
//       from: `Shomor ${process.env.GSUITE_EMAIL}`,
//       to: toEmail,
//       text,
//       subject
//     }
//     if (cc) message.cc = cc

//     const resp = await transporter.sendMail(message)
//     return resp
//   } catch (err) {
//     console.log(err)
//     return new Error(err)
//   }
// }

// const sendMailHTML = async ({
//   toEmail,
//   html,
//   subject,
//   cc = []
// }) => {
//   try {
//     await transporter.verify()
//     const message = {
//       from: `Shomor ${process.env.GSUITE_EMAIL}`,
//       to: toEmail,
//       html,
//       subject
//     }
//     if (cc) message.cc = cc

//     const resp = await transporter.sendMail(message)
//     return resp
//   } catch (err) {
//     console.log(err)
//     return new Error(err)
//   }
// }

module.exports = {
  // sendMail,
  // sendMailHTML,
  nodemailer: require('./nodemailer')
}
