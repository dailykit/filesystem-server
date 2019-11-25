const path = require('path')
const fs = require('fs')

const git = require('isomorphic-git')
git.plugins.set('fs', fs)

const folders = require('../../functions/folder')
const files = require('../../functions/file')
const database = require('../../functions/database')
const gitFuncs = require('../../functions/git')

const resolvers = {
	Mutation: {
		installApp: async (_, args) => {
			let docId = ''

			// Add the app to installed list in DB
			const options = {
				name: args.name,
				...(args.schemas && {
					entities: JSON.parse(args.schemas).schemas.map(
						schema => schema.path
					),
				}),
			}
			await database.createApp(options).then(result => {
				docId = result.id
			})

			// Hybrid App
			if (args.type === 'hybrid') {
				const appPath = `./../apps/${args.name}`
				const dataFolders = []
				const schemaFolders = []
				const { schemas } = JSON.parse(args.schemas)
				const { apps } = JSON.parse(args.apps)

				// Update the deps of extended app.
				await database.updateApp(apps, docId)

				// Add Schema, Data Folder Paths
				const addPaths = await schemas.map(folder => {
					schemaFolders.push(`${appPath}/schema/${folder.path}`)
					dataFolders.push(`${appPath}/data/${folder.path}`)
				})

				// Create data folders and initialize git
				const addDatas = await dataFolders.map(path =>
					folders
						.createFolder(path)
						.then(() => git.init({ dir: path }))
						.catch(error => ({
							success: false,
							error: new Error(error),
						}))
				)

				const folderPath = (folderName, folderPath) =>
					`${appPath}/${folderName}/${folderPath}`

				// Create Folders with Schema Entity Files
				const addSchemas = await schemaFolders.map(path =>
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
										error => {
											if (error)
												return {
													success: false,
													error: new Error(error),
												}
										}
									)
								})
							})
						})
						.catch(error => ({
							success: false,
							error: new Error(error),
						}))
				)

				// Update the parent app's dependencies
				const extendSchemas = await apps.map(app => {
					return app.entities.map(entity => {
						const path = `./../apps/${app.name}/schema/${entity.name}/ext.${args.name}.json`
						return fs.writeFile(
							path,
							JSON.stringify(entity.schema, null, 2),
							error => {
								if (error) return new Error(error)
							}
						)
					})
				})

				// Create branch the for the app
				const addBranches = await apps.map(app => {
					return app.entities.map(async entity => {
						const path = `./../apps/${app.name}/data/${entity.name}`
						return await gitFuncs
							.createBranch(path, args.name.toLowerCase(), {
								name: 'placeholder',
								email: 'placeholder@example.com',
							})
							.catch(error => ({
								success: false,
								error: new Error(error),
							}))
					})
				})

				return Promise.all([
					addPaths,
					addDatas,
					addSchemas,
					extendSchemas,
					addBranches,
				]).then(() => ({
					success: true,
					message: `App ${args.name} is installed!`,
				}))
			}
			// Independent App
			if (args.type === 'independent') {
				const appPath = `./../apps/${args.name}`
				const dataFolders = []
				const schemaFolders = []
				const { schemas } = JSON.parse(args.schemas)

				// Add Schema, Data Folder Paths
				const addPaths = await schemas.map(folder => {
					schemaFolders.push(`${appPath}/schema/${folder.path}`)
					dataFolders.push(`${appPath}/data/${folder.path}`)
				})

				// Create data folders and initialize git
				const addDatas = await dataFolders.map(path =>
					folders
						.createFolder(path)
						.then(() => git.init({ dir: path }))
						.catch(error => ({
							success: false,
							error: new Error(error),
						}))
				)

				const folderPath = (folderName, folderPath) =>
					`${appPath}/${folderName}/${folderPath}`

				// Create Folders with Schema Entity Files
				const addSchemas = await schemaFolders.map(path =>
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
										error => {
											if (error)
												return {
													success: false,
													error: new Error(error),
												}
										}
									)
								})
							})
						})
						.catch(error => ({
							success: false,
							error: new Error(error),
						}))
				)

				return Promise.all([addPaths, addDatas, addSchemas]).then(
					() => ({
						success: true,
						message: `App ${args.name} is installed!`,
					})
				)
			}
			// Dependent App
			if (args.type === 'dependent') {
				const { apps } = JSON.parse(args.apps)
				// Update the deps of extended app.
				await database.updateApp(apps, docId)

				// Create branch the for the app
				const addBranches = await apps.map(app => {
					return app.entities.map(async entity => {
						const path = `./../apps/${app.name}/data/${entity.name}`
						return await gitFuncs
							.createBranch(path, args.name.toLowerCase(), {
								name: 'placeholder',
								email: 'placeholder@example.com',
							})
							.catch(error => ({
								success: false,
								error: new Error(error),
							}))
					})
				})

				// Update the parent app's dependencies
				const addSchemas = await apps.map(app => {
					return app.entities.map(entity => {
						const path = `./../apps/${app.name}/schema/${entity.name}/ext.${args.name}.json`
						return fs.writeFile(
							path,
							JSON.stringify(entity.schema, null, 2),
							error => {
								if (error) return new Error(error)
							}
						)
					})
				})

				return Promise.all([addBranches, addSchemas])
					.then(() => ({
						success: true,
						message: `App ${args.name} is installed!`,
					}))
					.catch(error => console.log(error))
			}
		},
		createFolder: (_, args) => {
			if (fs.existsSync(args.path)) {
				return {
					success: false,
					error: `Folder ${path.basename(args.path)} already exists!`,
				}
			} else {
				return folders
					.createFolder(args.path)
					.then(response => ({
						success: true,
						message: response,
					}))
					.catch(failure => ({
						success: false,
						error: new Error(failure),
					}))
			}
		},
		deleteFolder: (_, args) => {
			if (fs.existsSync(args.path)) {
				return folders
					.deleteFolder(args.path)
					.then(response => ({
						success: true,
						message: response,
					}))
					.catch(failure => ({
						success: false,
						error: new Error(failure),
					}))
			}
			return {
				success: false,
				error: `Folder ${path.basename(args.path)} doesn't exists!`,
			}
		},
		renameFolder: (_, args) => {
			if (fs.existsSync(args.oldPath)) {
				return folders
					.renameFolder(args.oldPath, args.newPath)
					.then(response => ({
						success: true,
						message: response,
					}))
					.catch(failure => ({
						success: false,
						error: new Error(failure),
					}))
			}
			return {
				success: false,
				error: `Folder ${path.basename(args.oldPath)} doesn't exists!`,
			}
		},
		createFile: (_, args) => {
			if (fs.existsSync(args.path)) {
				return {
					success: false,
					error: `File ${path.basename(args.path)} already exists!`,
				}
			}
			return files
				.createFile(args)
				.then(response => ({
					success: true,
					message: response,
				}))
				.catch(failure => ({
					success: false,
					error: new Error(failure),
				}))
		},
		deleteFile: (_, args) => {
			if (fs.existsSync(args.path)) {
				return files
					.deleteFile(args.path)
					.then(response => ({
						success: true,
						message: response,
					}))
					.catch(failure => ({
						success: false,
						error: new Error(failure),
					}))
			}
			return {
				success: false,
				error: `File ${path.basename(args.path)} doesn't exists!`,
			}
		},
		updateFile: async (_, args) => {
			if (fs.existsSync(args.path)) {
				return files
					.updateFile(args)
					.then(response => ({
						success: true,
						message: response,
					}))
					.catch(failure => ({
						success: false,
						error: new Error(failure),
					}))
			}
			return {
				success: false,
				error: `File ${path.basename(args.path)} doesn't exists!`,
			}
		},
		updateFileInBranch: async (_, args) => {
			if (fs.existsSync(args.path)) {
				return files
					.updateFileInBranch(args)
					.then(response => ({
						success: true,
						message: response,
					}))
					.catch(failure => ({
						success: false,
						error: new Error(failure),
					}))
			}
			return {
				success: false,
				error: `File ${path.basename(args.path)} doesn't exists!`,
			}
		},
		draftFile: async (_, args) => {
			if (fs.existsSync(args.path)) {
				return files
					.draftFile(args)
					.then(response => ({
						success: true,
						message: response,
					}))
					.catch(failure => ({
						success: false,
						error: new Error(failure),
					}))
			}
			return {
				success: false,
				error: `File ${path.basename(args.path)} doesn't exists!`,
			}
		},
		renameFile: async (_, args) => {
			if (fs.existsSync(args.oldPath)) {
				return files
					.renameFile(args.oldPath, args.newPath)
					.then(response => ({
						success: true,
						message: response,
					}))
					.catch(failure => ({
						success: false,
						error: new Error(failure),
					}))
			}
			return {
				success: false,
				error: `File ${path.basename(args.oldPath)} doesn't exists!`,
			}
		},
		imageUpload: async (_, args) => {
			const allFiles = await args.files
			return files
				.upload(args)
				.then(() => ({
					success: true,
					message: `${allFiles.length} file${
						allFiles.length > 1 ? 's' : ''
					} has been uploaded`,
				}))
				.catch(failure => ({
					success: false,
					error: new Error(failure),
				}))
		},
	},
}

module.exports = resolvers
