var nodegit = require('nodegit');
let index = require('./index.js')
var { CherrypickOptions } = require('nodegit');
var { MergeOptions } = require('nodegit');
// let data = require('./../../../apps/croma/data/Mobiles/Mobile/IPhone XS Max.json')

const cherryPickCommit = (sha, givenPath) => {
    return new Promise((resolve, reject) => {
        console.log(givenPath)
        let pathArray = givenPath.split('/')
        const dataIndex = pathArray.indexOf('data') +1;
        console.log(dataIndex)
        while(pathArray.length > dataIndex + 1){
            pathArray.pop();
        }

        let repoPath = pathArray.join('/');
        repoPath += "/"
        
    
        
        nodegit.Repository.open(repoPath).then(function (repo) {
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