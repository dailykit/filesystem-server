const mongoose = require('mongoose')
const path = require('path')

const fileSchema = require('../models/File')

const { getAppName, getRepoName } = require('../utils/parsePath')

const connectToDB = dbName => {
	return new Promise((resolve, reject) => {
		return mongoose
			.connect(`mongodb://localhost:27017/${dbName}`, {
				useNewUrlParser: true,
			})
			.then(() => resolve('Connected to MongoDB!'))
			.catch(error => reject(new Error(error)))
	})
}
// Create file document
const createDoc = fields => {
	return new Promise((resolve, reject) => {
		// Connect to database
		const dbName = getAppName(fields.path)
		return connectToDB(dbName).then(() => {
			const repoName = getRepoName(fields.path)
			const Model = mongoose.model(repoName, fileSchema)

			const file = new Model(fields)

			// Save file as document
			return file.save((error, result) => {
				if (error) return reject(new Error(error))
				return resolve(`File ${fields.name} has been saved!`)
			})
		})
	})
}

const deleteDoc = givenPath => {
	return new Promise((resolve, reject) => {
		// Connect to database
		const dbName = getAppName(givenPath)
		return connectToDB(dbName)
			.then(() => {
				const repoName = getRepoName(givenPath)

				// Create Model
				const Model = mongoose.model(repoName, fileSchema)

				// Find file doc by path
				Model.findOne(
					{
						path: givenPath,
					},
					(error, file) => {
						if (error) return reject(new Error(error))

						// Delete file doc using Id
						return Model.findByIdAndDelete(file.id, error => {
							if (error) return reject(new Error(error))
							return resolve(
								`File ${path.basename(
									givenPath
								)} has been deleted!`
							)
						})
					}
				)
			})
			.catch(error => reject(new Error(error)))
	})
}

module.exports = {
	createDoc,
	deleteDoc,
}
