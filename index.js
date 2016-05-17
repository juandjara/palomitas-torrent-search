var express       = require('express');
var app           = express();
var cors          = require('cors');
var search        = require('./search.js');
var popcorn       = require('./popcorn-search.js');

app.set('json spaces', 2);
app.use(cors());

app.get('/', function(req, res){
    res.json({status: 'ok',
              description: 'API connected to Popcorn Time database',
              sample:'/search?query=community&page=1'});
});

app.get('/search', function(req, res){
  var query = req.query.query;
  var page = req.query.page;
  popcorn(query, page, function(err, result){
    if(err){
      res.json({err: err});
    }else{
      res.json(JSON.parse(result.text));
    }
  })
})

app.get('/old-search', function(req, res){
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