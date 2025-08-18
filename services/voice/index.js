const axios = require('axios')

const API_BASE_URL = process.env.VOICE_API_BASE_URL
const API_KEY = process.env.OPTIMUS_API_KEY || ''

async function initiateOutboundCall ({ payload }) {
  const endpoint = 'start_outbound_call_idream_hindi'

  const url = `${API_BASE_URL}/${endpoint}`

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY
  }

  try {
    const response = await axios.post(url, payload, { headers })
    return response
  } catch (error) {
    console.log({ error })
    console.error('API Call Failed:', error.response ? error.response.data : error.message)
    return error?.response
  }
}

async function getTranscription (transcriptionId) {
  const url = `${API_BASE_URL}/fetch_transcription/${transcriptionId}`

  const headers = {
    'Content-Type': 'text/plain',
    'x-api-key': API_KEY
  }

  try {
    const response = await axios.get(url, { headers })
    return response
  } catch (error) {
    console.error('API Call Failed:', error.response ? error.response.data : error.message)
    throw new Error(`API Call Failed: ${error.message}`)
  }
}

async function getCallDetails (callSid) {
  const url = `${API_BASE_URL}/fetch_call_details/${callSid}`

  const headers = {
    'Content-Type': 'text/json',
    'x-api-key': API_KEY
  }

  try {
    const response = await axios.get(url, { headers })
    return response?.data
  } catch (error) {
    return error
  }
}

async function getLiveStatus (callId) {
  const url = `${API_BASE_URL}/fetch_live_call_status/${callId}`

  const headers = {
    'Content-Type': 'text/plain',
    'x-api-key': API_KEY
  }

  try {
    const response = await axios.get(url, { headers })
    return response.data
  } catch (error) {
    console.error('API Call Failed:', error.response ? error.response.data : error.message)
    throw new Error(`API Call Failed: ${error.message}`)
  }
}

async function getCallSummary (payload) {
  const url = `${API_BASE_URL}/get_summary_idreamcareer`

  const headers = {
    'Content-Type': 'text/json',
    'x-api-key': API_KEY
  }

  try {
    const response = await axios.post(url, payload, { headers })
    return response?.data
  } catch (error) {
    console.error('API Summary Failed:', error.response ? error.response.data : error.message)
    throw new Error(`API Summary Failed: ${error.message}`)
  }
}

async function hangUpCall (payload) {
  const url = `${API_BASE_URL}/hangup_call`

  const headers = {
    'Content-Type': 'text/json',
    'x-api-key': API_KEY
  }

  try {
    const response = await axios.post(url, payload, { headers })
    return response?.data
  } catch (error) {
    console.error('API Hang Up Failed :', error.response ? error.response.data : error.message)
    throw new Error(`API Hang Up Failed: ${error.message}`)
  }
}

module.exports = {
  initiateOutboundCall,
  getTranscription,
  getLiveStatus,
  getCallDetails,
  getCallSummary,
  hangUpCall
}
