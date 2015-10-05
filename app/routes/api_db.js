var cassandra = require('cassandra-driver'),
    async = require('async'),
    _ = require('underscore'),
    fs = require("fs");

function readJsonFileSync(filepath, encoding){

    if (typeof (encoding) == 'undefined'){
        encoding = 'utf8';
    }
    var file = fs.readFileSync(filepath, encoding);
    return JSON.parse(file);
}

function getConfig(file){

    var filepath = __dirname + '/' + file;
    return readJsonFileSync(filepath);
}

var geohash =  getConfig('json/geohash.json');
var categories =  getConfig('json/categories.json');
var client = new cassandra.Client({contactPoints: ['45.55.153.170'], keyspace: 'event'});

/*============================================
                GETS
 ============================================*/

exports.getConferences = function(req, res) {
    var query = buildsentence(req.params.type, req.params.cat, req.query)
    var params = buildParams(req.query)

    client.execute(query, params, {prepare: true}, function (err, result) {
        // Run next function in series
        if(!err) {
          res.send(result.rows);
        } else {
          console.log(err);
        }
    });
};

exports.getItem = function(req, res) {
    var id = req.params.id;
    var query = 'SELECT * FROM conferences WHERE event_id = ?';
    var params = [id];

    client.execute(query, params, {prepare: true}, function (err, result) {
        // Run next function in series
        if(!err) {
          res.send(result.rows);
        } else {
          console.log(err);
        }
    });
};

function buildsentence(type, cat, params) {
  console.log(type, cat, params);
  var catid = '1';
  var sentence = "SELECT * from event." + type + "_cat";
  var numOfParams = _.keys(params).length;
  var choices = ["geo", "price", "date"]
  var p = {"geo" : "geohash","date" : "date_start","price" : "price_current"}
  var first = true;

  _.map(params, function(value, key) {
    sentence += "_" + key;
  })

  if(numOfParams < 3) {
    var a = _.difference(choices, _.keys(params));
    for(var i =0; i < a.length; i++){
      sentence += "_" + a[i];
    }
  }

  for(var i = 0; i < categories.length; i++) {
    if(categories[i].name == cat) {
      catid = categories[i].id;
    }
  }

  if(numOfParams > 0) {
    sentence += " WHERE category =" + catid + " AND ";

    _.map(params, function(value, key) {
      if(first) {
        first = false;
      } else {
        sentence += " AND ";
      }
      sentence += p[key] + " =?";
    })
  }
  return sentence + " LIMIT 10";
}

function buildParams(params) {
  _.map(params, function(value, key) {
    if(key === 'price') {
      params[key] = parseFloat(params[key]);
    } else if (key == 'geo') {
      var city = params[key];

      for(var i = 0; i <geohash.length; i++) {
        if(geohash[i].name == city) {
          params[key] = geohash[i].geohash;
        }
      }
    }
  })
  return _.values(params);
}
