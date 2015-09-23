'use strict';

/**
 * @ngdoc function
 * @name jawa.cactory:ListingsCtrl
 * @description
 * # ListingsCtrl
 * Factory of the jawa
 */
angular.module('jawa')
  .factory('Item', function($http, $q) {
    return {
      query: function(url) {

        var deferred = $q.defer();
        
        $http.get(url)
          .success(function(data) {
            deferred.resolve(data);
          }).
          error(function(data) {
            deferred.reject(data);
          });
          return deferred.promise;
      }
    }
  });
