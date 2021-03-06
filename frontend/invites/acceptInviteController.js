(function() {
    'use strict';

    var app = angular.module('app');

    app.controller("AcceptInviteController", function AcceptInviteController(
            InviteService, $stateParams, $state, AuthService) {
        var controller = this;

        var invite_id = $stateParams.id;

        controller.invite = {};

        controller.loading = false;

        controller.displayLoading = function displayLoading() {
            controller.loading = true;
            controller.cancelSignup();
        };

        controller.goToHome = function goToHome() {
            $state.go("app.user.home");
        };

        controller.signin = function signin() {
            if (AuthService.isLoggedIn()) {
                $state.go("new_invite", {key: invite_id});
            } else {
                $state.go('signin');
            }
        };
        
        controller.cancelSignup = function cancelSignup() {
            controller.signup = false;
        };

        controller.errorHandler = function errorHandler(error) {
            controller.loading = false;
        };
        
        (function main() {
            InviteService.getInvite(invite_id).then(function(response) {
                controller.invite = response.data;
                if (controller.invite.status === "accepted") {
                    $state.go("signin");
                }
            });
        })();
    });
})();