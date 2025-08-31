const router = require('express').Router()
const { file } = require('@/controller')
const { validator } = require('@/middleware')

const { file: filesValidaiton } = require('@/validations')

router.get('/recording/:file', file.getRecording)
router.get('/template/:template/:voice',
  validator.validate(filesValidaiton.voice),
  file.getTemplateRecording)

module.exports = router
