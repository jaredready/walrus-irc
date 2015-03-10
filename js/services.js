walrusIRCApp.factory('IRCService', [ '$rootScope', function ($rootScope) {
	var service = {
		messages: [],
		context_messages: [],
		channels: [],
		context: "",

		addMessage: function (from, to, time, message) {
			service.messages.push({ nick: from, to: to, message: message, time: time });
			if(to === service.context) {
				service.context_messages.push({ nick: from, to: to, message: message, time: time });
				$rootScope.$apply();
			}
		},

		addUserToChannel: function (nick, channel) {
			for(var i = 0; i < service.channels.length; i++) {
				if(service.channels[i].title === channel) {
					service.channels[i].users.push(nick);
					$rootScope.$apply();
					return;
				}
			}
		},

		addChannel: function (channel) {
			service.channels.push({ title: channel, users: [] });
			service.addUserToChannel(clientConfig.userName, channel);
			$rootScope.$apply();
		},

		sendMessageToContext: function (message) {
			client.say(service.context, message);
			service.messages.push({ nick: clientConfig.userName, to: service.context, time: +new Date(), message: message });
			service.context_messages.push({ nick: clientConfig.userName, to: service.context, time: +new Date(), message: message });
		},

		handleMessage: function (message) {
			if(message.startsWith('/j') || message.startsWith('/join')) {
				var channel = message.split(' ')[1];
				client.join(channel);
			}
			else {
				service.sendMessageToContext(message);
			}
		},

		changeContext: function (context) {
			service.context_messages = [];
			for(var i = 0; i < service.messages.length; i++) {
				if(service.messages[i].to === context) {
					service.context_messages.push(service.messages[i]);
				}
			}
			service.context = context;
		}
	}

	// Connect to IRC and add listeners
	var fs = require('fs');
	var log = require('winston');
	var entry = require('./js/db.js');
	var IRClient = require('irc').Client;

	var clientConfig = JSON.parse(fs.readFileSync('client.json'), 'utf8');

	var client = new IRClient(clientConfig.server, clientConfig.userName, clientConfig);

	client.addListener('message', function (nick, to, text) {
		var msg = new entry.message({ nick: nick, to: to, message: text, time: +new Date() });
		msg.save();
		service.addMessage(nick, to, +new Date(), text);
	});

	client.addListener('join', function (channel, nick, message) {
		if(nick === clientConfig.userName) {
			service.addChannel(channel);
		}
		else {
			service.addUserToChannel(nick, channel);
		}
	});

	client.addListener('names', function (channel, nicks) {
		Object.keys(nicks).forEach(function(nick) {
			if(nick === clientConfig.userName) return;
			else {
				service.addUserToChannel(nick, channel);
			}
		});
	});

	client.addListener('raw', function(message){
		log.info(message);
	});

	client.connect(0, function() {
		log.info('Connected to "%s".', clientConfig.server);

		clientConfig.channels.forEach(function(chan) {
			client.join(chan, function() {
				log.info('Connected to "%s".', chan);
			});
		});
	});

	return service;
}]);