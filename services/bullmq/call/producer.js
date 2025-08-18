const { DEFAULT_PRIORITY } = require('@/constant')
const queue = require('./queue')

const addJobToQueue = async ({ jobId, data, priority = DEFAULT_PRIORITY }) => {
  try {
    const job = await queue.add(jobId, data, {
      lifo: false,
      attempts: 1,
      jobId: jobId.toString(),
      removeOnComplete: true,
      removeOnFail: true,
      priority
    })
    return job
  } catch (error) {
    throw new Error(error)
  }
}

const getJobsList = async (config = {}) => {
  const { status = ['active', 'waiting'] } = config
  const _queue = queue.getJobs(status)
  return _queue
}

const findAndRemoveJob = async ({ jobId }) => {
  try {
    const jobList = await getJobsList()
    const job = (await jobList).find((job) => job.data._id === jobId)
    if (job) {
      await job.remove()
      return true
    }
    return false
  } catch (error) {
    return false
  }
}

module.exports = { addJobToQueue, getJobsList, findAndRemoveJob }
