const mongoose = require('mongoose')

let MONGO_URI = process.env.MONGO_URI
MONGO_URI = MONGO_URI.replace('<password>', process.env.MONGO_PWD)

const init = () => new Promise((resolve, reject) => {
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('DB connected')
      resolve('DB connected')
    })
    .catch((err) => {
      console.log({ err })
      console.log('DB connection error')
      reject(new Error('DB connection error'))
    })
})

const create = (Model, data) => new Promise((resolve, reject) => {
  Model.create(data)
    .then(response => resolve(response))
    .catch(error => reject(error))
})

const find = (Model, query, options = {}) => new Promise((resolve, reject) => {
  const {
    populate = false,
    select = false,
    sort = false,
    lean = false,
    limit = false,
    count = false,
    skip = 0
  } = options

  let queryBuilder

  if (count) {
    queryBuilder = Model.countDocuments(query)
  } else {
    queryBuilder = Model.find(query)

    if (populate) {
      queryBuilder = queryBuilder.populate(populate)
    }

    if (select) {
      queryBuilder = queryBuilder.select(select)
    }

    if (sort) {
      queryBuilder = queryBuilder.sort(sort)
    }
    queryBuilder = queryBuilder.skip(skip)

    if (limit) {
      queryBuilder = queryBuilder.limit(limit)
    }

    if (lean) {
      queryBuilder = queryBuilder.lean()
    }
  }

  queryBuilder
    .exec()
    .then(response => resolve(response))
    .catch(error => reject(error))
})

const findOne = (Model, query, options = {}) => new Promise((resolve, reject) => {
  const { populate = false, select = false } = options

  let queryBuilder = Model.findOne(query)

  if (populate) {
    queryBuilder = queryBuilder.populate(populate)
  }

  if (select) {
    queryBuilder = queryBuilder.select(select)
  }

  queryBuilder
    .exec()
    .then(response => resolve(response))
    .catch(error => reject(error))
})

const findOneAndUpdate = (Model, query, data, options = {}) =>
  new Promise((resolve, reject) => {
    const {
      populate = false,
      create = false,
      select = false,
      lean = false
    } = options
    let queryBuilder = Model.findOneAndUpdate(query, data, { new: true })

    if (populate) {
      queryBuilder = queryBuilder.populate(populate)
    }

    if (select) {
      queryBuilder = queryBuilder.select(select)
    }

    if (create) {
      queryBuilder = queryBuilder.setOptions({
        upsert: true,
        setDefaultsOnInsert: true
      })
    }

    if (lean) {
      queryBuilder = queryBuilder.lean()
    }

    queryBuilder
      .exec()
      .then((response) => resolve(response))
      .catch((error) => reject(error))
  })

const aggregate = (Model, query) => new Promise((resolve, reject) => {
  Model.aggregate(query)
    .then(result => resolve(result))
    .catch(error => reject(error))
})

const updateMany = (Model, query, data, options = {}) => new Promise((resolve, reject) => {
  Model.updateMany(query, data, options)
    .then(response => resolve(response))
    .catch(error => reject(error))
})

const updateOne = (Model, query, data, options = {}) => new Promise((resolve, reject) => {
  Model.updateOne(query, data, options)
    .then(response => resolve(response))
    .catch(error => reject(error))
})

const deleteOne = (Model, query, options = {}) => new Promise((resolve, reject) => {
  Model.deleteOne(query, options)
    .then(response => resolve(response))
    .catch(error => reject(error))
})

module.exports = {
  init,
  create,
  find,
  findOne,
  findOneAndUpdate,
  aggregate,
  updateMany,
  deleteOne,
  updateOne
}
