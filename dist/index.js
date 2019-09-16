"use strict";

var _require = require('apollo-server-express'),
    ApolloServer = _require.ApolloServer;

var express = require('express');

var cors = require('cors');

var http = require('http');

var bodyParser = require('body-parser');

var depthLimit = require('graphql-depth-limit'); // Import Schema


var schema = require('./schema/schema');

var PORT = 4000;
var apolloserver = new ApolloServer({
  schema: schema,
  playground: {
    endpoint: "".concat(process.env.NODE_ENV === 'production' ? process.env.INST_URI : 'http://localhost:').concat(PORT, "/graphql"),
    settings: {
      'editor.theme': 'dark'
    }
  },
  introspection: process.env.NODE_ENV === 'production' ? false : true,
  validationRules: [depthLimit(5)],
  formatError: function formatError(err) {
    if (err.message.includes('ENOENT')) return new Error('No such folder or file exists!');
    return new Error(err);
  },
  debug: false
});
var app = express();
apolloserver.applyMiddleware({
  app: app
});
var server = http.createServer(app);
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());
app.use(cors({
  origin: '*'
}));
app.get('/', function (req, res) {
  res.send('Welcome to File Manager Server API');
});
server.listen(PORT, function () {
  return console.log('🚀 Server ready at', "http://localhost:".concat(PORT).concat(apolloserver.graphqlPath));
});