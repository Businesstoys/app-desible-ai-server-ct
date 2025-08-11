const router = require('express').Router()
const { files } = require('@/controller')
const { validator } = require('@/middleware')

const { files: filesValidaiton } = require('@/validations')

router.get('/recording/:file', files.getRecording)
router.get('/template/:template/:voice',
  validator.validate(filesValidaiton.voice),
  files.getTemplateRecording)

module.exports = router
