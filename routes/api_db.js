"use strict";

let cassandraDriver = require('cassandra-driver');
let cassandraClient = new cassandraDriver.Client({
    contactPoints: ['45.55.153.170'],
    keyspace: 'campfire'
});

let schema = {
    conferences: {
        tableName: 'conferences',
    
        primaryKeyColumnType: {
            CATEGORY: 0,
            DATE_START: 1,
            GEOHASH: 2,
            PRICE_CURRENT: 3,
        },
        
        primaryKeyColumns: [
            {
                shortStringValue: 'cat',
                stringValue: 'category'
            },
            {
                shortStringValue: 'date',
                stringValue: 'date_start'
            },
            {
                shortStringValue: 'geo',
                stringValue: 'geohash'
            },
            {
                shortStringValue: 'price',
                stringValue: 'price_current'
            }
        ]
    }
};

/*============================================
                GETS
 ============================================*/

exports.getConferences = function(req, res) {
    let category = parseInt(req.params.cat);
    if (!category) {
        res.status(400).send('TODO: Report error; Category is required');
        return;
    }
    
    console.time('validate request');
    let requestQuery = req.query;
    
    console.warn('TODO: Validate request query parameters');
    let date = requestQuery['date'];
    let dateAfter = requestQuery['after'];
    let dateBefore = requestQuery['before'];
    
    let geohashNear = requestQuery['near'];
    let geohashSearchRadius = requestQuery['within'];
    
    let price = parseFloat(requestQuery['price']);
    let priceOver = parseFloat(requestQuery['over']);
    let priceUnder = parseFloat(requestQuery['under']);
    
    let pageState = requestQuery['page'];
    console.timeEnd('validate request');
    
    console.time('check query parameters');
    let primaryKeyColumnType = schema.conferences.primaryKeyColumnType;
    
    let columns = {
        // Category always needs to be specified first
        equalityColumns: [[primaryKeyColumnType.CATEGORY, category]],
        inequalityColumnTypes: [],
        unspecifiedColumnTypes: []
    };
    
    {
        // Check for date
        let columnType = primaryKeyColumnType.DATE_START;
        
        if (date) {
            columns.equalityColumns.push([columnType, date]);
        } else if (dateAfter || dateBefore) {
            columns.inequalityColumnTypes.push(columnType);
        } else {
            columns.unspecifiedColumnTypes.push(columnType);
        }
    }
    
    {
        // Check for price
        let columnType = primaryKeyColumnType.PRICE_CURRENT;
        
        if (price) {
            columns.equalityColumns.push([columnType, price]);
        } else if (priceOver || priceUnder) {
            columns.inequalityColumnTypes.push(columnType);
        } else {
            columns.unspecifiedColumnTypes.push(columnType);
        }
    }
    
    {
        // Check for geohash
        let columnType = primaryKeyColumnType.GEOHASH;
        
        if (geohashNear) {
            if (geohashSearchRadius) {
                console.warn('TODO: Handle geohash search radius');
                columns.inequalityColumnTypes.push(columnType);
            } else {
                columns.equalityColumns.push([columnType, geohashNear]);
            }
        } else {
            columns.unspecifiedColumnTypes.push(columnType);
        }
    }
    console.timeEnd('check query parameters');
    
    console.time('prepare statement');
    let statementContext = prepareStatement(schema.conferences, columns, function(columnType, parametersGreaterThanOrEqual, parametersLessThanOrEqual) {
        switch (columnType) {
            case primaryKeyColumnType.DATE_START: {
                parametersGreaterThanOrEqual.push(dateAfter || 0);
                parametersLessThanOrEqual.push(dateBefore || Number.MAX_SAFE_INTEGER);
                break;
            }
            case primaryKeyColumnType.GEOHASH: {
                console.warn('TODO: Use proper geohash bounds');
                parametersGreaterThanOrEqual.push(geohashNear);
                parametersLessThanOrEqual.push(geohashNear);
                break;
            }
            case primaryKeyColumnType.PRICE_CURRENT: {
                parametersGreaterThanOrEqual.push(priceOver || 0);
                parametersLessThanOrEqual.push(priceUnder || Number.MAX_SAFE_INTEGER);
                break;
            }
            default: {
                // Do nothing
            }
        }
    });
    console.timeEnd('prepare statement');
    
    console.time('construct statement');
    let statement = 'SELECT * FROM ' + statementContext.tableName;
    if (statementContext.statementPredicates.length > 0) {
        statement += ' WHERE ' + statementContext.statementPredicates.join(' AND ');
    }
    console.timeEnd('construct statement');
    
    console.log(statement);
    console.log(statementContext);
    
    console.time('execute statement');
    cassandraClient.execute(statement, statementContext.statementParameters, {fetchSize: 100, pageState: pageState, prepare: true}, function (err, result) {
        console.timeEnd('execute statement');
        
        if(!err) {
            let rows = result.rows;
            
            if (columns.inequalityColumnTypes.length > 0) {
                rows = rows.filter(function(row) {
                    // Filter by date
                    let isMatch = (!dateAfter || (row.date_end >= Date.parse(dateAfter))) && (!dateBefore || (row.date_end <= Date.parse(dateBefore)));
                    
                    // Filter by price
                    isMatch = isMatch && (!priceOver || (priceOver <= row.price_current)) && (!priceUnder || (row.price_current <= priceUnder));
                    
                    if (isMatch && geohashNear && geohashSearchRadius) {
                        // Filter by geohash
                        console.warn('TODO: Handle geohash search radius');
                        let geohash = row.geohash;
                        isMatch = (geohash == geohashNear);
                    }
                    
                    return isMatch;
                });
            }
            
            let responsePayload = {r: rows};
            
            let resultPageState = result.pageState;
            if (resultPageState) {
                responsePayload['p'] = resultPageState;
            }
            
            res.send(responsePayload);
        } else {
            console.error(err);
            res.status(500).send(err.message);
        }
    });
};

