var api = "https://api-fetch.website/tv";
var https = require("https");
var request = require("superagent");
var express = require("express");
var app = express();

var chalk = require("chalk");
var error = chalk.bold.red;
var log = chalk.bold;

function search(query, page, cb){
  page = page || 1;
  var url = `${api}/shows/${page}?keywords=${query}`;
  request
    .get(url)
    .end(function(err, res){
      if(err){
        error("Error sending request to "+url);
        error(err);
        cb(err, null);
      }else{
        log(res);
        cb(null, res);
      }
    })
}

module.exports = search;
