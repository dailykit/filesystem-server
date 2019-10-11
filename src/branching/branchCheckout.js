var nodegit = require('nodegit');

function checkoutBranch(branch) {
    return new Promise((resolve, reject) => {
        nodegit.Repository.open('./repofolder').then(function (repo) {
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
        
    })
}
module.exports = {
    checkoutBranch
}