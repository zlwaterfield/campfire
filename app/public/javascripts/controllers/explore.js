'use strict';

/**
 * @ngdoc function
 * @name jawa.controller:ExploreCtrl
 * @description
 * # ExploreCtrl
 * Controller of the jawa
 */
angular.module('jawa')
  .controller('ExploreCtrl',function($scope, $http, Ajax, _) {
    $scope.loading = true;
    $scope.curr_buttons = [];
    $scope.curr_dates_buttons = [];
    $scope.unused_buttons = [];
    $scope.tagged_l = {};
    $scope.userStat = {};
    $scope.date = {};
    $scope.useClear = false;

    $scope.goToItem = function(id) {
        window.location = '/item/' + id;
    };

    $scope.onLoad = function () {

        Ajax.query('/api/tag_btns').then(function (data) {
            $scope.unused_buttons = data;
        });

        $scope.parsedUrl(window.location.search, null, null, false, function(urlObj) {
            var counter = 0;
            _.map(urlObj, function(value, key) {
                for(var j = 0; j < $scope.unused_buttons.length; j++) {
                    if(key == $scope.unused_buttons[j].name) {
                        $scope.addToSearch($scope.unused_buttons[j]);
                    }
                }
                $scope.userStat[counter] = value;
                counter++;
            })

            $scope.buildUrl(urlObj, function(url) {
                Ajax.query(url).then(function (data) {
                    $scope.tagged_l = data;
                    $scope.loading = false;
                });
            });
        });
    };

    $scope.paramUpdate = function(newKey, newValue) {
        $scope.loading = true;
        $scope.tagged_l = {};

        $scope.parsedUrl(window.location.search, newKey, newValue, false, function(urlObj) {

            $scope.buildUrl(urlObj, function(url) {
                Ajax.query(url).then(function (data) {
                    $scope.tagged_l = data;
                    $scope.loading = false;
                });
            });
        });
    };

    $scope.dateChanged = function () {
        var date = $scope.date.currentDate;
        var ISODate = date.toISOString().substring(0,10);
        $scope.paramUpdate('date',ISODate);
    };

    $scope.addToSearch = function (veg) {
        for(var i in $scope.unused_buttons) {
            if($scope.unused_buttons[i].id == veg.id) {
                if(veg.name == 'date') {
                    $scope.curr_dates_buttons.push(veg);
                } else {
                    $scope.curr_buttons.push(veg);
                }
                $scope.unused_buttons.splice(i,1);
            }
        }
    };

    $scope.removeTag = function(tag) {
        $scope.loading = true;
        $scope.tagged_l = {};

        $scope.parsedUrl(window.location.search, tag.name, null, true, function(urlObj){

            $scope.buildUrl(urlObj, function(url) {
               Ajax.query(url).then(function (data) {
                    $scope.tagged_l = data;
                    $scope.loading = false;
                });
            });

        });
        _.map($scope.curr_buttons, function(obj, index) {
            if(obj.id == tag.id) {
                $scope.curr_buttons.splice(index,1);
                $scope.unused_buttons.push(tag);
            }
        })
        _.map($scope.curr_dates_buttons, function(obj, index) {
            if(obj.id == tag.id) {
                $scope.curr_dates_buttons.splice(index,1);
                $scope.unused_buttons.push(tag);
            }
        })
    };

    $scope.buildUrl = function (urlObj, callback) {

        var builtUrl ='/explore/?';
        var type = 'cat1';
        for(var keys = Object.keys(urlObj), i = 0, end = keys.length; i < end; i++) {
            var key = keys[i], 
                value = urlObj[key];

            builtUrl += key + '=' + value;

            if(i != keys.length -1) {
                builtUrl += '&&';
            }
            if(key == 'type') {
                type = value;
            }
        }

        window.history.pushState('', 'Jawa1', builtUrl);
        var search = window.location.search;
        var url = '/api/conferences/' + type + search;
        callback(url);
    };

    $scope.parsedUrl = function (url, newKey, newValue, remove, callback) {
        var searchObject = {};
        var parser = document.createElement('a');
        parser.href = url;

       Ajax.query(url).then(function (data) {
            var present = false;
            var queries = parser.search.replace(/^\?/, '').split('&');

            for(var i = 0; i < queries.length; i++) {
                var split = queries[i].split('=');
                if(remove == true && split[0] == newKey){
                    delete searchObject[split[0]];
                } else if(split[0] == newKey) {
                    searchObject[split[0]] = newValue;
                    present = true
                } else {
                    searchObject[split[0]] = split[1];
                }
            }
            if(present == false && remove == false && newKey != null) {
                searchObject[newKey] = newValue;
            }

            for(var j in searchObject) {
                if(searchObject[j] === undefined) {
                    delete searchObject[j];
                }
            }

            return callback(searchObject);
        });
    };
    $scope.onLoad();

  });
