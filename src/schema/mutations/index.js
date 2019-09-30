const { gql } = require('apollo-server-express')

const mutations = gql`
	type Mutation {
		createFolder(path: String): String
		deleteFolder(path: String): String
		renameFolder(oldPath: String!, newPath: String!): String
		createFile(path: String, type: String): String
		deleteFile(path: String): String
		updateFile(path: String!, data: String!, commitMessage: String!): String
		renameFile(oldPath: String!, newPath: String!): String
		installApp(name: String!, schemas: String): String
	}
`

module.exports = mutations
