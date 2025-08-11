const router = require('express').Router()

const { users } = require('@/controller')
const { validator } = require('@/middleware')
const { users: usersValidation } = require('@/validations')

router.post('/login',
  validator.validate(usersValidation.login),
  users.login)

router.post('/signup', users.create)

module.exports = router
