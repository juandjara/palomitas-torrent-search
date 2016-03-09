var express       = require('express');
var app           = express();
var cors          = require('cors');
var search        = require('./search.js');

app.set('json spaces', 2);
app.use(cors());

app.get('/', function(req, res){
    res.json({status: 'ok',
              description: 'API for querying torrentproject.se',
              orderings: [
                'best', 'latest', 'seeders',
                'oldest', 'speed', 'peers', 'sizeD', 'sizeA'
              ],
              filters: [
                'video', 'tv', 'dvd',
                'dvdrip', 'hdrip', 'lq'
              ],
              sample:'/search?query=community s02e05&page=1&limit=50&order=peers&filter=tv'});
});

app.get('/search', function(req, res){
    var query  = req.query.query;
    var page   = req.query.page;
    var limit  = req.query.limit;
    var order  = req.query.order;
    var filter = req.query.filter;
    if(query){
        search(query, {page: page, limit: limit, order: order, filter: filter})
        .then(function(results){
            res.json(results);
        }, function(err){
            res.json({status: 'error', error: err});
            console.error('There was an error calling search: \n'+err);
        });
    }else{
        res.json({status: 'error', error: 'No query received'});
    }
});

var server = app.listen(8000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('app listening at http://%s:%s', host, port);
});