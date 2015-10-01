'use strict';

/**
 * @ngdoc function
 * @name jawa.controller:ItemCtrl
 * @description
 * # ItemCtrl
 * Controller of the jawa
 */
angular.module('jawa')
  .controller('ItemCtrl',function($scope, $http, Item) {
    var u = window.location.pathname;
    var id = u.substring(u.indexOf('item') + 5);
    var url = '/api/item/' + id;

    Item.query(url).then(function (data) {
        $scope.item = data[0];
    });

    $scope.backToExplore = function() {
        window.location = '/explore/' + search;
    }
  });
