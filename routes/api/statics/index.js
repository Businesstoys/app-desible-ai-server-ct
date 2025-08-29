const { statics } = require('@/controller')
const { auth, validator } = require('@/middleware')
const { statics: staticsValidation } = require('@/validations')
const router = require('express').Router()

router.use(auth.protect)

router.get('/queue/status', statics.getQueueStatus)
router.post('/queue/stop', statics.stopQueue)
router.post('/queue/start', statics.startQueue)
router.get('/statics-config', statics.availableStatics)
router.post('/config', validator.validate(staticsValidation.config), statics.config)

module.exports = router
