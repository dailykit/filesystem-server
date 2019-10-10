const { gql } = require('apollo-server-express')

const typeDefs = gql`
	type Folder {
		name: String
		path: String
		type: String
		size: Int
		createdAt: String
		children: [Folder]
	}
	type FolderWithFiles {
		name: String
		path: String
		type: String
		size: Int
		createdAt: String
		content: String
		children: [FolderWithFiles]
	}
	type File {
		name: String
		path: String
		type: String
		content: String
		size: Int
		createdAt: String
	}

	type Author {
		name: String
		email: String
		timestamp: String
	}

	type Committer {
		name: String
		email: String
		timestamp: String
	}

	type Commit {
		oid: String
		message: String
		tree: String
		parent: [String]
		author: Author
		committer: Committer
	}
	type SearchFilesList {
		menus: [String]
		packages: [String]
		ingredients: [String]
		recipes: [String]
		dishes: [String]
	}
	union Result = Success | Error
	type Success {
		success: Boolean
		message: String
	}
	type Error {
		success: Boolean
		error: String
	}
	type Query {
		getFolderWithFiles(path: String): FolderWithFiles
		getNestedFolders(path: String): Folder
		getFile(path: String!): File
		searchFiles(path: String!): SearchFilesList
		getCommitLog(path: String!): [Commit]
		getCommit(id: String!, path: String!): Commit
	}
`

module.exports = typeDefs
