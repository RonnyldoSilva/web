'use strict';

(describe('Test LoginController', function() {

    var logginCtrl, httpBackend, scope, createCtrl, state, authService;

    var user = {
        name: 'Tiago',
        state: 'active'
    };

    var institutions = [{
        name: 'Certbio',
        key: '123456789'
    }];

    var posts = [{
        author: 'Mayza Nunes',
        author_key: "111111",
        title: 'Post de Mayza',
        text: 'Lorem ipsum'
    }];

    beforeEach(module('app'));

    beforeEach(inject(function($controller, $httpBackend, $rootScope, $q, $state, AuthService) {
        httpBackend = $httpBackend;
        scope = $rootScope.$new();
        state = $state;
        authService = AuthService;

        httpBackend.when('GET', "main/main.html").respond(200);

        httpBackend.when('GET', "home/home.html").respond(200);

        authService.login(user);

        spyOn(authService, 'isLoggedIn').and.callThrough();
        spyOn(state, 'go').and.callThrough();

        createCtrl = function() {
            return $controller('LoginController', {
                scope: scope,
                AuthService: authService
            });
        };
        logginCtrl = createCtrl();
    }));

    afterEach(function() {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });

    describe('main()', function() {

        it('should change state to app.user.home if user is loggedIn', function() {
            expect(authService.isLoggedIn).toHaveBeenCalled();
            expect(state.go).toHaveBeenCalledWith('app.user.home');
        });
    });
}));