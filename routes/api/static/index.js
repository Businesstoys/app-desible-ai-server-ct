const { static: staticController } = require('@/controller')
const { auth, validator } = require('@/middleware')
const { static: staticsValidation } = require('@/validations')
const router = require('express').Router()

router.use(auth.protect)

router.get('/queue/status', staticController.getQueueStatus)
router.post('/queue/stop', staticController.stopQueue)
router.post('/queue/start', staticController.startQueue)
router.get('/statics-config', staticController.availableStatics)
router.post('/config', validator.validate(staticsValidation.config), staticController.config)

module.exports = router
