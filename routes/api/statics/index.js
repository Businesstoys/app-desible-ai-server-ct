const { statics } = require('@/controller')
const { auth } = require('@/middleware')

const router = require('express').Router()

router.use(auth.protect)

router.get('/queue/status', statics.getQueueStatus)
router.post('/queue/stop', statics.stopQueue)
router.post('/queue/start', statics.startQueue)

module.exports = router
