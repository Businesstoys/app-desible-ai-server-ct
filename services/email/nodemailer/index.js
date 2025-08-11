const nodemailer = require('nodemailer')
// const AWS = require('@/services/aws')

// const transporter = nodemailer.createTransport({
//   SES: {
//     sesClient: AWS.SES.SES,
//     SendEmailCommand: AWS.SES.SendEmailCommand
//   }
// })

const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
})

const sendMail = ({ toEmail, subject, text, bcc = [] }) =>
  new Promise((resolve, reject) => {
    transporter.sendMail(
      {
        from: `"Desible AI" <${process.env.SENDER_EMAIL}>`,
        to: toEmail,
        subject,
        text,
        bcc
      },
      (error, info) => {
        if (error) {
          console.error('Error sending email:', error)
          reject(error)
        } else {
          resolve(info)
        }
      }
    )
  })

const sendMailHTML = ({ toEmail, subject, html, attachments = [] }) =>
  new Promise((resolve, reject) => {
    transporter.sendMail(
      {
        from: `"Desible AI" <${process.env.SENDER_EMAIL}>`,
        to: toEmail,
        subject,
        html,
        attachments
      },
      (error, info) => {
        if (error) {
          reject(error)
        } else {
          resolve(info)
        }
      }
    )
  })

module.exports = { sendMail, sendMailHTML }
