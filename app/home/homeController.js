'use strict';

(function() {
    var app = angular.module("app");

    app.controller("HomeController", function HomeController(PostService, AuthService,
            InstitutionService, $interval, $mdToast, $mdDialog, $state, MessageService) {
        var homeCtrl = this;

        var ACTIVE = "active";

        homeCtrl.posts = [];
        homeCtrl.followingInstitutions = [];
        homeCtrl.instMenuExpanded = false;

        homeCtrl.user = AuthService.getCurrentUser();

        homeCtrl.goToInstitution = function goToInstitution(institutionKey) {
            $state.go('app.institution', {institutionKey: institutionKey});
        };

        homeCtrl.newPost = function newPost(event) {
            $mdDialog.show({
                controller: function() {},
                controllerAs: "controller",
                templateUrl: 'home/post_dialog.html',
                parent: angular.element(document.body),
                targetEvent: event,
                clickOutsideToClose: true,
                openFrom: '#fab-new-post',
                closeTo: angular.element(document.querySelector('#fab-new-post')),
                locals: {
                    user: homeCtrl.user,
                    posts: homeCtrl.posts
                },
                bindToController: true
            });
        };

        homeCtrl.expandInstMenu = function expandInstMenu(){
            homeCtrl.instMenuExpanded = !homeCtrl.instMenuExpanded;
        };

        homeCtrl.isActive = function isActive(institution) {
            return institution.state === ACTIVE;
        };

        function getFollowingInstitutions(){
            homeCtrl.followingInstitutions = homeCtrl.user.follows;
        }

        var loadPosts = function loadPosts() {
            PostService.get().then(function success(response) {
                homeCtrl.posts = response.data;
            }, function error(response) {
                MessageService.showToast(response.data.msg);
            });
        };

        loadPosts();
        getFollowingInstitutions();
    });
})();