exports.getConferenceByID = function(req, res) {
    let id = req.params.id;
    
    let statement = 'SELECT * FROM ' + schema.conferences.tableName + ' WHERE event_id=?';
    let statementParams = [id];
    
    console.time('execute statement');
    cassandraClient.execute(statement, statementParams, {prepare: true}, function (err, result) {
        console.timeEnd('execute statement');
        
        if(!err) {
            res.send(result.rows);
        } else {
            console.error(err);
            res.status(500).send(err.message);
        }
    });
};

function prepareStatement(tableSchema, columns, inequalityColumnHandler) {
    let context = {
        tableName: null,
        statementPredicates: [],
        statementParameters: []
    };
    
    let tableNameSuffixes = [];
    
    function appendEqualityColumn(column, value) {
        tableNameSuffixes.push(column.shortStringValue);
        context.statementPredicates.push(column.stringValue + '=?');
        context.statementParameters.push(value);
    };
    
    let primaryKeyColumnType = tableSchema.primaryKeyColumnType;
    let primaryKeyColumns = tableSchema.primaryKeyColumns;
    
    columns.equalityColumns.forEach(function(e) {
        let columnType = e[0];
        let value = e[1];
        
        appendEqualityColumn(primaryKeyColumns[columnType], value);
    });
    
    let inequalityColumnTypes = columns.inequalityColumnTypes;
    if (inequalityColumnTypes.length > 0) {
        // Construct and specify tuple inequalities
        let tupleInequalityColumns = [];
        let tupleparametersGreaterThanOrEqual = [];
        let tupleparametersLessThanOrEqual = [];
        
        inequalityColumnTypes.forEach(function(columnType) {
            let column = primaryKeyColumns[columnType];
            
            tableNameSuffixes.push(column.shortStringValue);
            tupleInequalityColumns.push(column.stringValue);
            
            inequalityColumnHandler(columnType, tupleparametersGreaterThanOrEqual, tupleparametersLessThanOrEqual);
        });
        
        if (tupleInequalityColumns.length > 0) {
            let tupleInequalityColumnsString = '(' + tupleInequalityColumns.join(',') + ')';
            let tupleInequalityParametersString = '(' + Array(tupleInequalityColumns.length).fill('?') + ')';
        
            if (tupleparametersGreaterThanOrEqual.length > 0) {
                context.statementPredicates.push(tupleInequalityColumnsString + '>=' + tupleInequalityParametersString);
                context.statementParameters = context.statementParameters.concat(tupleparametersGreaterThanOrEqual);
            }
        
            if (tupleparametersLessThanOrEqual.length > 0) {
                context.statementPredicates.push(tupleInequalityColumnsString + '<=' + tupleInequalityParametersString);
                context.statementParameters = context.statementParameters.concat(tupleparametersLessThanOrEqual);
            }
        }
    }
    
    // Append the unspecified primary key columns to the end of the table name
    columns.unspecifiedColumnTypes.forEach(function(columnType) {
        let column = primaryKeyColumns[columnType];
        
        tableNameSuffixes.push(column.shortStringValue);
    });
    
    let tableName = tableSchema.tableName;
    if (tableNameSuffixes.length > 0) {
        tableName += '_' + tableNameSuffixes.join('_');
    }
    
    context.tableName = tableName;
    
    return context;
}
