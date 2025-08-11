const { Templates } = require('@/models')
const { db, aws } = require('@/services')
const { AsyncWrapper, AppError } = require('@/utils')

const create = async ({ body }, res, next) => {
  const template = await db.create(Templates, body)

  res.status(201).json({
    status: 'success',
    data: template
  })
}

const uploadVoice = async ({ query, files }, res, next) => {
  const { templateId, voiceId } = query
  const file = files?.file

  if (!file || !file.mimetype.includes('audio/mpeg')) {
    return next(new AppError('Missing or invalid .mp3 file', 400))
  }
  const template = await db.findOne(
    Templates,
    { _id: templateId },
    { select: '-createdOn -updatedOn -__v' }
  )

  if (!template) return next(new AppError('Template not found', 404))

  await aws.s3.uploadToS3({
    Bucket: process.env.BUCKET_NAME_OPTIMUS,
    file: file.data,
    Key: `template/${templateId}/${voiceId}.mp3`,
    ContentType: file.mimetype
  })

  const updatedVoices = template.voices.map((voice) => {
    if (voice._id.toString() === voiceId) {
      return {
        ...voice,
        url: `http://localhost:8800/api/v1/template/${templateId}/${voiceId}`
      }
    }
    return voice
  })

  template.voices = updatedVoices
  await template.save()

  res.status(200).json({
    status: 'success',
    data: template
  })
}

const list = async (_, res, next) => {
  try {
    const templates = await db.find(Templates, {}, {
      select: '-createdOn -updatedOn -__v',
      sort: { name: 1 }
    })

    res.status(200).json({
      status: 'success',
      data: templates
    })
  } catch (err) {
    next(err)
  }
}

module.exports = AsyncWrapper({
  create,
  uploadVoice,
  list
})
