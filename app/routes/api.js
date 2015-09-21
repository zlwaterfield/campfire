var fs = require("fs");

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

var all =  getConfig('json/all.json');
var tags =  getConfig('json/tags.json');
var btns =  getConfig('json/tag_btns.json');

exports.getByTag = function(req, res) {

    var pCount = 0;
    for(var t in req.query) {
        if(t != 'all') {
            pCount++;
        }
    }

    var query_all = req.query;
    var tags_array = [];
    var m = 0;

    for(var q in query_all) {
        tags_array[m] = query_all[q];
        m++;
    }

    var outputs = {};
    var jsonCount = 0;
    var p2Count = 0;

    // calc number of not all's (pCount)
    // count variable to keep track (p2Count)
    // if count == tags - alls put in output

    for(var i = 0; i < all.length; i++) {
        for(var j = 0; j < tags_array.length; j++) {
            for(var k = 0; k < all[i].tag.length; k++) {
                if (all[i].tag[k] == tags_array[j]) {
                    jsonCount++;
                    outputs[i] = all[i];

                }
            }
        }
    }

    if(jsonCount == 0) {
        outputs = all;
    }

    res.send(outputs);
};

exports.getListOfTags = function(req, res) {
    res.send(tags);
};

exports.getTagBtns = function(req, res) {
    res.send(btns);
};


exports.getItem = function(req, res) {
    var id = req.params.id;
    var item = {};

    for(var i = 0; i < all.length; i++) {
        if(all[i].id == id) {
            item = all[i];
        }
    }
    res.send(item);
};