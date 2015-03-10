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
    	$scope.$on( 'messages.update', function( event ) {
			$scope.chat = IRCService.messages;
		});

		$scope.chat = IRCService.messages;
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
			IRCService.sendMessageToContext(chatMessage);
			$scope.chatMessage = "";
		};
	}
]);