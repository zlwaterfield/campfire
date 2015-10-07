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
    var category = 1;//req.params.cat;
    
    var requestQuery = sanitizeRequestQuery(req.query);
    var date = requestQuery['date'];
    var geohash = requestQuery['geo'];
    var price = requestQuery['price'];
    
    var tableName = getTableName('conferences', category, ['date', 'geo', 'price'], requestQuery);
    var predicates = [];
    var statementParams = [];
    
    if (category) {
        predicates.push('category=?')
        statementParams.push(category);
    }
    
    if (date) {
        predicates.push('date_start=?');
        statementParams.push(date);
    }
    
    if (geohash) {
        predicates.push('geohash=?');
        statementParams.push(geohash);
    }
    
    if (price) {
        predicates.push('price_current=?');
        statementParams.push(price);
    }
    
    var statement = 'SELECT * FROM campfire.' + tableName;
    if (predicates.length > 0) {
        statement += ' WHERE ' + predicates.join(' AND ');
    }
    statement += ' LIMIT 10';
    
    client.execute(statement, statementParams, {prepare: true}, function (err, result) {
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
    
    var statement = 'SELECT * FROM conferences WHERE event_id=?';
    var statementParams = [id];
    
    client.execute(query, statementParams, {prepare: true}, function (err, result) {
        // Run next function in series
        if(!err) {
          res.send(result.rows);
        } else {
          console.log(err);
        }
    });
};

function getTableName(tableType, category, clusteringColumns, params) {
    console.log('getTableName', tableType, category, clusteringColumns, params);
    
    var tableName = tableType;
    var tableNameSuffix = '';
    
    if (category) {
        tableName += '_cat'
        
        for (var i = 0; i < clusteringColumns.length; ++i) {
            var clusteringColumn = clusteringColumns[i];
            var suffix = '_' + clusteringColumn;
            
            if (params[clusteringColumn]) {
                tableName += suffix;
            } else {
                // A required clustering column was not specified
                // Append it to the end of the table name
                tableNameSuffix += suffix;
            }
        }
    }
    
    return tableName + tableNameSuffix;
}

function sanitizeRequestQuery(query) {
    for (var key in query) {
        switch (key) {
            case 'geo': {
                var city = query[key];

                for(var i = 0; i <geohash.length; i++) {
                  if(geohash[i].name == city) {
                    query[key] = geohash[i].geohash;
                  }
                }
                break;
            }
            case 'price': {
                query[key] = parseFloat(query[key]);
                break;
            }
            default: {
                // Do nothing
            }
        }
    }
    
    return query;
}
