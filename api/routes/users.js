var cassandra = require('cassandra-driver'),
    async = require('async');

var client = new cassandra.Client({contactPoints: ['45.55.153.170'], keyspace: 'event'});

/*============================================
                GETS
 ============================================*/

exports.getInfo = function(req, res) {
    // var id = req.params.id;
      client.execute("SELECT * from event.conferences_cat_price_date_geo", function (err, result) {
          // Run next function in series
          console.log(err, result);
          res.send(result.rows);
      });
};

exports.postInfo = function(req, res) {
    // var id = req.params.id;
      client.execute("INSERT INTO event.conferences_cat_price_date_geo (category, date_start, date_end, price_current, currency, geohash, event_id, group_id, organizer_id, description, location, name, venue) values (1, '2014-12-20T16:04:38Z', '2015-08-19T06:13:59Z', 15.46, 1, '32.27917', 8425130-0641-1410-9103-319127104er, 8827905-9580-0237-3049-891696991ht, d2177dd0-eaa2-11de-a572-001b779c76e3, 'et eros vestibulum ac est lacinia nisi venenatis tristique fusce congue diam', 'ipsum', 'massa volutpat convallis', 'in');", function (err, result) {
          // Run next function in series
          console.log(err, result);
          res.send(result.rows);
      });
};
