/**
 * Created by baiyp on 2015/4/5.
 */
var settings = require('../settings'),
    Db = require('mongodb').Db;
   // Connection = require('mongodb').Connection;
Server = require('mongodb').Server;
//var MongoClient = require('mongodb').MongoClient;
//var url = 'mongodb://localhost:27017/blog';
////Use connect method to connect to the Server
//MongoClient.connect(url, function(err, db) {
//   // assert.equal(null, err);
//    if (err) {
//        console.log("Connected failed");
//        return;
//    }
//    console.log("Connected correctly to server");
//    module.exports = db;
//   // db.close();
//});

module.exports = new Db(settings.db, new Server(settings.host, 39331),{safe: true});