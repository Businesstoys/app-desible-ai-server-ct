const { statics } = require('@/controller')
const { auth } = require('@/middleware')

const router = require('express').Router()

router.use(auth.protect)

router.get('/queue/status', statics.getQueueStatus)
router.post('/queue/stop', statics.stopQueue)
router.post('/queue/start', statics.startQueue)
router.get('/statics-config', statics.availableStatics)
router.post('/config', statics.config)

module.exports = router
