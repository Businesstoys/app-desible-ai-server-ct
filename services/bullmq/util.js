const { ActivitiesTasks } = require('@/models')
const { db } = require('..')
const CONSTANTS = require('@/lib/constants')
const TASK_NAMES = require('@/controller/activities/taskNames')

const reviewsProducer = require('./reviews/producer')
const submissionProducer = require('./submission/producer')
const marginCalculatorProducer = require('./marginCalculator/producer')
const jobScoreProducer = require('./jobScore/producer')
const dataMappingProducer = require('./dataMapping/producer')
const competitorJobsProducer = require('./competitorJobs/producer')
const simulatedJobsProducer = require('./call/producer')

const nextTaskDecider = async ({
  activity,
  task,
  job,
  priority = CONSTANTS.DEFAULT_PRIORITY
}) => {
  try {
    const newTask = await db.findOneAndUpdate(
      ActivitiesTasks,
      { activity: activity._id, order: task.order + 1 },
      { data: { job: job._id } },
      { lean: true }
    )

    if (!newTask) return null
    if (newTask.status === 'processing') return null

    if (newTask?.title === TASK_NAMES.FETCH_ENTITY_REVIEWS) {
      await reviewsProducer.addJobToQueue({
        jobId: newTask._id,
        data: {
          _id: newTask._id,
          job: job._id,
          activity: activity._id,
          task: newTask._id,
          priority
        },
        priority
      })
    }

    if (newTask?.title === TASK_NAMES.FETCH_SUBMISSION_STATUS) {
      await submissionProducer.addJobToQueue({
        jobId: newTask._id,
        data: {
          _id: newTask._id,
          job: job._id,
          activity: activity._id,
          task: newTask._id,
          priority
        },
        priority
      })
    }

    if (newTask?.title === TASK_NAMES.MARGIN_CALCULATOR) {
      await marginCalculatorProducer.addJobToQueue({
        jobId: newTask._id,
        data: {
          _id: newTask._id,
          job: job._id,
          activity: activity._id,
          task: newTask._id,
          priority
        },
        priority
      })
    }

    if (newTask?.title === TASK_NAMES.CALCULATE_JOB_SCORE) {
      await jobScoreProducer.addJobToQueue({
        jobId: newTask._id,
        data: {
          _id: newTask._id,
          job: job._id,
          activity: activity._id,
          task: newTask._id,
          priority
        },
        priority
      })
    }

    if (newTask?.title === TASK_NAMES.FETCH_COMPETITOR_JOBS) {
      await competitorJobsProducer.addJobToQueue({
        jobId: newTask._id,
        data: {
          _id: newTask._id,
          job: job._id,
          activity: activity._id,
          task: newTask._id,
          priority
        },
        priority
      })
    }

    if (newTask?.title === TASK_NAMES.DATA_NORMALIZATION) {
      await dataMappingProducer.addJobToQueue({
        jobId: newTask._id,
        data: {
          _id: newTask._id,
          job: job._id,
          activity: activity._id,
          task: newTask._id,
          priority
        },
        priority
      })
    }

    if (newTask?.title === TASK_NAMES.SIMULATED_JOBS) {
      await simulatedJobsProducer.addJobToQueue({
        jobId: newTask._id,
        data: {
          _id: newTask._id,
          job: job._id,
          activity: activity._id,
          task: newTask._id,
          priority
        },
        priority
      })
    }
  } catch (error) {
    console.error({ error })
    throw new Error(error)
  }
}

module.exports = {
  nextTaskDecider
}
