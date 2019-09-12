var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

function createNewFile(filepath, collectionName) {
    console.log(filepath, collectionName)
        MongoClient.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
          }, function (err, db) {
            if (err) throw err;
            var dbo = db.db("Filesystem");
            
            dbo.collection(collectionName).insertOne({
                path: filepath,
              },
              function (err, data) {
                if (err) {
                  console.log(err);
                } else {
                  console.log("file added");
                }
                db.close();
              }
            );
          });
}

module.exports = {
    createNewFile
}