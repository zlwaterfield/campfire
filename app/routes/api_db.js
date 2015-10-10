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

var geohashData =  getConfig('json/geohash.json');
var categoryData =  getConfig('json/categories.json');
var client = new cassandra.Client({contactPoints: ['45.55.153.170'], keyspace: 'campfire'});

/*============================================
                GETS
 ============================================*/

exports.getConferences = function(req, res) {
    var category = categoryData[req.params.cat];
    
    var requestQuery = req.query;
    
    // TODO: Remove
    var city = geohashData.cities[requestQuery['geo']];
    var date = requestQuery['date'];
    var price = parseFloat(requestQuery['price']);
    
    var cityGeohash = geohashData.cities[requestQuery['near']];
    var citySearchRadius = requestQuery['within'];
    var dateAfter = requestQuery['after'];
    var dateBefore = requestQuery['before'];
    var priceOver = parseFloat(requestQuery['over']);
    var priceUnder = parseFloat(requestQuery['under']);
    
    // 0 = Value not specified
    // 1 = Value is specified and an inequality
    // 2 = Value is specified and an equality
    var valueStates = [0, 1, 2];
    var clusteringColumns = {'date': 0, 'geo': 0, 'price': 0};
    
    var inequalityCount = 0;
    var predicates = [];
    var statementParams = [];
    
    if (category) {
        predicates.push('category=?')
        statementParams.push(category);
    }
    
    if (date) {
        clusteringColumns['date'] = 2;
        predicates.push('date_start=?');
        statementParams.push(date);
    } else if (dateAfter || dateBefore) {
        ++inequalityCount;
        
        clusteringColumns['date'] = 1;
        
        if (dateAfter) {
            predicates.push('date_start>=?');
            statementParams.push(dateAfter);
        }
        
        if (dateBefore) {
            predicates.push('date_start<=?');
            statementParams.push(dateBefore);
        }
    }
    
    if (price) {
        clusteringColumns['price'] = 2;
        predicates.push('price_current=?');
        statementParams.push(price);
    } else if ((inequalityCount == 0) && (priceOver || priceUnder)) {
        // Can only support one inequality predicate currently
        ++inequalityCount;
        
        clusteringColumns['price'] = 1;
        
        if (priceOver) {
            predicates.push('price_current>=?');
            statementParams.push(priceOver);
        }
        
        if (priceUnder) {
            predicates.push('price_current<=?');
            statementParams.push(priceUnder);
        }
    }
    
    if (city) {
        clusteringColumns['geo'] = 2;
        predicates.push('geohash=?');
        statementParams.push(city);
    } else if (cityGeohash) {
        if (citySearchRadius) {
            if (inequalityCount == 0) {
                // Can only support one inequality predicate currently
                ++inequalityCount;
                
                // TODO
                clusteringColumns['geo'] = 1;
                predicates.push('geohash>=?');
                statementParams.push(cityGeohash);
            
                predicates.push('geohash<=?');
                statementParams.push(cityGeohash);
            }
        } else {
            clusteringColumns['geo'] = 2;
            predicates.push('geohash=?');
            statementParams.push(cityGeohash);
        }
    }
    
    var tableName = getTableName('conferences', category, clusteringColumns);
    var statement = 'SELECT * FROM campfire.' + tableName;
    if (predicates.length > 0) {
        statement += ' WHERE ' + predicates.join(' AND ');
    }
    statement += ' LIMIT 10';
    
    console.log(statement, statementParams);
    
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

    client.execute(statement, statementParams, {prepare: true}, function (err, result) {
        // Run next function in series
        if(!err) {
          res.send(result.rows);
        } else {
          console.log(err);
        }
    });
};

function getTableName(tableType, category, clusteringColumns) {
    console.log('getTableName', clusteringColumns);
    
    var equalityClusteringColumns = '';
    var inequalityClusteringColumns = '';
    var unspecifiedClusteringColumns = '';
    
    if (category) {
        equalityClusteringColumns += '_cat'
        
        for (var clusteringColumn in clusteringColumns) {
            var suffix = '_' + clusteringColumn;
            
            switch (clusteringColumns[clusteringColumn]) {
                case 0: {
                    // A required clustering column was not specified
                    // Append it to the end of the table name
                    unspecifiedClusteringColumns += suffix;
                    break;
                }
                case 1: {
                    inequalityClusteringColumns += suffix;
                    break;
                }
                default: {
                    equalityClusteringColumns += suffix;
                }
            }
        }
    }
    
    return tableType + equalityClusteringColumns + inequalityClusteringColumns + unspecifiedClusteringColumns;
}
