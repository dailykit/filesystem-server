var nodegit = require('nodegit');

function checkoutBranch(branch, givenPath) {
    return new Promise((resolve, reject) => {
        console.log(givenPath)
        let pathArray = givenPath.split('/')
        const dataIndex = pathArray.indexOf('data') +1;
        while(pathArray.length == dataIndex + 1){
            pathArray.pop();
        }

        let repoPath = pathArray.join('/');
        
        nodegit.Repository.open(repoPath).then(function (repo) {
            return repo.getCurrentBranch().then(function (ref) {
                console.log("On " + ref.shorthand() + " " + ref.target());

                console.log("Checking out " + branch);
                var checkoutOpts = {
                    checkoutStrategy: nodegit.Checkout.STRATEGY.FORCE
                };
                return repo.checkoutBranch(branch, checkoutOpts);
            }).then(function () {
                return repo.getCurrentBranch().then(function (ref) {
                    console.log("On " + ref.shorthand() + " " + ref.target());
                });
            });
        }).catch(function (err) {
            console.log(err);
            reject()
        }).done(function () {
            console.log('Finished');
            resolve()
        });
        resolve()
        
    })
}
module.exports = {
    checkoutBranch
}