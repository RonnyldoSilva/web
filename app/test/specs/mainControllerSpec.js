'use strict';

(describe('Test MainController', function() {
    var mainCtrl, httpBackend, scope, createCtrl, state, instService, authService;
    var mayza = {
        name: 'Mayza',
        key: 'user-key',
        invites: [{
            'invitee': 'user@email.com',
            'suggestion_institution_name': "Suggested Name",
            'type_of_invite': "institution",
            'status': 'sent'
        }]
    };
    var certbio = {
        name: 'Certbio',
        key: '123456789',
        admin: mayza.key

    };
    var splab = {
        name: 'Splab',
        key: '1239'
    };
    mayza.institutions = [certbio.key, splab.key];
    mayza.institutions_admin = [certbio.key];
    mayza.current_institution = certbio;

    beforeEach(module('app'));

    beforeEach(inject(function($controller, $httpBackend, $rootScope, $state, AuthService, InstitutionService) {
        httpBackend = $httpBackend;
        scope = $rootScope.$new();
        state = $state;
        instService = InstitutionService;
        authService = AuthService;

        authService.getCurrentUser = function() {
            return new User(mayza);
        };

        httpBackend.when('GET', "main/main.html").respond(200);
        httpBackend.when('GET', "error/user_inactive.html").respond(200);
        httpBackend.when('GET', "home/home.html").respond(200);
        httpBackend.when('GET', "auth/login.html").respond(200);
        createCtrl = function() {
            return $controller('MainController', {
                scope: scope,
                AuthService: authService
            });
        };
        mainCtrl = createCtrl();
        httpBackend.flush();
    }));

    afterEach(function() {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });


    describe('main()', function() {

        it("should change state to config_profile if user name is Unknown", function() {
            var unknownUser = {
              name: 'Unknown',
              invites: [],
              institutions: [splab],
              state: 'active'
            };

            authService.getCurrentUser = function() {
                return new User(unknownUser);
            };

            spyOn(state, 'go');

            mainCtrl = createCtrl();

            expect(state.go).toHaveBeenCalledWith('config_profile');
        });
    });

    describe('MainController functions', function() {
        it('Should be active', function() {
            expect(mainCtrl.isActive(certbio.key)).toBe(true);
        });
        it('Should be not active', function() {
            expect(mainCtrl.isActive(splab.key)).toBe(false);
        });
        it('Should change active institution', function() {
            spyOn(mainCtrl.user, 'changeInstitution');
            mainCtrl.changeInstitution(splab.key);
            expect(mainCtrl.user.changeInstitution).toHaveBeenCalledWith(splab.key);
        });
        it('Should call state.go() in function goTo()', function(){
            spyOn(state, 'go');
            mainCtrl.goTo('app.home');
            expect(state.go).toHaveBeenCalledWith('app.home');
        });
        it('Should call state.go() in function goToInstitution()', function(){
            spyOn(state, 'go');
            mainCtrl.goToInstitution(splab.key);
            expect(state.go).toHaveBeenCalledWith('app.institution', {institutionKey: '1239'});
        });

        it('Should call state.go() and InstitutionService.getInstitution() in function goToSearchedInstitution()', function(){
            spyOn(state, 'go').and.callThrough();
            spyOn(instService, 'getInstitution').and.callThrough();
            httpBackend.expect('GET', "/api/institutions/" + splab.key).respond(splab);
            mainCtrl.goToSearchedInstitution(splab.key);
            httpBackend.flush();
            expect(instService.getInstitution).toHaveBeenCalledWith(splab.key);
            expect(state.go).toHaveBeenCalledWith('app.institution', {institutionKey: '1239'});
        });

        it('Should call makeSearch() in function submit()', function(){
            var documents = [{name: splab.name, id: splab.key}];
            mainCtrl.search = splab.name;
            mainCtrl.finalSearch = mainCtrl.search;
            spyOn(mainCtrl, 'makeSearch').and.callThrough();
            spyOn(instService, 'searchInstitutions').and.callThrough();
            httpBackend.expect('GET', "api/search/institution?name=" + splab.name + "&state=active").respond(documents);
            mainCtrl.submit();
            httpBackend.flush();
            expect(mainCtrl.makeSearch).toHaveBeenCalled();
            expect(mainCtrl.institutions).toEqual(documents);
            expect(mainCtrl.showSearchMenu).toEqual(true);
            expect(mainCtrl.search).toEqual('');
            expect(instService.searchInstitutions).toHaveBeenCalledWith(mainCtrl.finalSearch);
        });
        it('User should not be admin of your current institution', function(){
            expect(mainCtrl.isAdmin(mainCtrl.user.current_institution)).toBe(true);
        });
    });

}));