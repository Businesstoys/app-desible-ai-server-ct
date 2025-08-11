const { optimus } = require('@/services')
const aws = require('@/services/aws')
const { default: axios } = require('axios')

const uploadToAWS = async ({ file, callId }) => {
  try {
    const awsResponse = await aws.s3.uploadToS3({
      Bucket: process.env.BUCKET_NAME_OPTIMUS,
      file: file.data,
      Key: `kolorBlue/${callId}/${file?.name}`,
      ContentType: file.mimetype
    })

    return awsResponse
  } catch (error) {
    throw new Error(`Failed to upload recording: ${error.message}`)
  }
}

const fetchAndUploadRecording = async ({ twilioRecordingUrl, callId }) => {
  try {
    const response = await axios({
      url: twilioRecordingUrl,
      method: 'GET',
      responseType: 'stream'
    })

    const fileExtension = twilioRecordingUrl.split('.').pop()

    const file = {
      data: response.data,
      name: `${callId}.${fileExtension}`,
      mimetype: response.headers['content-type']
    }

    const awsResponse = await uploadToAWS({ callId, file })

    return awsResponse
  } catch (error) {
    throw new Error(`Failed to Fetch recording: ${error.message}`)
  }
}

const callInitiate = async ({ callData }) => {
  try {
    const results = []
    for (const data of callData) {
      try {
        const response = await optimus.initiateOutboundCall(data)
        results.push({ success: true, data: response })
      } catch (error) {
        results.push({ success: false, error: error.message })
        console.error(`Failed to initiate call for ${JSON.stringify(data)}: ${error.message}`)
      }
    }

    return results
  } catch (error) {
    throw new Error(`Failed to process callData: ${error.message}`)
  }
}

module.exports = {
  uploadToAWS,
  fetchAndUploadRecording,
  callInitiate
}
