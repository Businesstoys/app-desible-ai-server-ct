/* eslint-disable no-return-assign */
const { aws } = require('@/services')
const { AsyncWrapper, AppError } = require('@/utils')
const { default: axios } = require('axios')

const getRecording = async ({ params, headers }, res, next) => {
  const { file } = params || {}
  if (!file) return next(new AppError('File parameter is required', 400))

  const range = headers?.range

  try {
    const remoteUrl = `${process.env.OPTIMUS_API_BASE_URL}/fetch-recording/${file}`

    const getExtension = (contentType) => {
      if (contentType.includes('mpeg')) return '.mp3'
      if (contentType.includes('wav')) return '.wav'
      return ''
    }

    if (!range) {
      const response = await axios({
        method: 'get',
        url: remoteUrl,
        responseType: 'stream'
      })

      const contentType = response.headers['content-type'] || 'audio/mpeg'
      const contentLength = response.headers['content-length']
      const extension = getExtension(contentType)

      const headersObj = {
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Content-Disposition': `inline; filename="${file}${extension}"`,
        'Cache-Control': 'no-cache'
      }

      if (contentLength) {
        headersObj['Content-Length'] = contentLength
      }

      res.writeHead(200, headersObj)

      response.data.pipe(res)

      response.data.on('error', (error) => {
        console.error('Stream error:', error)
        next(new AppError('Error streaming file', 500))
      })

      res.on('close', () => {
        if (response.data) {
          response.data.destroy()
        }
      })

      return
    }

    // Handle Range header
    const match = range.match(/^bytes=(\d*)-(\d*)$/)
    if (!match) return next(new AppError('Invalid Range header format', 416))

    const [, startStr, endStr] = match
    const start = parseInt(startStr, 10) || 0

    let fileSize
    try {
      const headRes = await axios({ method: 'head', url: remoteUrl })
      fileSize = parseInt(headRes.headers['content-length'], 10)
    } catch {
      const fullRes = await axios({ method: 'get', url: remoteUrl, responseType: 'stream' })
      fileSize = 0
      fullRes.data.on('data', chunk => fileSize += chunk.length)
      await new Promise((resolve, reject) => {
        fullRes.data.on('end', resolve)
        fullRes.data.on('error', reject)
      })
    }

    if (start >= fileSize) return next(new AppError('Range not satisfiable', 416))

    let end = endStr ? parseInt(endStr, 10) : fileSize - 1
    if (isNaN(end)) return next(new AppError('Invalid end in Range header', 416))
    end = Math.min(end, fileSize - 1)
    if (start > end) return next(new AppError('Invalid range: start exceeds end', 416))

    const response = await axios({
      method: 'get',
      url: remoteUrl,
      headers: {
        Range: `bytes=${start}-${end}`
      },
      responseType: 'stream'
    })

    const contentType = response.headers['content-type'] || 'audio/mpeg'
    const extension = getExtension(contentType)

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${file}${extension}"`,
      'Cache-Control': 'no-cache'
    })

    response.data.pipe(res)

    response.data.on('error', (error) => {
      console.error('Stream error:', error)
      next(new AppError('Error streaming file', 500))
    })

    res.on('close', () => {
      if (response.data) {
        response.data.destroy()
      }
    })
  } catch (error) {
    console.error('Error fetching file:', error)
    if (error.response?.status === 404) {
      return next(new AppError('File not found', 404))
    }
    next(new AppError('Error fetching file', 500))
  }
}

const getTemplateRecording = async ({ params, headers }, res, next) => {
  const { template, voice } = params || {}
  const s3Key = `template/${template}/${voice}.mp3`

  const headCommand = await aws.s3.getObjectHead({
    Bucket: process.env.BUCKET_NAME_OPTIMUS,
    Key: s3Key
  })

  if (!headCommand) {
    return next(new AppError('File not found', 404))
  }

  const fileSize = headCommand.ContentLength
  const contentType = headCommand.ContentType || 'application/octet-stream'

  const range = headers?.range

  if (!range) {
    const audioStream = await aws.s3.getFileFromS3AsStream({
      Bucket: process.env.BUCKET_NAME_OPTIMUS,
      Key: s3Key
    })

    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache'
    })

    audioStream.pipe(res)

    audioStream.on('error', (error) => {
      console.error('Stream error:', error)
      next(new AppError('Error streaming file', 500))
    })

    res.on('close', () => {
      if (audioStream) {
        audioStream.destroy()
      }
    })

    return
  }

  const match = range.match(/^bytes=(\d*)-(\d*)$/)
  if (!match) {
    return next(new AppError('Invalid Range header format', 416))
  }

  const [, startStr, endStr] = match
  const start = parseInt(startStr, 10) || 0

  if (start >= fileSize) {
    return next(new AppError('Range not satisfiable', 416))
  }

  let end
  if (endStr) {
    end = parseInt(endStr, 10)
    if (isNaN(end)) {
      return next(new AppError('Invalid end in Range header', 416))
    }
  } else {
    end = fileSize - 1
  }

  end = Math.min(end, fileSize - 1)

  if (start > end) {
    return next(new AppError('Invalid range: start exceeds end', 416))
  }

  const audioStream = await aws.s3.getFileFromS3AsStream({
    Bucket: process.env.BUCKET_NAME_OPTIMUS,
    Key: s3Key,
    Range: `bytes=${start}-${end}`
  })

  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': end - start + 1,
    'Content-Type': contentType,
    'Cache-Control': 'no-cache'
  })

  audioStream.pipe(res)

  audioStream.on('error', (error) => {
    console.error('Stream error:', error)
    next(new AppError('Error streaming file', 500))
  })

  res.on('close', () => {
    if (audioStream) {
      audioStream.destroy()
    }
  })
}

module.exports = AsyncWrapper({
  getRecording,
  getTemplateRecording
})
