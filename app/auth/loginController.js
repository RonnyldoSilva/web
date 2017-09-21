'use strict';

(function() {
    var app = angular.module("app");
    
    app.controller("LoginController", function LoginController(AuthService, MessageService, $state) {
        var loginCtrl = this;

        loginCtrl.user = {};

        loginCtrl.newUser = {};

        loginCtrl.login = function login() {
            var promise = AuthService.login();
            promise.then(function success() {
                $state.go("app.home");
            });
            return promise;
        };

        loginCtrl.limpar = function limpar() {
            loginCtrl.user = {};
        };

        loginCtrl.loginWithEmailPassword = function loginWithEmailPassword() {
            AuthService.loginWithEmailAndPassword(loginCtrl.user.email, loginCtrl.user.password).then(
                function success() {
                    $state.go("app.home");
                }
            );
        };

        loginCtrl.signup = function signup() {
            var newUser = loginCtrl.newUser;
            if (newUser.password !== newUser.verifypassword) {
                MessageService.showToast("Senhas incompatíveis");
                return;
            }
            AuthService.signupWithEmailAndPassword(newUser.email, newUser.password).then(function success(user) {
                var pendingInvite = user.getPendingInvitation();
                if (pendingInvite) {
                    var inviteKey = pendingInvite.key;
                    $state.go("new_invite", {key: inviteKey});
                } else if (user.isInactive()) {
                    $state.go("user_inactive");
                } 
            });
        };

        (function main() {
            if (AuthService.isLoggedIn()) {
                $state.go("app.home");
            }
        })();
    });
})();