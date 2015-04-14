walrusIRCApp.controller("walrusController", function ($scope) {
	
});

walrusIRCApp.controller("networkTabController", ['$scope', 'IRCService',
	function($scope, IRCService) {
		// This is just an example. Multiple network connectivity is not yet implemented.
		$scope.networks = [
			{ title:'Freenode', content:'Freenode Content' },
	    	{ title:'Quakenet', content:'Quakenet Content' },
	    	{ title:'Rizon', content:'Rizon Content', disabled: true }
	 	];

	 	$scope.changeNetwork = function (network) {
	 		IRCService.changeContext(network);
	 	};
	}
]);

walrusIRCApp.controller("chatWindowController", ['$scope', 'IRCService',
    function($scope, IRCService) {
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

walrusIRCApp.controller("privateMessageController", ['$scope', 'IRCService',
	function($scope, IRCService) {
		$scope.$watch(function () { return IRCService.privateMessagers; }, function (nick) {
			$scope.privateMessagers = IRCService.privateMessagers;
		});
		$scope.changePMContext = function(nick) {
			IRCService.changeToPrivateMessageContext(nick);
		};
	}
]);

walrusIRCApp.controller("sendMessageController", ['$scope', 'IRCService',
	function($scope, IRCService) {
		$scope.$watch(function () { return IRCService.nick; }, function (nick) {
			$scope.clientNick = nick;
		});

		$scope.sendMessage = function(chatMessage) {
			IRCService.handleMessage(chatMessage);
			$scope.chatMessage = "";
		};

		$scope.tabCompleteNick = function(keyEvent) {
			if(keyEvent.keyCode === 9) {
				keyEvent.preventDefault();
				var channel_users = IRCService.getChannelUsers();
				for(var i = 0; i < channel_users.length; i++) {
					if(channel_users[i].startsWith($scope.chatMessage)) {
						$scope.chatMessage = channel_users[i] + ': ';
						return;
					}
				}
			}
		}
	}
]);