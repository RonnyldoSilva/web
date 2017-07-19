(function() {
    "use strict";
    var app = angular.module("app");

    app.service("InstitutionService", function InstitutionService($http, $q) {
        var service = this;

        var INSTITUTIONS_URI = "/api/institutions";

        service.getInstitutions = function getInstitutions() {
            var deferred = $q.defer();
            $http.get(INSTITUTIONS_URI).then(function success(response) {
                deferred.resolve(response);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        };

        service.searchInstitutions = function searchInstitutions(name) {
            var deferred = $q.defer();
            $http.get("api/search/institution: " + name + " AND active").then(function success(response) {
                deferred.resolve(response);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        };

        service.follow = function follow(institution_key) {
            var deferred = $q.defer();
            $http.post(INSTITUTIONS_URI + "/" + institution_key + "/followers").then(function success(response) {
                deferred.resolve(response);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        };

        service.unfollow = function unfollow(institution_key) {
            var deferred = $q.defer();
            $http.delete(INSTITUTIONS_URI + "/" + institution_key + "/followers").then(function success(response) {
                deferred.resolve(response);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        };

        service.getTimeline = function getInstitutions(institution_key) {
            var deferred = $q.defer();
            $http.get(INSTITUTIONS_URI + "/" + institution_key + "/timeline").then(function success(response) {
                deferred.resolve(response);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        };

        service.getMembers = function getMembers(institution_key) {
            var deferred = $q.defer();
            $http.get(INSTITUTIONS_URI + "/" + institution_key + "/members").then(function success(response) {
                deferred.resolve(response);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        };

        service.getFollowers = function getFollowers(institution_key) {
            var deferred = $q.defer();
            $http.get(INSTITUTIONS_URI + "/" + institution_key + "/followers").then(function success(response) {
                deferred.resolve(response);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        };

        service.getInstitution = function getInstitution(institution_key) {
            var deferred = $q.defer();
            $http.get(INSTITUTIONS_URI + "/" + institution_key).then(function success(response) {
                deferred.resolve(response);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        };

        service.createInstitution = function createInstitution(institution) {
            var deferred = $q.defer();
            $http.post(INSTITUTIONS_URI, institution).then(function success(response) {
                deferred.resolve(response);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        };
    });
})();