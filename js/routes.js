walrusIRCApp.config(function ($routeProvider) {
    $routeProvider
    	.when('/main', {
    		templateUrl: 'tmpl/main.html',
    		controller: 'walrusController'
    	}).when('/signup', {
    		templateUrl: 'tmpl/signup.html',
    		controller: 'loginController'
    	}).when('/', {
            templateUrl: 'tmpl/login.html',
            controller: 'loginController'
        }).otherwise({
        	redirectTo: '/'
        });
});