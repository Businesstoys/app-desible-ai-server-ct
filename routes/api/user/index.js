const router = require('express').Router()

const { user } = require('@/controller')
const { validator } = require('@/middleware')
const { user: usersValidation } = require('@/validations')

router.post('/login',
  validator.validate(usersValidation.login),
  user.login)

router.post('/signup', user.create)

module.exports = router
