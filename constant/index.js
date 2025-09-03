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
  }
}

const DEFAULT_PRIORITY = 10

module.exports = {
  CALL_STATUSES,
  DEFAULT_PRIORITY
}
