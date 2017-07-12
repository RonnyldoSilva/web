(function() {
    'use strict';

    var app = angular.module('app');

    app.controller('PostDetailsController', function(PostService, AuthService, CommentService, $mdToast, $state,
        $mdDialog) {
        var postDetailsCtrl = this;

        postDetailsCtrl.comments = {};

        postDetailsCtrl.savingComment = false;
        postDetailsCtrl.savingLike = false;

        Object.defineProperty(postDetailsCtrl, 'user', {
            get: function() {
                return AuthService.user;
            }
        });

        postDetailsCtrl.deletePost = function deletePost(ev, post, posts) {
            var confirm = $mdDialog.confirm()
                .clickOutsideToClose(true)
                .title('Excluir Post')
                .textContent('Este post será excluído e desaparecerá para os usuários que seguem a instituição.')
                .ariaLabel('Deletar postagem')
                .targetEvent(ev)
                .ok('Excluir')
                .cancel('Cancelar');

            $mdDialog.show(confirm).then(function() {
                PostService.deletePost(post).then(function success() {
                    _.remove(posts, foundPost => foundPost.key === post.key);
                    showToast('Post excluído com sucesso');
                }, function error(response) {
                    showToast(response.data.msg);
                });
            }, function() {
                showToast('Cancelado');
            });
        };

        postDetailsCtrl.isAuthorized = function isAuthorized(post) {
            return isPostAuthor(post) || isInstitutionAdmin(post);
        };

        postDetailsCtrl.isDeleted = function isDeleted(post) {
            return post.state == 'deleted';
        };
 
         postDetailsCtrl.showButtonDelete = function showButtonDelete(post) {
            return postDetailsCtrl.isAuthorized(post) && 
                !postDetailsCtrl.isDeleted(post);
        };
 
        postDetailsCtrl.disableButtonLike = function enableButtonLike(post) {
            return postDetailsCtrl.savingLike || postDetailsCtrl.isDeleted(post);
        };
 
        postDetailsCtrl.showButtonEdit = function showButtonDeleted(post) {
            return postDetailsCtrl.isAuthorized(post) && 
                !postDetailsCtrl.isDeleted(post);
        };

        postDetailsCtrl.likeOrDislikePost = function likeOrDislikePost(post) {
            if(!postDetailsCtrl.isLikedByUser(post)) {
                likePost(post);
            } else {
                dislikePost(post);
            }
        };

        postDetailsCtrl.editPost = function editPost(post, posts, event) {
            $mdDialog.show({
                controller: "EditPostController",
                controllerAs: "editPostCtrl",
                templateUrl: 'home/edit_post.html',
                parent: angular.element(document.body),
                targetEvent: event,
                clickOutsideToClose:true,
                locals: {
                    user : postDetailsCtrl.user,
                    post: post
                }
            }).then(function success(editedPost) {
                var post = _.find(posts, {key: editedPost.key});
                post.title = editedPost.title;
                post.text = editedPost.text;
            });
        };

        function likePost(post) {
            postDetailsCtrl.savingLike = true;
            PostService.likePost(post).then(function success() {
                addPostKeyToUser(post.key);
                post.number_of_likes += 1;
                postDetailsCtrl.savingLike = false;
            }, function error() {
                $state.go('app.home');
                postDetailsCtrl.savingLike = false;
            });
        }

        function dislikePost(post) {
            postDetailsCtrl.savingLike = true;
            PostService.dislikePost(post).then(function success() {
                removePostKeyFromUser(post.key);
                post.number_of_likes -= 1;
                postDetailsCtrl.savingLike = false;
            }, function error() {
                $state.go('app.home');
                postDetailsCtrl.savingLike = false;
            });
        }

        postDetailsCtrl.isLikedByUser = function isLikedByUser(post) {
            var likedPostsKeys = _.map(postDetailsCtrl.user.liked_posts, getKeyFromUrl);
            return _.includes(likedPostsKeys, post.key);
        };

        function addPostKeyToUser(key) {
            postDetailsCtrl.user.liked_posts.push(key);
        }

        function removePostKeyFromUser(key) {
            _.remove(postDetailsCtrl.user.liked_posts, foundPost => getKeyFromUrl(foundPost) === key);
        }

        function getKeyFromUrl(url) {
            var key = url;
            if(url.indexOf("/api/key/") != -1) {
                var splitedUrl = url.split("/api/key/");
                key = splitedUrl[1];
            }
            return key;
        }

        function showToast(msg) {
            $mdToast.show(
                $mdToast.simple()
                    .textContent(msg)
                    .action('FECHAR')
                    .highlightAction(true)
                    .hideDelay(5000)
                    .position('bottom right')
            );
        }

        postDetailsCtrl.goToInstitution = function goToInstitution(institutionKey) {
            $state.go('app.institution', {institutionKey: institutionKey});
        };

        postDetailsCtrl.getComments = function getComments(post) {
            var commentsUri = post.comments;
            CommentService.getComments(commentsUri).then(function success(response) {
                var comments = postDetailsCtrl.comments[post.key];
                if(comments) {
                    postDetailsCtrl.comments[post.key].data = response.data;
                    postDetailsCtrl.comments[post.key].show = !postDetailsCtrl.comments[post.key].show;
                } else {
                    postDetailsCtrl.comments[post.key] =  {'data': response.data, 'show': true, 'newComment': ''};
                }
                post.number_of_comments = _.size(postDetailsCtrl.comments[post.key].data);
            }, function error(response) {
                showToast(response.data.msg);
            });
        };

        postDetailsCtrl.getTextNumberLikes = function textNumberLikes(numberLikes) {
             return numberLikes + ' ' + (numberLikes == 1? 'Curtida' : 'Curtidas');
        };

        postDetailsCtrl.getLikes = function getLikes(post) {
            var likesUri = post.likes;

            postDetailsCtrl.current_post = post.key;
            PostService.getLikes(likesUri).then(function success(response) {
                postDetailsCtrl.likes = response.data;
                postDetailsCtrl.title = post.title;
                $mdDialog.show({
                    controller: 'DialogController',
                    controllerAs: 'dialogCtrl',
                    templateUrl: 'post/likes.html',
                    clickOutsideToClose:true,
                    locals: {
                        likes : response.data,
                        title: post.title
                    }
                });
                post.number_of_likes = _.size(postDetailsCtrl.likes);
            }, function error(response) {
                showToast(response.data.msg);
            });
        };

        var addComment = function addComment(post, comment) {
            var postComments = postDetailsCtrl.comments[post.key].data;
            postComments.push(comment);
            post.number_of_comments += 1;
        };

        postDetailsCtrl.createComment = function createComment(post) {
            var newComment = postDetailsCtrl.comments[post.key].newComment;
            var institutionKey = postDetailsCtrl.user.current_institution.key;
            if (!_.isEmpty(newComment)) {
                postDetailsCtrl.savingComment = true;
                CommentService.createComment(post.key, newComment, institutionKey).then(function success(response) {
                    postDetailsCtrl.comments[post.key].newComment = '';
                    addComment(post, response.data);
                    postDetailsCtrl.savingComment = false;
                }, function error(response) {
                    postDetailsCtrl.savingComment = false;
                    showToast(response.data.msg);
                });
            } else {
                showToast("Comentário não pode ser vazio.");
            }
        };

        postDetailsCtrl.canDeleteComment = function canDeleteComment(post, comment) {
            return isCommentAuthor(comment);
        };

        postDetailsCtrl.deleteComment = function deleteComment(event, post, comment) {
            var confirm = $mdDialog.confirm()
                .clickOutsideToClose(true)
                .title('Excluir Comentário')
                .textContent('Este comentário será excluído e desaparecerá do referente post.')
                .ariaLabel('Deletar comentário')
                .targetEvent(event)
                .ok('Excluir')
                .cancel('Cancelar');

            $mdDialog.show(confirm).then(function() {
                CommentService.deleteComment(post.key, comment.id).then(function success(response) {
                    removeCommentFromPost(post, response.data);
                    showToast('Comentário excluído com sucesso');
                    post.number_of_comments -= 1;
                }, function error(response) {
                    showToast(response.data.msg);
                });
            }, function() {
                showToast('Cancelado');
            });
        };

        postDetailsCtrl.textNumberComment = function textNumberComment(number) {
            var comment = number == 1? 'Comentário' : 'Comentários';
            return number + " " + comment;
        };

        function removeCommentFromPost(post, comment) {
            var postComments = postDetailsCtrl.comments[post.key].data;
            _.remove(postComments, function(postComment) {
                return postComment.id == comment.id;
            });
        }

        function isPostAuthor(post) {
            return post.author_key == postDetailsCtrl.user.key;
        }

        function isCommentAuthor(comment) {
            return comment.author_key == postDetailsCtrl.user.key;
        }

        function isInstitutionAdmin(post) {
            return _.includes(_.map(postDetailsCtrl.user.institutions_admin, getKeyFromUrl), post.institution_key);
        }

        postDetailsCtrl.recognizeUrl =  function recognizeUrl(receivedPost) {
            var post = new Post(receivedPost, receivedPost.institutionKey);
            var exp = /((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gi;
            var urlsInTitle = post.title.match(exp);
            var urlsInText = post.text.match(exp);
            post.title = addHttpsToUrl(post.title, urlsInTitle);
            post.text = addHttpsToUrl(post.text, urlsInText);
            post.title = post.title.replace(exp, "<a href=\"$1\" target='_blank'>$1</a>");
            post.text = post.text.replace(exp,"<a href=\"$1\" target='_blank'>$1</a>");
            return post;
        };

        function addHttpsToUrl(text, urls) {
            if(urls) {
                var https = "https://";
                for (var i = 0; i < urls.length; i++) {
                    if(urls[i].slice(0, 4) != "http") {
                        text = text.replace(urls[i], https + urls[i]);
                    }
                }
            }
            return text;
        }
    });

    app.controller('DialogController', function(likes, title) {
        var dialogCtrl = this;
        dialogCtrl.likes = likes;
        dialogCtrl.postTitle = title;
    });

    app.directive("postDetails", function() {
        return {
            restrict: 'E',
            templateUrl: "post/post_details.html",
            controllerAs: "postDetailsCtrl",
            controller: "PostDetailsController",
            scope: {
                posts: '=',
                institution: '='
            }
        };
    });

    app.controller("EditPostController", function PostController(user, post, $mdDialog, PostService, AuthService, $mdToast) {
        var postCtrl = this;

        postCtrl.user = user;

        // Original post to compare and generate PATCH actions.
        postCtrl.post = new Post(post, postCtrl.user.current_institution.key);

        // Copy of post to edit.
        postCtrl.newPost = new Post(post, postCtrl.user.current_institution.key);

        postCtrl.isPostValid = function isPostValid() {
            if (postCtrl.user) {
                return postCtrl.newPost.isValid();
            } else {
                return false;
            }
        };

        postCtrl.editPost = function editPost() {
            if (postCtrl.newPost.isValid()) {
                PostService.save(postCtrl.post, postCtrl.newPost).then(function success() {
                    showToast('Publicação editada com sucesso!');
                    $mdDialog.hide(postCtrl.newPost);
                }, function error(response) {
                    $mdDialog.cancel();
                    showToast(response.data.msg);
                });
            } else {
                showToast('Edição inválida!');
            }
        };

        postCtrl.cancelDialog = function() {
            $mdDialog.cancel();
        };

        function showToast(msg) {
            $mdToast.show(
                $mdToast.simple()
                    .textContent(msg)
                    .action('FECHAR')
                    .highlightAction(true)
                    .hideDelay(5000)
                    .position('bottom right')
            );
        }
    });
})();