var express = require('express');
var router = express.Router();
//var api = require('./api');

router.get('/', function(req, res, next) {
    var tags = req._parsedOriginalUrl.pathname.substring(1);
    console.log(tags);
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

    var list=  getConfig('list.json');

    var outputs = {};
    var jsonCount = 0;
    for(var i = 0; i < list.length; i++) {
        if (list[i].tag == tags) {
            jsonCount++;
            outputs[i] = list[i];
        }
    }

    if(jsonCount == 0) {
        outputs = [{
            "name" : "EMPTY"
        }]
    }

    res.render('index_specific', {tagged_list: outputs});

});

module.exports = router;
/**
 * Created by zlwaterfield on 15-07-26.
 */
