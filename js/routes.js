walrusIRCApp.config(function ($routeProvider) {
    $routeProvider
    	.when('/main', {
    		templateUrl: 'tmpl/main.html',
    		controller: 'walrusController'
    	})
        .when('/', {
            templateUrl: 'tmpl/login.html',
            controller: 'loginController'
        }).otherwise({
        	redirectTo: '/'
        });
});