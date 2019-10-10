const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')

const getFilesRecursively = require('recursive-readdir')

const git = require('isomorphic-git')
git.plugins.set('fs', fs)

const files = require('./file')
const getFolderSize = require('../utils/getFolderSize')

const database = require('./database')

const { getRelFilePath, repoDir } = require('../utils/parsePath')
const { stageChanges } = require('./git')

const baseFolder = './../apps/'

const getNestedFolders = async url => {
	let content = await fs.readdirSync(url)
	let folders = content.filter(
		item => fs.statSync(`${url}/${item}`).isDirectory() && item[0] !== '.'
	)
	let nestedData = folders.map(async folder => {
		const stats = fs.statSync(`${url}/${folder}`)
		if (stats.isDirectory()) {
			let node = {}
			node.name = folder
			node.path = `${url}/${folder}`
			node.type = 'folder'
			node.createdAt = stats.birthtime
			const folderSize = await getFolderSize(`${url}/${folder}`)
				.map(file => fs.readFileSync(file))
				.join('\n')
			node.size = folderSize.length
			let children = await getNestedFolders(`${url}/${folder}`)
			node.children = children
			return node
		}
	})
	return Promise.all(nestedData).then(response => response)
}

const getFolderWithFiles = async url => {
	try {
		let data = await fs.readdirSync(url)
		let nestedData = data
			.filter(item => item[0] !== '.')
			.map(async item => {
				const stats = fs.statSync(`${url}/${item}`)
				let node = {}
				node.name = item
				node.path = `${url}/${item}`
				node.createdAt = stats.birthtime
				if (stats.isFile()) {
					const fileData = await files.getFile(`${url}/${item}`)
					node.content = fileData.content
					node.size = stats.size
					node.type = 'file'
				} else if (stats.isDirectory()) {
					let functionResponse = await getFolderWithFiles(
						`${url}/${item}`
					)
					node.children = functionResponse
					node.type = 'folder'
					const folderSize = await getFolderSize(`${url}/${item}`)
						.map(file => fs.readFileSync(file))
						.join('\n')
					node.size = folderSize.length
				}
				return node
			})
		return Promise.all(nestedData).then(result => result)
	} catch (e) {
		console.log(e)
	}
}

const createFolder = givenPath => {
	return new Promise((resolve, reject) => {
		if (fs.existsSync(givenPath)) {
			return reject(`Folder ${path.basename(givenPath)}  already exist!`)
		}
		return fs.mkdir(givenPath, { recursive: true }, error => {
			if (error) return reject(new Error(error))
			return resolve(`Created: ${path.basename(givenPath)} Folder!`)
		})
	})
}

const deleteFolder = givenPath => {
	return new Promise(async (resolve, reject) => {
		// Get all file paths from the folder
		const allFilePaths = await getPathsOfAllFilesInFolder(givenPath).then(
			files => files
		)

		// Delete the folder
		rimraf(givenPath, error => {
			if (error) return reject(new Error(error))
			for (let file of allFilePaths) {
				// Remove files from git index
				stageChanges(
					'remove',
					repoDir(givenPath),
					getRelFilePath(file)
				).catch(error => reject(new Error(error)))

				// Commit the deleted files
				git.commit({
					dir: repoDir(givenPath),
					author: {
						name: 'placeholder',
						email: 'placeholder@example.com',
					},
					commiter: {
						name: 'placeholder',
						email: 'placeholder@example.com',
					},
					message: `Deleted: File ${path.basename(file)}`,
				}).then(sha =>
					database
						.deleteDoc(file)
						.catch(error => reject(new Error(error)))
				)
			}
			resolve(`Deleted : ${path.basename(givenPath)} folder`)
		})
	})
}

const renameFolder = (oldPath, newPath) => {
	return new Promise(async (resolve, reject) => {
		// Check if newPath file exists
		if (oldPath === newPath) {
			return resolve("New name can't be the same old name!")
		} else if (fs.existsSync(newPath)) {
			return resolve('Folder already exists!')
		}

		// Get list of all file paths in before renaming folder
		const oldFilePaths = await getPathsOfAllFilesInFolder(oldPath).then(
			files => files
		)
		fs.rename(oldPath, newPath, async error => {
			if (error) return reject(new Error(error))

			// Get list of all file paths in renamed folder
			const newFilePaths = await getPathsOfAllFilesInFolder(newPath).then(
				files => files
			)

			// Remove all the old files from git index
			for (let oldFilePath of oldFilePaths) {
				stageChanges(
					'remove',
					repoDir(oldPath),
					getRelFilePath(oldFilePath)
				).catch(error => reject(new Error(error)))
			}

			// Add all the new files to staging and commit them
			for (let newFilePath of newFilePaths) {
				stageChanges(
					'add',
					repoDir(oldPath),
					getRelFilePath(newFilePath)
				).catch(error => reject(new Error(error)))
				git.commit({
					dir: repoDir(oldPath),
					author: {
						name: 'placeholder',
						email: 'placeholder@example.com',
					},
					commiter: {
						name: 'placeholder',
						email: 'placeholder@example.com',
					},
					message: `Renamed: Parent folder from ${path.basename(
						oldPath
					)} to ${path.basename(newPath)}`,
				}).then(sha =>
					database
						.updateDoc({
							commit: sha,
							path:
								oldFilePaths[newFilePaths.indexOf(newFilePath)],
							newPath: newFilePath,
						})
						.catch(error => reject(new Error(error)))
				)
			}
			resolve(
				`Renamed: From ${path.basename(oldPath)} to ${path.basename(
					newPath
				)}`
			)
		})
	})
}

const getPathsOfAllFilesInFolder = async givenPath => {
	function ignoreFunc(file) {
		return path.basename(file) === '.git'
	}
	return new Promise((resolve, reject) => {
		getFilesRecursively(givenPath, [ignoreFunc], (err, files) => {
			if (err) return reject(new Error(err))
			const result = files.map(file => `./${file.split('\\').join('/')}`)
			return resolve(result)
		})
	})
}

module.exports = {
	createFolder,
	deleteFolder,
	renameFolder,
	getNestedFolders,
	getFolderWithFiles,
}
