'use strict';

(describe('Test SurveyDirective', function() {
    beforeEach(module('app'));

    var surveyCtrl, post, httpBackend, scope, deffered, mdDialog, rootScope, postService, mdToast, http, imageService;
    var user = {
        name: 'name',
        current_institution: {key: "institutuion_key"},
        state: 'active'
    };
    var option_empty = {'text': '',
                        'number_votes': 0,
                        'voters': []
                        };

    var options = [{'id' : 0,
                    'text': 'Option number 1',
                    'number_votes': 0,
                    'voters': [] },
                    {'id': 1,
                    'text': 'Option number 2',
                    'number_votes': 0,
                    'voters': [] }];

    var survey = { 'title' : 'The Survey',
                    'type_survey' : 'multiple_choice',
                    'deadline': new Date(),
                    'options': options
                    };

    beforeEach(inject(function($controller, $httpBackend, $http, $q, $mdDialog,
            PostService, AuthService, $mdToast, $rootScope) {
        scope = $rootScope.$new();
        httpBackend = $httpBackend;
        rootScope = $rootScope;
        deffered = $q.defer();
        mdDialog = $mdDialog;
        postService = PostService;
        mdToast = $mdToast;
        http = $http;
        AuthService.login(user);

        surveyCtrl = $controller('SurveyDirectiveController', {
            scope: scope,
            imageService : imageService,
            $rootScope: rootScope,
            $scope: scope
        });

        surveyCtrl.user = user;
        surveyCtrl.posts = [];
        surveyCtrl.post = survey;
        surveyCtrl.options = options;

        httpBackend.when('GET', 'main/main.html').respond(200);
        httpBackend.when('GET', 'home/home.html').respond(200);
        httpBackend.when('GET', 'auth/login.html').respond(200);
    }));

    afterEach(function() {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });

    describe('Save survey', function() {
        it('should create survey post', function(done) {
            spyOn(postService, 'createPost').and.callThrough();
            spyOn(surveyCtrl, 'resetSurvey');
            spyOn(mdDialog, 'hide');

            surveyCtrl.post = survey;
            surveyCtrl.options = options;
            surveyCtrl.multipleChoice = true;

            var survey_obj = new Post(surveyCtrl.post, surveyCtrl.user.current_institution.key);
            var promise = surveyCtrl.save([]);
            httpBackend.expect('POST', "/api/posts").respond(survey_obj);

            promise.should.be.fulfilled.then(function() {
                expect(postService.createPost).toHaveBeenCalledWith(survey_obj);
                expect(surveyCtrl.resetSurvey).toHaveBeenCalled();
                expect(mdDialog.hide).toHaveBeenCalled();
            }).should.notify(done);
            httpBackend.flush();
            scope.$apply();
        });
    });

    describe('resetSurvey()', function() {
        it('should change the current post instance to an empty object', function() {
            surveyCtrl.post = new Post(post, {});
            surveyCtrl.resetSurvey();
            expect(surveyCtrl.post).toEqual({});
        });
    });
}));