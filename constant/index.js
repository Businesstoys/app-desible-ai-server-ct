const VOICE_AGENT = {
  Steffan: 'en-US-SteffanNeural',
  Aria: 'en-US-AriaNeural',
  Guy: 'en-US-GuyNeural',
  Jenny: 'en-US-JennyNeural',
  Davis: 'en-US-DavisNeural',
  Elizabeth: 'en-US-ElizabethNeural',
  Jason: 'en-US-JasonNeural',
  Ashley: 'en-US-AshleyNeural',
  Michelle: 'en-US-MichelleNeural',
  Cora: 'en-US-CoraNeural',
  Tony: 'en-US-TonyNeural',
  Nancy: 'en-US-NancyNeural',
  Christopher: 'en-US-ChristopherNeural',
  Jacob: 'en-US-JacobNeural',
  Roger: 'en-US-RogerNeural'
}

const GENDER_SALUTATION = {
  Male: 'Sir',
  Female: 'Maam'
}

const CALL_STATUSES = {
  ONGOING: ['initiate', 'ringing', 'in-progress'],
  QUEUED: ['queued'],
  COMPLETED: 'completed',
  FAILD_CALL: ['busy', 'not-reachable', 'no-answer', 'failed', 'cancelled', 'hang-up']
}

const MAX_CALL_ATTEMPTS = 12

module.exports = {
  VOICE_AGENT,
  GENDER_SALUTATION,
  CALL_STATUSES,
  MAX_CALL_ATTEMPTS
}
