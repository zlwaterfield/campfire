'use strict';

/**
 * @ngdoc function
 * @name jawa.controller:ExploreCtrl
 * @description
 * # ExploreCtrl
 * Controller of the jawa
 */
angular.module('jawa')
  .controller('ExploreCtrl',function($scope, $http) {
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

        $http.get('/api/tag_btns').
            success(function(data, status, headers, config) {
                $scope.unused_buttons = data;
            });

        $scope.parsedUrl(window.location.search, null, null, false, function(urlObj) {

            for(var keys = Object.keys(urlObj), i = 0, end = keys.length; i < end; i++) {
                var key = keys[i], value = urlObj[key];

                for(var j = 0; j < $scope.unused_buttons.length; j++) {
                    console.log(key);
                    if(key == $scope.unused_buttons[j].name) {
                        $scope.addToSearch($scope.unused_buttons[j]);
                    }
                }
                $scope.userStat[i] = urlObj[key];
            }

            $scope.buildUrl(urlObj, function(url) {
                $http.get(url).
                    success(function(data, status, headers, config) {
                        $scope.tagged_l = data;
                        $scope.loading = false;
                    }).
                    error(function(data, status, headers, config) {
                    });
            });
        });
    };

    $scope.paramUpdate = function(newKey, newValue) {
        $scope.loading = true;
        $scope.tagged_l = {};

        $scope.parsedUrl(window.location.search, newKey, newValue, false, function(urlObj) {

            $scope.buildUrl(urlObj, function(url) {
                $http.get(url).
                    success(function(data, status, headers, config) {
                        $scope.tagged_l = data;
                        $scope.loading = false;
                    }).
                    error(function(data, status, headers, config) {
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
        console.log(veg);
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

    //$scope.clearTags = function () {
    //    window.history.pushState('', 'Jawa1', '/');
    //    $scope.paramUpdate(null, null);
    //};

    $scope.removeTag = function(tag) {
        $scope.loading = true;
        $scope.tagged_l = {};

        $scope.parsedUrl(window.location.search, tag.name, null, true, function(urlObj){

            $scope.buildUrl(urlObj, function(url) {
                $http.get(url).
                    success(function(data, status, headers, config) {
                        $scope.tagged_l = data;
                        $scope.loading = false;
                    }).
                    error(function(data, status, headers, config) {
                    });
            });

        });
        for(var i in $scope.curr_buttons) {
            if($scope.curr_buttons[i].id == tag.id) {
                $scope.curr_buttons.splice(i,1);
                $scope.unused_buttons.push(tag);
            }
        }
        for(var i in $scope.curr_dates_buttons) {
            if($scope.curr_dates_buttons[i].id == tag.id) {
                $scope.curr_dates_buttons.splice(i,1);
                $scope.unused_buttons.push(tag);
            }
        }
    };

    $scope.buildUrl = function (urlObj, callback) {

        var builtUrl ='/explore/?';
        for(var keys = Object.keys(urlObj), i = 0, end = keys.length; i < end; i++) {
            var key = keys[i], value = urlObj[key];

            builtUrl += key + '=' + value;

            if(i != keys.length -1) {
                builtUrl += '&&';
            }
        }

        window.history.pushState('', 'Jawa1', builtUrl);
        var search = window.location.search;
        var url = '/api/' + search;

        callback(url);
    };

    $scope.parsedUrl = function (url, newKey, newValue, remove, callback) {
        var searchObject = {};
        var parser = document.createElement('a');
        parser.href = url;

        $http.get('/api/tags').
            success(function(data, status, headers, config) {
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
            }).
            error(function(data, status, headers, config) {
            });
    };
    $scope.onLoad();

  });
