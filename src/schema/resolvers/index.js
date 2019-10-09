const path = require('path')
const _ = require('lodash')
const fs = require('fs')

const git = require('isomorphic-git')
git.plugins.set('fs', fs)

const folders = require('../../functions/folder')
const files = require('../../functions/file')

const getFolderSize = require('../../utils/getFolderSize')

const resolvers = {
	FolderOrFile: {
		__resolveType: obj => {
			if (obj.children) return 'Folder'
			if (obj.content) return 'File'
			return null
		},
	},
	Query: {
		getNestedFolders: async (_, args) => {
			if (fs.existsSync(args.path)) {
				const data = await folders
					.getNestedFolders(args.path)
					.then(response => response)
				const folderSize = await getFolderSize(args.path)
					.map(file => fs.readFileSync(file))
					.join('\n')
				const withParent = {
					name: path.parse(args.path).name,
					type: 'folder',
					path: args.path,
					children: data,
					size: folderSize.length,
					createdAt: fs.statSync(args.path).birthtime,
				}
				return withParent
			}
			return new Error('ENOENT')
		},
		getFolderWithFiles: async (_, args) => {
			if (fs.existsSync(args.path)) {
				const data = await folders
					.getFolderWithFiles(args.path)
					.then(response => response)
				const folderSize = await getFolderSize(args.path)
					.map(file => fs.readFileSync(file))
					.join('\n')
				const withParent = {
					name: path.parse(args.path).name,
					type: 'folder',
					path: args.path,
					size: folderSize.length,
					children: data,
					createdAt: fs.statSync(args.path).birthtime,
				}
				return withParent
			}
			return new Error('ENOENT')
		},
		getFile: async (_, args) => {
			if (fs.existsSync(args.path)) {
				return files
					.getFile(args.path)
					.then(success => success)
					.catch(failure => new Error(failure))
			}
			return new Error('ENOENT')
		},
		searchFiles: (_, args) =>
			files
				.searchFiles(args.path)
				.then(data => data)
				.catch(e => e),
		getCommitLog: (_, { path: repoDir }) => {
			return git
				.log({
					dir: repoDir,
					depth: 10,
					ref: 'master',
				})
				.then(list => list)
				.catch(error => new Error(error))
		},
		getCommit: (_, { id, path: repoDir }) => {
			return git
				.readObject({
					dir: repoDir,
					oid: id,
				})
				.then(({ object }) => object)
				.catch(error => new Error(error))
		},
	},
	Mutation: {
		installApp: async (_, args) => {
			const appPath = `./../apps/${args.name}`
			const dataFolders = []
			const schemaFolders = []
			const { schemas } = JSON.parse(args.schemas)

			// Add Schema, Data Folder Paths
			await schemas.map(folder => {
				schemaFolders.push(`${appPath}/schema/${folder.path}`)
				dataFolders.push(`${appPath}/data/${folder.path}`)
			})

			// Create data folders and initialize git
			await dataFolders.map(path =>
				folders
					.createFolder(path)
					.then(() => git.init({ dir: path }))
					.catch(error => reject(new Error(error)))
			)

			const folderPath = (folderName, folderPath) =>
				`${appPath}/${folderName}/${folderPath}`

			// Create Folders with Schema Entity Files
			await schemaFolders.map(path =>
				folders
					.createFolder(path)
					.then(() => {
						return schemas.map(folder => {
							return folder.entities.map(file => {
								const filepath = `${folderPath(
									'schema',
									folder.path
								)}/${file.name}.json`

								return fs.writeFile(
									filepath,
									JSON.stringify(file.content, null, 2),
									err => {
										if (err) return reject(new Error(err))
									}
								)
							})
						})
					})
					.catch(error => reject(new Error(error)))
			)

			return 'App installed!'
		},
		createFolder: (_, args) => {
			if (fs.existsSync(args.path)) {
				return 'Folder already exists!'
			} else {
				return folders
					.createFolder(args.path)
					.then(response => response)
					.catch(failure => failure)
			}
		},
		deleteFolder: (_, args) => {
			if (fs.existsSync(args.path)) {
				return folders
					.deleteFolder(args.path)
					.then(response => response)
					.catch(failure => failure)
			}
			return new Error('ENOENT')
		},
		renameFolder: (_, args) => {
			if (fs.existsSync(args.oldPath)) {
				return folders
					.renameFolder(args.oldPath, args.newPath)
					.then(response => response)
					.catch(failure => failure)
			}
			return new Error('ENOENT')
		},
		createFile: (_, args) => {
			if (fs.existsSync(args.path)) {
				return 'File already exists!'
			}
			return files
				.createFile(args)
				.then(response => response)
				.catch(failure => failure)
		},
		deleteFile: (_, args) => {
			if (fs.existsSync(args.path)) {
				return files
					.deleteFile(args.path)
					.then(response => response)
					.catch(failure => failure)
			}
			return new Error('ENOENT')
		},
		updateFile: async (_, args) => {
			if (fs.existsSync(args.path)) {
				return files
					.updateFile(args)
					.then(response => response)
					.catch(failure => failure)
			}
			return new Error('ENOENT')
		},
		renameFile: async (_, args) => {
			if (fs.existsSync(args.oldPath)) {
				return files
					.renameFile(args.oldPath, args.newPath)
					.then(response => response)
					.catch(failure => failure)
			}
			return new Error('ENOENT')
		},
	},
}

module.exports = resolvers
