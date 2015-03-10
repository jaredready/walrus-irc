walrusIRCApp.controller("walrusController", function ($scope) {
	
});

walrusIRCApp.controller("networkTabController", function ($scope){
	$scope.networks = [
		{ title:'Freenode', content:'Freenode Content' },
    	{ title:'Quakenet', content:'Quakenet Content' },
    	{ title:'Rizon', content:'Rizon Content', disabled: true }
 	];
});

walrusIRCApp.controller("chatWindowController", ['$scope', 'IRCService',
    function($scope, IRCService) {
    	$scope.$on( 'context_messages.update', function( event ) {
			$scope.chat = IRCService.context_messages;
		});

		$scope.chat = IRCService.context_messages;

		$scope.changeContext = function (context) {
			IRCService.changeContext(context);
		};
    }
]);

walrusIRCApp.controller("channelPaneController", ['$scope', 'IRCService',
	function($scope, IRCService) {
		$scope.channels = IRCService.channels;
	}
]);

walrusIRCApp.controller("sendMessageController", ['$scope', 'IRCService',
	function($scope, IRCService) {
		$scope.sendMessage = function(chatMessage) {
			IRCService.handleMessage(chatMessage);
			$scope.chatMessage = "";
		};
	}
]);