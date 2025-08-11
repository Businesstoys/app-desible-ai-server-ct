/**
 * Maps Plivo hangup codes to call statuses
 * @param {string|number} hangupCode - The hangup code from Plivo
 * @returns {string} The mapped call status
 */
module.exports = (hangupCode) => {
  // Convert hangupCode to string for comparison
  const code = String(hangupCode)

  // Map specific hangup codes to call statuses
  switch (code) {
    // Cancelled cases
    case '1000': // Canceled
    case '1010': // Canceled (Out Of Credits)
    case '1020': // Canceled (Simultaneous dial limit reached)
      return 'cancelled'

      // Failed cases
    case '2000': // Invalid Destination Address
    case '2010': // Destination Out Of Service
    case '2020': // Endpoint Not Registered
    case '2030': // Destination Country Barred
    case '2040': // Destination Number Barred
    case '2060': // Loop Detected
    case '2070': // Violates Media Anchoring
    case '5000': // Network Error
    case '5010': // Internal Error
    case '5020': // Routing Error
    case '7011': // Error Reaching Answer URL
    case '7012': // Error Reaching Action URL
    case '7013': // Error Reaching Transfer URL
    case '7014': // Error Reaching Redirect URL
    case '8011': // Invalid Answer XML
    case '8012': // Invalid Action XML
    case '8013': // Invalid Transfer XML
    case '8014': // Invalid Redirect XML
      return 'failed'

      // No Answer cases
    case '3000': // No Answer
    case '6010': // Ring Timeout Reached
      return 'no-answer'

      // Busy cases
    case '3010': // Busy Line
    case '3100': // Busy everywhere
      return 'busy'

      // Not Reachable cases
    case '3020': // Rejected
    case '3030': // Unknown Caller ID
    case '3040': // Forbidden
    case '3050': // Unallocated number
    case '3070': // Request timeout
    case '3080': // Internal server error from carrier
    case '3090': // Network congestion from carrier
    case '3110': // Declined
    case '3120': // User does not exist anywhere
    case '3130': // Spam block
    case '3140': // DNO Caller ID
      return 'not-reachable'

      // Completed cases
    case '4000': // Normal Hangup
    case '4010': // End Of XML Instructions
    case '4020': // Multiparty Call Ended
    case '4030': // Kicked Out Of Multiparty Call
    case '6000': // Scheduled Hangup
    case '6020': // Media Timeout
    case '9000': // Lost Race
    case '9100': // Machine Detected
    case '9110': // Confirm Key Challenge Failed
      return 'completed'

      // Default case for unknown codes
    case '0': // Unknown
    default:
      return 'failed'
  }
}

// Example usage:
// const status = mapHangupCodeToCallStatus('3010'); // Returns 'busy'
// const status = mapHangupCodeToCallStatus('4000'); // Returns 'completed'
