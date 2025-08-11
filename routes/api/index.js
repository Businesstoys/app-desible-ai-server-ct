const router = require('express').Router()

router.use('/user', require('./users'))
router.use('/call', require('./calls'))
router.use('/static', require('./statics'))
router.use('/template', require('./templates'))
router.use('/chart', require('./charts'))
router.use('/', require('./files'))

module.exports = router
