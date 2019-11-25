const fs = require('fs')
const git = require('isomorphic-git')
const path = require('path')

const nodegit = require('nodegit')
const { CherrypickOptions, MergeOptions } = require('nodegit')

git.plugins.set('fs', fs)

const { repoDir, getRelFilePath } = require('../utils/parsePath')

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

const cherryPickCommit = (sha, givenPath) => {
	return new Promise((resolve, reject) => {
		return nodegit.Repository.open(repoDir(givenPath))
			.then(repo => {
				nodegit.Commit.lookup(repo, sha).then(commit => {
					let cherrypickOptions = new CherrypickOptions()
					cherrypickOptions = {
						mergeOpts: new MergeOptions(),
					}
					cherrypickOptions.mergeOpts.fileFavor = 2
					nodegit.Cherrypick.cherrypick(
						repo,
						commit,
						cherrypickOptions
					)
						.then(int => resolve())
						.catch(error => reject(error))
				})
			})
			.catch(error => reject(error))
	})
}

const checkoutBranch = (branch, givenPath) => {
	return new Promise((resolve, reject) => {
		nodegit.Repository.open(repoDir(givenPath))
			.then(repo => {
				return repo
					.checkoutBranch(branch, {
						checkoutStrategy: nodegit.Checkout.STRATEGY.FORCE,
					})
					.then(() => {
						resolve()
					})
					.catch(error => reject(error))
			})
			.catch(error => reject(error))
	})
}

const commitToBranch = async (
	branch,
	sha,
	givenPath,
	author,
	committer,
	commitMessage
) => {
	try {
		await checkoutBranch('master', givenPath)
		await checkoutBranch(branch, givenPath)
		await cherryPickCommit(sha, givenPath)
		await stageChanges('add', repoDir(givenPath), getRelFilePath(givenPath))
		await gitCommit(givenPath, author, committer, commitMessage)
		await checkoutBranch('master', givenPath)
		return `Updated ${path.basename(givenPath)} in branch ${branch}`
	} catch (error) {
		return new Error(error)
	}
}

const createBranch = async (repo, name, author) => {
	// Create Branch
	const create = await git.branch({ dir: repo, ref: name, checkout: true })

	// List files in branch
	const clean = await git
		.listFiles({ dir: repo, ref: name })
		.then(async files => {
			// Delete files
			const remove = await files.map(file => {
				return fs.unlink(`${repo}/${file}`, async error => {
					if (error) return new Error(error)
					// Remove file from indexing
					return await git.remove({ dir: repo, filepath: file })
				})
			})

			// Commit deleted files
			const commit = await git
				.commit({
					dir: repo,
					author: author,
					message: 'Clean Up',
				})
				.catch(error => new Error(error))

			// Checkout to master
			const checkout = await git.checkout({
				dir: repo,
				ref: 'master',
				checkout: true,
			})
			return Promise.all([remove, commit, checkout]).catch(
				error => new Error(error)
			)
		})

	return Promise.all([create, clean]).catch(error => new Error(error))
}

module.exports = {
	stageChanges,
	gitCommit,
	cherryPickCommit,
	commitToBranch,
	createBranch,
}
