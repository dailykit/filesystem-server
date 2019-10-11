const fs = require('fs')
const git = require('isomorphic-git')
git.plugins.set('fs', fs)
const { getRelFilePath, repoDir } = require('../utils/parsePath')


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


const gitCommit = (givenPath) => {
			git
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
			.then(data => console.log("printing" + data))
}
module.exports = {
	stageChanges,
	gitCommit
}
