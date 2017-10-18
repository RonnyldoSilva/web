(function() {
    'use strict';

    var app = angular.module('app');

    app.controller('TimelineController', function(AuthService, MessageService, NotificationService, PostService) {
        var timelineCtrl = this;
        var content = document.getElementById("content");
        var alreadyRequested = false;

        timelineCtrl.user = AuthService.getCurrentUser();
        timelineCtrl.refreshTimeline = false;
        timelineCtrl.isLoadingPosts = false;

        content.onscroll = function onscroll() {
            var screenPosition = content.scrollTop + content.offsetHeight;
            var maxHeight = content.scrollHeight;
            var proportion = screenPosition/maxHeight;

            if (proportion >= 0.75 && !alreadyRequested) {
                alreadyRequested = true;
                timelineCtrl.isLoadingPosts = true;

                timelineCtrl.loadMorePosts().then(function success() {
                    alreadyRequested = false;
                    timelineCtrl.isLoadingPosts = false;
                }, function error() {
                    alreadyRequested = false;
                });
            }
        };

        timelineCtrl.showRefreshTimelineButton = function showRefreshTimelineButton() {
           return timelineCtrl.refreshTimeline;
        };

        timelineCtrl.setRefreshTimelineButton = function setRefreshTimelineButton() {
            timelineCtrl.refreshTimeline = !timelineCtrl.refreshTimeline;
        };

        timelineCtrl.load = function load(posts) {
            PostService.get().then(function success(response) {
                posts.splice(0, posts.length);
                _.forEach(response.data, function(post) {
                    posts.push(post);
                });
                timelineCtrl.setRefreshTimelineButton();
            }, function error(response) {
                MessageService.showToast(response.data.msg);
            });
        };

        (function main() {
            NotificationService.watchPostNotification(timelineCtrl.user.key, timelineCtrl.setRefreshTimelineButton);
        })();
    });

    app.directive("postTimeline", function() {
        return {
            restrict: 'E',
            templateUrl: "app/post/timeline.html",
            controller: "TimelineController",
            controllerAs: "timelineCtrl",
            scope: {
                institution: '=',
                user: '=',
                addPost: '='
            },
            bindToController: {
                posts: '=',
                loadMorePosts: '='
            }
        };
    });
})();