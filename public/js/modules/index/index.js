const home = angular
  .module('home', [
    'ngRoute',
    'intia.services.establishments',
    'intia.services.establishments.api',
    'intia.services.asyncCalls',
    'intia.services.string',
  ])
  .config(['$routeProvider',
    ($routeProvider) => {
      $routeProvider
        .when('/', {
          templateUrl: 'js/modules/index/views/index.html',
          controller: 'IndexCtrl',
        })
        .otherwise({
          redirectTo: '/',
        });
    },
  ]);
