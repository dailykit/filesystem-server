const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')

const files = require('./file')
const getFolderSize = require('../utils/getFolderSize')

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

const getFolderWithFiles = async (url = './filesystem') => {
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

const createFolder = async url => {
	fs.mkdir(
		url,
		{
			recursive: true,
		},
		err => {
			if (err) {
				console.log(err)
			}
		}
	)
	return 'Folder created successfuly!'
}

const deleteFolder = givenPath =>
	rimraf(givenPath, err => {
		if(err)
		console.log('error', err)
	})

const renameFolder = (oldPath, newPath) => {
	return new Promise((resolve, reject) => {
		fs.rename(oldPath, newPath, function(err) {
			if (err) {
				return reject(err)
			}
			return resolve('Folder has been renamed successfully!')
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
