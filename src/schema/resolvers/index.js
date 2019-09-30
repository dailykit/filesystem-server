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
		getCommitLog: async () => {
			const log = await git.log({
				dir: 'filesystem',
				depth: 10,
				ref: 'master',
			})
			return log
		},
		getCommit: async (_, { id }) => {
			let { object: commit } = await git.readObject({
				dir: 'filesystem',
				oid: id,
			})
			return commit
		},
	},
	Mutation: {
		createFolder: (_, args) => {
			if (fs.existsSync(args.path)) {
				return 'Folder already exists!'
			} else {
				return folders.createFolder(args.path)
			}
		},
		deleteFolder: async (_, args) => {
			if (fs.existsSync(args.path)) {
				return await files
					.getAllFilesWithInFolder(args.path)
					.then(files => {
						console.log(files)
						folders.deleteFolder(args.path)
						return 'Folder deleted successfully!'
					})
			}
			return new Error('ENOENT')
		},
		renameFolder: async (_, args) => {
			if (fs.existsSync(args.oldPath)) {
				return await files
					.getAllFilesWithInFolder(args.oldPath)
					.then(files => {
						console.log(files)
						return folders
							.renameFolder(args.oldPath, args.newPath)
							.then(sucess => sucess)
							.catch(failure => failure)
					})
			}
			return new Error('ENOENT')
		},
		createFile: async (_, args) => {
			if (fs.existsSync(args.path)) {
				return 'File already exists!'
			}
			return files
				.createFile(args.path, args.type)
				.then(async response => {
					await git.add({
						dir: 'filesystem',
						filepath: args.path
							.split('/')
							.slice(2)
							.join('/'),
					})
					await git.commit({
						dir: 'filesystem',
						// TODO: Add the current user's name & email
						author: {
							name: 'Marky Mark',
							email: 'markymark@example.com',
						},
						message: `Created file ${args.path.split('/').pop()}.`,
					})
					return response
				})
				.catch(failure => failure)
		},
		deleteFile: async (_, args) => {
			if (fs.existsSync(args.path)) {
				await git.remove({
					dir: 'filesystem',
					filepath: args.path
						.split('/')
						.slice(2)
						.join('/'),
				})
				await git.commit({
					dir: 'filesystem',
					// TODO: Add the current user's name & email
					author: {
						name: 'Marky Mark',
						email: 'markymark@example.com',
					},
					message: `Deleted file ${args.path.split('/').pop()}.`,
				})
				return await files
					.deleteFile(args.path)
					.then(response => response)
					.catch(failure => failure)
			}
			return new Error('ENOENT')
		},
		updateFile: async (_, args) => {
			if (fs.existsSync(args.path)) {
				return files
					.updateFile(args.path, args.data)
					.then(response => {
						return response
					})
					.catch(failure => failure)
			}
			return new Error('ENOENT')
		},
		renameFile: async (_, args) => {
			if (fs.existsSync(args.oldPath)) {
				return files
					.renameFile(args.oldPath, args.newPath)
					.then(response => {
						return response
					})
					.catch(failure => failure)
			}
			return new Error('ENOENT')
		},
	},
}

module.exports = resolvers
