'use strict';

(function() {
    var landing = angular.module('landing', [
        'ngMaterial',
        'ui.router',
        'ngAnimate',
        'firebase',
        'ngSanitize',
    ]);

    landing.config(function($stateProvider, $urlMatcherFactoryProvider,
        $urlRouterProvider, $locationProvider) {

        $urlMatcherFactoryProvider.caseInsensitive(true);

        $stateProvider
            .state("landing", {
                abstract: true,
                views: {
                    main: {
                        templateUrl: "main.html",
                        controller: "MainController as ctrl"
                    }
                }
            })
            .state("landing.home", {
                url: "/",
                views: {
                    content: {
                        templateUrl: "home.html"
                    }
                }
            })
            .state("landing.presignup", {
                url: "/home-pre-cadastro",
                views: {
                    content: {
                        templateUrl: "pre_signup.html"
                    }
                }
            })
            .state("landing.success", {
                url: "/home-sucesso",
                views: {
                    content: {
                        templateUrl: "success.html"
                    }
                }
            })
            .state("landing.comingsoon", {
                url: "/home-em-breve",
                views: {
                    content: {
                        templateUrl: "coming_soon.html"
                    }
                }
            })
            .state("landing.platformcisdetails", {
                url: "/home-plataforma-CIS",
                views: {
                    content: {
                        templateUrl: "platformcisdetails.html"
                    }
                }
            })
            .state("landing.cisdetails", {
                url: "/home-cis",
                views: {
                    content: {
                        templateUrl: "cisdetails.html"
                    }
                }
            })
            .state("landing.supportinstitutions", {
                url: "/home-instituicoes-mantenedoras",
                views: {
                    content: {
                        templateUrl: "support_institutions.html"
                    }
                }
            })
            .state("landing.terms", {
                url: "/home-termos-de-uso",
                views: {
                    content: {
                        templateUrl: "coming_soon.html"
                    }
                }
            })
            .state("landing.privacy", {
                url: "/home-privacidade",
                views: {
                    content: {
                        templateUrl: "coming_soon.html"
                    }
                }
            });

        $urlRouterProvider.otherwise("/");

        $locationProvider.html5Mode(true);
        $locationProvider.hashPrefix(''); // Uses # instead #!
    });
})();