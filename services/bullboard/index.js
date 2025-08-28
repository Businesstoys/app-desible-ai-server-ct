/* eslint-disable no-unused-vars */
const { createBullBoard } = require('@bull-board/api')
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter')
const { ExpressAdapter } = require('@bull-board/express')
const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

const {
  call
} = require('../bullmq')

createBullBoard({
  queues: [
    new BullMQAdapter(call.queue)
  ],
  serverAdapter
})

module.exports = serverAdapter
