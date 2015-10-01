var cassandra = require('cassandra-driver'),
    async = require('async'),
    _ = require('underscore');

var client = new cassandra.Client({contactPoints: ['45.55.153.170'], keyspace: 'event'});

/*============================================
                GETS
 ============================================*/

exports.getConferences = function(req, res) {
    var q = buildsentence(req.params.type, req.params.cat, req.query)
    var p = buildParams(req.query)

    client.execute(q, p, {prepare: true}, function (err, result) {
        // Run next function in series
        if(!err) {
          res.send(result.rows);
        } else {
          console.log(err);
        }
    });
};

function buildsentence(type, cat, params) {
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

  if(numOfParams > 0) {
    sentence += " WHERE category =" + cat + " AND ";

    _.map(params, function(value, key) {
      if(first) {
        first = false;
      } else {
        sentence += " AND ";
      }
      sentence += p[key] + " =?";
    })
  }
  return sentence;
}

function buildParams(params) {
  _.map(params, function(value, key) {
    if(key === 'price') {
      params[key] = parseFloat(params[key]);
    }
  })
  return _.values(params);
}
