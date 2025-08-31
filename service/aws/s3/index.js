const { S3Client, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3')
const { Upload } = require('@aws-sdk/lib-storage')

const S3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  },
  region: 'us-east-1'
})

const uploadToS3 = ({
  Bucket,
  file,
  Key,
  ContentType
}) =>
  new Promise((resolve, reject) => {
    new Upload({
      client: S3,
      params: {
        Bucket,
        Key,
        ContentType,
        Body: file
      }
    })
      .done()
      .then((data) => {
        resolve(data)
      })
      .catch((err) => {
        reject(err)
      })
  })

const getFileFromS3 = ({
  Bucket,
  Key
}) => new Promise((resolve, reject) => {
  const command = new GetObjectCommand({
    Bucket,
    Key
  })
  S3.send(command)
    .then(response => {
      const stream = response.Body
      const ContentType = response.ContentType
      const chunks = []
      stream.on('data', chunk => chunks.push(chunk))
      stream.once('end', () => resolve({ data: Buffer.concat(chunks), ContentType }))
      stream.once('error', (err) => reject(err))
    })
    .catch(error => {
      reject(error)
    })
})

const getFileFromS3AsStream = ({ Bucket, Key }) => {
  const command = new GetObjectCommand({
    Bucket,
    Key
  })
  return S3.send(command)
    .then(response => {
      if (!response.Body) {
        throw new Error('No data stream available from S3')
      }
      return response.Body
    })
    .catch(error => {
      console.log({ error })
      throw error
    })
}

const getObjectHead = ({ Bucket, Key }) => {
  return new Promise((resolve, reject) => {
    const command = new HeadObjectCommand({
      Bucket,
      Key
    })

    S3.send(command)
      .then(response => {
        resolve({
          ContentLength: response.ContentLength,
          ContentType: response.ContentType,
          LastModified: response.LastModified,
          ETag: response.ETag,
          Metadata: response.Metadata
        })
      })
      .catch(error => {
        if (error.name === 'NotFound') {
          reject(new Error('File not found in S3'))
        } else if (error.name === 'NoSuchKey') {
          reject(new Error('Invalid S3 key provided'))
        } else {
          reject(error)
        }
      })
  })
}

module.exports = {
  uploadToS3,
  getFileFromS3,
  getFileFromS3AsStream,
  getObjectHead
}
