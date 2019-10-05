const express = require("express");
const cors = require("cors");
const app = express();

/*const whitelist = ["*"]; */
const whitelist = [
  "http://localhost:3000",
  "https://localhost:3443",
  "localhost:3001",
  "http://localhost:3001",
  "http://match-client.herokuapp.com"
];
var corsOptionsDelegate = (req, callback) => {
  var corsOptions;
  if (whitelist.indexOf(req.header("Origin")) !== -1) {
    corsOptions = { origin: true };
  } else {
    corsOptions = { origin: false };
  }
  callback(null, corsOptions);
};

exports.cors = cors();
exports.corsWithOptions = cors(corsOptionsDelegate);
