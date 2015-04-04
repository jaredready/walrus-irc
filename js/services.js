walrusIRCApp.factory('IRCService', [ '$rootScope', '$timeout', function ($rootScope, $timeout) {
	var service = {
		nick: "",
		messages: [],
		context_messages: [],
		channels: [],
		context: "",

		changeClientNick: function (newNick) {
			service.nick = newNick;
			// This $timeout is not ideal, should be able to either call $apply()
			// or not need to, but that's not the case for whatever reason. Works for now.
			// #yolo
			$timeout(function () {
				$rootScope.$apply();
			}, 0);
		},

		// Change another users displayed nick
		changeOtherNick: function (channel, oldnick, newnick) {

		},

		addMessage: function (from, to, time, message, type, options) {
			service.messages.push({ nick: from, to: to, message: message, time: time, type: type, options: options });
			if(to === service.context) {
				service.context_messages.push({ nick: from, to: to, message: message, time: time, type: type, options: options });
			}
			$rootScope.$apply();
		},

		getChannelUsers: function () {
			for(var i = 0; i < service.channels.length; i++) {
				if(service.channels[i].title === service.context) {
					return service.channels[i].users;
				}
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

		addUsersToChannel: function (nicks, channel) {
			var channel_idx = -1;
			for(var i = 0; i < service.channels.length; i++) {
				if(service.channels[i].title === channel) {
					channel_idx = i;
				}
			}
			Array.prototype.push.apply(service.channels[channel_idx].users, nicks);
		},

		removeUserFromChannel: function (nick, channel) {
			//Uh yea this doesnt work, channel = [{title: users:}]
			var channel_index = service.channels.indexOf(channel);
			if(channel_index !== -1) {
				var nick_index = service.channels[channel_index].users.indexOf(nick);
				if(nick_index !== -1) {
					service.channels[channel_index].users.splice(nick_index, 1);
				}
			}
		},

		addChannel: function (channel) {
			service.channels.push({ title: channel, users: [] });
			service.addUserToChannel(clientConfig.userName, channel);
			$rootScope.$apply();
		},

		removeChannel: function (channel) {
			service.channels = service.channels.filter(function (_channel) {
				return _channel.title !== channel;
			});
		},

		sendMessageToContext: function (message) {
			client.say(service.context, message);
			service.messages.push({ nick: clientConfig.userName, to: service.context, message: message, time: +new Date() });
			service.context_messages.push({ nick: clientConfig.userName, to: service.context, message: message, time: +new Date() });
		},

		handleMessage: function (message) {
			if(message.startsWith('/j') || message.startsWith('/join')) {
				var channel = message.split(' ')[1];
				client.join(channel);
			}
			else if(message.startsWith('/n') || message.startsWith('/nick')) {
				var newNick = message.split(' ')[1];
				client.send('NICK', newNick);
			}
			else {
				service.sendMessageToContext(message);
			}
		},

		changeContext: function (context) {
			service.context_messages.length = 0; //Clears out context_messages
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
	service.changeClientNick(clientConfig.userName);

	var client = new IRClient(clientConfig.server, clientConfig.userName, clientConfig);

	client.addListener('message', function (nick, to, text) {
		var msg = new entry.message({ nick: nick, to: to, message: text, time: +new Date(), type: 'message' });
		msg.save();
		var foundGist = text.match('https:\/\/gist.github.com/[A-Za-z0-9]+\/.+');
		if(foundGist) {
			var gistId = foundGist[0].split('/').pop();
			service.addMessage(nick, to, +new Date(), text, 'gist', [gistId]);
		}
		else {
			service.addMessage(nick, to, +new Date(), text, 'message');
		}
	});

	client.addListener('join', function (channel, nick, message) {
		if(nick === clientConfig.userName) {
			service.addChannel(channel);
		}
		else {
			service.addUserToChannel(nick, channel);
			service.addMessage(nick, channel, +new Date(), message, 'join');
		}
	});

	client.addListener('part', function (channel, nick, reason, message) {
		if(nick === clientConfig.userName) {

		}
		service.removeUserFromChannel(nick, channel);
	});

	client.addListener('names', function (channel, nicks) {
		var start = new Date();
		var _nicks = [];
		for(var nick in nicks) {
			if(nick === clientConfig.userName) continue;
			else {
				_nicks.push(nick);
			}
		}
		service.addUsersToChannel(_nicks, channel);
		var end = new Date();
		log.info('NAMES took ', end - start, 'ms.');
	});

	client.addListener('nick', function (oldnick, newnick, channels, message) {
		if(oldnick === service.nick) {
			service.changeClientNick(newnick);
		}
	});

	client.addListener('raw', function (message) {
		log.info(message);
	});

	client.addListener('error', function (message) {
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