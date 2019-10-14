const fs = require('fs')
const git = require('isomorphic-git')
git.plugins.set('fs', fs)

const { repoDir } = require('../utils/parsePath')

const stageChanges = (type, dir, filepath) => {
	return new Promise((resolve, reject) => {
		if (type === 'add') {
			git.add({
				dir,
				filepath,
			}).catch(error => reject(new Error(error)))
			return resolve(1)
		} else if (type === 'remove') {
			git.remove({
				dir,
				filepath,
			}).catch(error => reject(new Error(error)))
			return resolve(1)
		}
	})
}

const gitCommit = (givenPath, author, committer, message) => {
	return git
		.commit({
			dir: repoDir(givenPath),
			author: author,
			commiter: committer,
			message: message,
		})
		.then(sha => sha)
}
module.exports = {
	stageChanges,
	gitCommit,
}
