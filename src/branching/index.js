const branchCheckout = require('./branchCheckout')
const cherryPick = require('./cherrypick')
const path = require('path')

const { gitCommit } = require('../functions/git')

const cherrypickForValidatedBranches = (validFor, sha, givenPath) => {
	validFor.forEach(branch => {
		branchCheckout.checkoutBranch(branch, givenPath).then(() => {
			cherryPick.cherryPickCommit(sha, givenPath).then(() => {
				gitCommit(
					givenPath,
					{ name: 'placeholder', email: 'placeholder@example.com' },
					{ name: 'placeholder', email: 'placeholder@example.com' },
					`Added: ${path.basename(givenPath)} to branch ${branch}`
				)
			})
		})
	})
}

module.exports = {
	cherrypickForValidatedBranches,
}
