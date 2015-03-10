walrusIRCApp.config(function ($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'tmpl/main.html',
            controller: 'walrusController'
        }).otherwise({
        	redirectTo: '/'
        });
});