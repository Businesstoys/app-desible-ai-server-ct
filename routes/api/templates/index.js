const router = require('express').Router()
const { validator } = require('@/middleware')

const { templates } = require('@/controller')
const { templates: templateValidations } = require('@/validations')

router.post('/upload-voice',
  validator.validate(templateValidations.uploadVoice),
  templates.uploadVoice)

router.post('/create',
  validator.validate(templateValidations.createTemplate),
  templates.create)

router.get('/list', templates.list)

module.exports = router
