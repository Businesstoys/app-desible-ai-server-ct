const CALL_STATUSES = {
  ONGOING: {
    INITIATE: 'initiate',
    RINGING: 'ringing',
    IN_PROGRESS: 'in-progress'
  },
  QUEUED: {
    QUEUED: 'queued'
  },
  COMPLETED: {
    COMPLETED: 'completed'
  },
  FAILED_CALL: {
    BUSY: 'busy',
    NOT_REACHABLE: 'not-reachable',
    NO_ANSWER: 'no-answer',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    HANG_UP: 'hang-up'
  },
  FAILED_LIST: ['completed', 'busy', 'not-reachable', 'no-answer', 'failed', 'cancelled'],
  SCHEDULE: 'schedule'
}

const DEFAULT_PRIORITY = 10
const MAX_CALL_ATTEMPT = 4

module.exports = {
  CALL_STATUSES,
  DEFAULT_PRIORITY,
  MAX_CALL_ATTEMPT
}
