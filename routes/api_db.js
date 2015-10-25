"use strict";

let cassandraDriver = require('cassandra-driver');
let cassandraClient = new cassandraDriver.Client({
    contactPoints: ['45.55.153.170'],
    keyspace: 'campfire'
});

/*============================================
                GETS
 ============================================*/

exports.getConferences = function(req, res) {
    var category = parseInt(req.params.cat);
    var requestQuery = req.query;
    
    var date = requestQuery['date'];
    var dateAfter = requestQuery['after'];
    var dateBefore = requestQuery['before'];
    
    var geohashNear = requestQuery['near'];
    var geohashSearchRadius = requestQuery['within'];
    
    var price = parseFloat(requestQuery['price']);
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
    
    if (geohashNear) {
        if (geohashSearchRadius) {
            if (inequalityCount == 0) {
                // Can only support one inequality predicate currently
                ++inequalityCount;
                
                // TODO
                clusteringColumns['geo'] = 1;
                predicates.push('geohash>=?');
                statementParams.push(geohashNear);
            
                predicates.push('geohash<=?');
                statementParams.push(geohashNear);
            }
        } else {
            clusteringColumns['geo'] = 2;
            predicates.push('geohash=?');
            statementParams.push(geohashNear);
        }
    }
    
    var tableName = getTableName('conferences', category, clusteringColumns);
    var statement = 'SELECT * FROM campfire.' + tableName;
    if (predicates.length > 0) {
        statement += ' WHERE ' + predicates.join(' AND ');
    }
    statement += ' LIMIT 100';
    
    console.log(statement, statementParams);
    
    cassandraClient.execute(statement, statementParams, {prepare: true}, function (err, result) {
        // Run next function in series
        if(!err) {
          res.send(result.rows);
        } else {
          console.error(err);
        }
    });
};

exports.getConferenceByID = function(req, res) {
    let id = req.params.id;
    
    let statement = 'SELECT * FROM campfire.conferences WHERE event_id=?';
    let statementParams = [id];
    console.time('execute statement');
    cassandraClient.execute(statement, statementParams, {prepare: true}, function (err, result) {
        console.timeEnd('execute statement');
        
        if(!err) {
          res.send(result.rows);
        } else {
          console.error(err);
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
