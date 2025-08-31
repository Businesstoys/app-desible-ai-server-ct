const router = require('express').Router()

router.use('/user', require('./user'))
router.use('/call', require('./call'))
router.use('/static', require('./static'))
router.use('/chart', require('./chart'))
router.use('/', require('./file'))

module.exports = router
