const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2')

const SES = new SESv2Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  }
})

module.exports = { SES, SendEmailCommand }
