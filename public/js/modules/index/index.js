const home = angular.module('home', [
  'ngRoute',
  'intia.services.establishment',
  'intia.services.sirene',
  'intia.services.rna',
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
