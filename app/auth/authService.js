'use strict';

(function() {
    var app = angular.module("app");

    app.service("AuthService", function AuthService($q, $state, $firebaseAuth, $window, UserService, MessageService, ngClipboard) {
        var service = this;

        var authObj = $firebaseAuth();

        var userInfo;

        /**
        * Store listeners to be executed when user logout is called.
        */
        var onLogoutListeners = [];

        Object.defineProperty(service, 'user', {
            get: function() {
                return userInfo;
            }
        });

        service.setupUser = function setupUser(idToken) {
            var deferred = $q.defer();
            var userToken = {
                accessToken : idToken
            };

            userInfo = userToken;

            UserService.load().then(function success(userLoaded) {
                configUser(userLoaded, userToken);
                deferred.resolve(userInfo);
            }, function error(error) {
                MessageService.showToast(error);
                deferred.reject(error);
            });
            return deferred.promise;
        };

        service.login = function login() {
            var deferred = $q.defer();
            authObj.$signInWithPopup("google").then(function(result) {
                result.user.getIdToken(true).then(function(idToken) {
                    service.setupUser(idToken).then(function success(userInfo) {
                        deferred.resolve(userInfo);
                    });
                });
            }).catch(function(error) {
                MessageService.showToast(error);
                deferred.reject(error);
            });
            return deferred.promise;
        };

        service.loginWithEmailAndPassword = function loginWithEmailAndPassword(email, password) {
            var deferred = $q.defer();
            authObj.$signInWithEmailAndPassword(email, password).then(function(user) {
                user.getIdToken(true).then(function(idToken) {
                    service.setupUser(idToken).then(function success(userInfo) {
                        deferred.resolve(userInfo);
                    });
                });
            }).catch(function(error) {
                MessageService.showToast(error);
                deferred.reject(error);
            });
            return deferred.promise;
        };

        service.signupWithEmailAndPassword = function signupWithEmailAndPassword(email, password) {
            var deferred = $q.defer();
            authObj.$createUserWithEmailAndPassword(email, password).then(function(result) {
                var idToken = result.toJSON().stsTokenManager.accessToken;
                service.setupUser(idToken).then(function success(userInfo) {
                    deferred.resolve(userInfo);
                });
            }).catch(function(error) {
                MessageService.showToast(error);
                deferred.reject(error);
            });
            return deferred.promise;
        };

        service.logout = function logout() {
            authObj.$signOut();
            delete $window.localStorage.userInfo;
            userInfo = undefined;

            executeLogoutListeners();
        };

        service.getCurrentUser = function getCurrentUser() {
            return userInfo;
        };

        service.getUserToken = function getUserToken() {
            return userInfo.accessToken;
        };

        service.tokenToClipboard = function tokenToClipboard() {
            ngClipboard.toClipboard(userInfo.accessToken);
        };

        service.isLoggedIn = function isLoggedIn() {
            if (userInfo) {
                return true;
            }
            return false;
        };

        service.save = function() {
            $window.localStorage.userInfo = JSON.stringify(userInfo);
        };

        service.reload = function reload() {
            var deferred = $q.defer();
            UserService.load().then(function success(userLoaded) {
                var userToken = {
                    accessToken : userInfo.accessToken
                };
                configUser(userLoaded, userToken);
                deferred.resolve(userInfo);
            }, function error(error) {
                MessageService.showToast(error);
                deferred.reject(error);
            });
            return deferred.promise;
        };

        service.$onLogout = function $onLogout(callback) {
            onLogoutListeners.push(callback);
        };

        authObj.$onAuthStateChanged(function(firebaseUser) {
            if (!firebaseUser) {
                $state.go("signin");
            }
        });

        /**
        * Execute each function stored to be thriggered when user logout
        * is called.
        */
        function executeLogoutListeners() {
            _.each(onLogoutListeners, function(callback) {
                callback();
            });
        }

        function configUser(userLoaded, userToken) {
            userInfo = new User(userLoaded);
            _.extend(userInfo, userToken);
            $window.localStorage.userInfo = JSON.stringify(userInfo);
        }

        function init() {
            if ($window.localStorage.userInfo) {
                var parse = JSON.parse($window.localStorage.userInfo);
                userInfo = new User(parse);
            }
        }

        init();
    });
})();