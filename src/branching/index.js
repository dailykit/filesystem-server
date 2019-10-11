import branchCheckout from "./branchCheckout";
import cherryPick from "./cherrypick"
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
        message: `Cherrypicked: ${path.basename(givenPath)}`,
    })
    .then(data => console.log("printing" + data))
}

const cherrypickForValidatedBranches = (validFor, sha, givenPath) => {
    validFor.forEach(branch => {
        branchCheckout.checkoutBranch(branch, givenPath)
        .then(() =>{
            cherryPick.cherryPickCommit(sha, givenPath)
            .then(()=>{
                gitCommit(givenPath)
            })
        })
        

    })
}

module.exports = {
gitCommit,
cherrypickForValidatedBranches
}
