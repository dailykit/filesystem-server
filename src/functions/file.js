const fs = require('fs')
const path = require('path')
const getFilesRecursively = require('recursive-readdir')

const git = require('isomorphic-git')
git.plugins.set('fs', fs)

const database = require('./database')

const { getRelFilePath, repoDir } = require('../utils/parsePath')
const { stageChanges } = require('./git')

const createFile = ({ path: givenPath, content }) => {
	return new Promise((resolve, reject) => {
		// Check if folder exists
		if (!fs.existsSync(path.dirname(givenPath))) {
			fs.mkdirSync(path.dirname(givenPath), { recursive: true })
		}

		// Create the file
		fs.writeFileSync(givenPath, JSON.stringify(content, null, 2))

		// Stage the file
		stageChanges('add', repoDir(givenPath), getRelFilePath(givenPath))
			.then(result => console.log(result))
			.catch(error => reject(new Error(error)))

		// Commit the file
		return git
			.commit({
				dir: repoDir(givenPath),
				author: {
					name: 'placeholder',
					email: 'placeholder@example.com',
				},
				commiter: {
					name: 'placeholder',
					email: 'placeholder@example.com',
				},
				message: `Added: ${path.basename(givenPath)}`,
			})
			.then(sha => {
				const fields = {
					name: path.basename(givenPath),
					path: givenPath,
					commits: [sha],
				}

				// Add the file to db document
				return database
					.createDoc(fields)
					.then(() => resolve(`Added: ${path.basename(givenPath)}`))
					.catch(error => reject(new Error(error)))
			})
			.catch(error => reject(new Error(error)))
	})
}

const deleteFile = givenPath => {
	return new Promise((resolve, reject) => {
		// Delete the file
		fs.unlink(givenPath, err => {
			if (err) return reject(new Error(err))
			// Remove the file from the git index
			stageChanges(
				'remove',
				repoDir(givenPath),
				getRelFilePath(givenPath)
			).catch(error => reject(new Error(error)))

			// Commit the deleted file
			return git
				.commit({
					dir: repoDir(givenPath),
					author: {
						name: 'placeholder',
						email: 'placeholder@example.com',
					},
					commiter: {
						name: 'placeholder',
						email: 'placeholder@example.com',
					},
					message: `Deleted: ${path.basename(givenPath)}`,
				})
				.then(() =>
					database
						.deleteDoc(givenPath)
						.then(() =>
							resolve(`Deleted: ${path.basename(givenPath)}`)
						)
						.catch(error => reject(new Error(error)))
				)
		})
	})
}

const getFile = givenPath => {
	return new Promise((resolve, reject) => {
		const stats = fs.statSync(givenPath)
		const parse = path.parse(givenPath)
		fs.readFile(givenPath, (err, data) => {
			if (err) reject(err)
			resolve({
				name: parse.name,
				path: givenPath,
				size: stats.size,
				createdAt: stats.birthtime,
				type: 'file',
				content: data.toString(),
			})
		})
	})
}

const searchFiles = async fileName => {
	function ignoreFunc(file) {
		return path.basename(file) === '.git'
	}
	return new Promise((resolve, reject) => {
		getFilesRecursively('./../apps', [ignoreFunc], (err, files) => {
			if (err) return reject(new Error(err))
			const formatted = files
				.map(file => `./${file.split('\\').join('/')}`)
				.filter(file =>
					path
						.basename(file)
						.toLowerCase()
						.includes(fileName.toLowerCase())
				)
			const result = {
				menus: [],
				packages: [],
				ingredients: [],
				recipes: [],
				dishes: [],
			}
			formatted.map(file => {
				const type = file.split('/')[2].toLowerCase()
				switch (type) {
					case 'dishes':
						return result.dishes.push(file)
					case 'packages':
						return result.packages.push(file)
					case 'recipes':
						return result.recipes.push(file)
					case 'ingredients':
						return result.ingredients.push(file)
					case 'menus':
						return result.menus.push(file)
					default:
						break
				}
			})
			return resolve(result)
		})
	})
}

const updateFile = async args => {
	const { path: givenPath, data, commitMessage, validatedFor } = args
	return new Promise((resolve, reject) => {
		fs.writeFile(givenPath, data, async err => {
			if (err) return reject(new Error(err))

			// Add the updated file to staging
			await stageChanges(
				'add',
				repoDir(givenPath),
				getRelFilePath(givenPath)
			).catch(error => reject(new Error(error)))

			// Commit the staged files
			return git
				.commit({
					dir: repoDir(givenPath),
					author: {
						name: 'placeholder',
						email: 'placeholder@example.com',
					},
					commiter: {
						name: 'placeholder',
						email: 'placeholder@example.com',
					},
					message: commitMessage,
				})
				.then(sha =>
					database
						.updateDoc({ commit: sha, path: givenPath })
						.then(() =>
							resolve(`Updated: ${path.basename(givenPath)} file`)
						)
						.catch(error => reject(new Error(error)))
				)
		})
	})
}

const renameFile = async (oldPath, newPath) => {
	return new Promise((resolve, reject) => {
		// Check if newPath file exists
		if (oldPath === newPath) {
			return resolve("New name can't be the same old name!")
		} else if (fs.existsSync(newPath)) {
			return resolve('File already exists!')
		}

		// Rename File
		fs.rename(oldPath, newPath, async err => {
			if (err) return reject(new Error(err))

			// Remove the old file from git index
			stageChanges(
				'remove',
				repoDir(oldPath),
				getRelFilePath(oldPath)
			).catch(error => reject(new Error(error)))

			// Add the renamed file to staging
			stageChanges(
				'add',
				repoDir(oldPath),
				getRelFilePath(newPath)
			).catch(error => reject(new Error(error)))

			// Commit the staged files
			return git
				.commit({
					dir: repoDir(oldPath),
					author: {
						name: 'placeholder',
						email: 'placeholder@example.com',
					},
					commiter: {
						name: 'placeholder',
						email: 'placeholder@example.com',
					},
					message: `Renamed: ${path.basename(
						oldPath
					)} file to ${path.basename(newPath)}`,
				})
				.then(sha =>
					database
						.updateDoc({ commit: sha, path: oldPath, newPath })
						.then(() =>
							resolve(
								`Renamed: ${path.basename(
									oldPath
								)} file to ${path.basename(newPath)}`
							)
						)
						.catch(error => reject(new Error(error)))
				)
		})
	})
}

module.exports = {
	createFile,
	deleteFile,
	getFile,
	updateFile,
	renameFile,
	searchFiles,
}
