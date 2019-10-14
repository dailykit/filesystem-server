const mongoose = require('mongoose')
const path = require('path')

const fileSchema = require('../models/File')

const { getAppName, getRepoName } = require('../utils/parsePath')

const connectToDB = dbName => {
	return new Promise((resolve, reject) => {
		return mongoose
			.connect(`mongodb://localhost:27017/${dbName}`, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
				useFindAndModify: false,
				useCreateIndex: true,
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
				const query = {
					path: givenPath,
				}
				Model.findOne(query, (error, file) => {
					if (error) return reject(new Error(error))

					// Delete file doc using Id
					return Model.findByIdAndDelete(file.id, error => {
						if (error) return reject(new Error(error))
						return resolve(
							`File ${path.basename(givenPath)} has been deleted!`
						)
					})
				})
			})
			.catch(error => reject(new Error(error)))
	})
}

const updateDoc = fields => {
	return new Promise((resolve, reject) => {
		// Connect to database
		const dbName = getAppName(fields.path)
		return connectToDB(dbName)
			.then(() => {
				const repoName = getRepoName(fields.path)

				// Create Model
				const Model = mongoose.model(repoName, fileSchema)

				// Find file doc by path
				const query = {
					path: fields.path,
				}
				Model.findOne(query, (error, file) => {
					if (error) return reject(new Error(error))
					const data = {
						...(fields.newPath && {
							name: path.basename(fields.newPath),
						}),
						...(fields.path && {
							path: fields.newPath ? fields.newPath : fields.path,
						}),
						...(fields.commit && {
							commits: [fields.commit, ...file.commits],
						}),
						updatedAt: Date.now(),
					}
					return Model.findByIdAndUpdate(
						file.id,
						{ $set: data },
						{ new: true },
						error => {
							if (error) return reject(new Error(error))
							return resolve(
								`File ${path.basename(
									fields.newPath
										? fields.newPath
										: fields.path
								)} has been updated!`
							)
						}
					)
				})
			})
			.catch(error => reject(new Error(error)))
	})
}

const readDoc = path => {
	return new Promise((resolve, reject) => {
		// Connect to database
		const dbName = getAppName(path)
		return connectToDB(dbName)
			.then(() => {
				const repoName = getRepoName(path)

				// Create Model
				const Model = mongoose.model(repoName, fileSchema)

				// Find file doc by path
				const query = {
					path: path,
				}
				Model.findOne(query, (error, file) => {
					if (error) return reject(new Error(error))
					return resolve(file)
				})
			})
			.catch(error => reject(new Error(error)))
	})
}

module.exports = {
	createDoc,
	deleteDoc,
	updateDoc,
	readDoc,
}
