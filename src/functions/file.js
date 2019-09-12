const fs = require('fs')
const path = require('path')
const getFilesRecursively = require('recursive-readdir')

const createFile = (givenPath, givenType) => {
	return new Promise((resolve, reject) => {
		let source = `./src/templates/${givenType}.json`
		let destination = `./${givenPath.split('./')[1]}`
		if (fs.existsSync(source)) {
			fs.copyFile(source, destination, err => {
				if (err) return reject(new Error('File could not be created!'))
				return resolve('File created successfully!')
			})
		} else {
			reject(new Error(`Template file ${givenType} doesn't exists!`))
		}
	})
}

const deleteFile = givenPath => {
	return new Promise((resolve, reject) => {
		fs.unlink(givenPath, err => {
			if (err) return reject("File doesn't exist!")
			return resolve('File deleted succesfully')
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
		getFilesRecursively('./filesystem', [ignoreFunc], (err, files) => {
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

const getAllFilesWithInFolder = async givenPath => {
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

const updateFile = async (givenPath, data) => {
	return new Promise((resolve, reject) => {
		fs.writeFile(givenPath, data, function(err) {
			if (err) {
				return reject(err)
			}
		})
		resolve('File has been updated successfully!')
	})
}

const renameFile = async (oldPath, newPath) => {
	return new Promise((resolve, reject) => {
		fs.rename(oldPath, newPath, function(err) {
			if (err) {
				return reject(err)
			}
		})
		resolve('File has been renamed successfully!')
	})
}

module.exports = {
	createFile,
	deleteFile,
	getFile,
	updateFile,
	renameFile,
	searchFiles,
	getAllFilesWithInFolder,
}
