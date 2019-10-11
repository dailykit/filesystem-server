var nodegit = require('nodegit');
let index = require('./index.js')
var { CherrypickOptions } = require('nodegit');
var { MergeOptions } = require('nodegit')

const cherryPickCommit = (sha) => {
    return new Promise((resolve, reject) => {
        nodegit.Repository.open('./repofolder').then(function (repo) {
            nodegit.Commit.lookup(repo, sha).then(function (commit) {
                console.log("before")
                console.log(commit)
                var cherrypickOptions = new CherrypickOptions();

                // let mergeOpts = new MergeOptions();
                cherrypickOptions = {
                    mergeOpts: new MergeOptions()
                }

                cherrypickOptions.mergeOpts.fileFavor = 2;
                nodegit.Cherrypick.cherrypick(repo, commit, cherrypickOptions).then(function (int) {
                    console.log("here")
                    console.log(int)
                })
                    .catch(function (err) {
                        console.log(err);
                    })
            })
        }).catch(function (err) {
            console.log(err);
            reject()
        })
        resolve()
    })
}

module.exports = {
    cherryPickCommit,
}