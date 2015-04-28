walrusIRCApp.factory('IRCService', [ '$rootScope', '$timeout', function ($rootScope, $timeout) {
	var service = {
		nick: "",
		messages: [],
		context_messages: [],
		channels: [],
		privateMessagers: [],
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

		addPrivateMessage: function (from, to, time, message, type, options) {
			service.messages.push({ nick: from, to: to, message: message, time: time, type: type, options: options });
			if(from === service.context) {
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

		addPrivateMessager: function (nick) {
			if(service.privateMessagers.indexOf(nick) === -1) {
				service.privateMessagers.push(nick);
				$rootScope.$apply();
			}

		},

		removeUserFromChannel: function (nick, channel) {
			for(var i = 0; i < service.channels.length; i++) {
				if(service.channels[i].title === channel) {
					var nick_index = service.channels[i].users.indexOf(nick);
					if(nick_index !== -1) {
						service.channels[i].users.splice(nick_index, 1);
					}
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

		removeChannel: function (channel) {
			service.channels = service.channels.filter(function (_channel) {
				return _channel.title !== channel;
			});
		},

		sendMessageToContext: function (message) {
			client.say(service.context, message);
			service.messages.push({ nick: clientConfig.userName, to: service.context, message: message, type: 'message', time: +new Date() });
			service.context_messages.push({ nick: clientConfig.userName, to: service.context, message: message, type: 'message', time: +new Date() });
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
			log.info('Changing context to : ', context);
			service.context_messages.length = 0; //Clears out context_messages
			for(var i = 0; i < service.messages.length; i++) {
				if(service.messages[i].to === context) {
					service.context_messages.push(service.messages[i]);
				}
			}
			service.context = context;
		},

		changeToPrivateMessageContext: function (nick) {
			log.info('Changing context to : ', nick);
			service.context_messages.length = 0;
			for(var i = 0; i < service.messages.length; i++) {
				if(service.messages[i].to === clientConfig.userName && service.messages[i].nick === nick) {
					service.context_messages.push(service.messages[i]);
				}
				else if(service.messages[i].to === nick && service.messages[i].nick === clientConfig.userName) {
					service.context_messages.push(service.messages[i]);
				}
			}
			service.context = nick;
		}
	};

	// Connect to IRC and add listeners
	var fs = require('fs');
	var log = require('winston');
	var entry = require('./js/db.js');
	var IRClient = require('irc').Client;

	var clientConfig = JSON.parse(fs.readFileSync('client.json'), 'utf8');
	service.changeClientNick(clientConfig.userName);
	service.context = 'Freenode';

	var client = new IRClient(clientConfig.server, clientConfig.userName, clientConfig);

	client.addListener('message', function (nick, to, text) {
		// Don't handle pm here
		if(to === clientConfig.userName) return;
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

	client.addListener('pm', function (nick, text, message) {
		service.addPrivateMessager(nick);
		service.addPrivateMessage(nick, clientConfig.userName, +new Date(), text, 'message');
	});

	client.addListener('notice', function (nick, to, text, message) {
		// If came from server
		if(!nick) {
			service.addMessage('Freenode', to, +new Date(), text, 'notice');
		}
		// Else came from some user
		else if(nick) {
			service.addMessage(nick, to, +new Date(), '{-from '+nick+'-} ' + text, 'notice');
		}
	});

	client.addListener('join', function (channel, nick, message) {
		if(nick === clientConfig.userName) {
			service.addChannel(channel);
		}
		else {
			service.addUserToChannel(nick, channel);
			service.addMessage(nick, channel, +new Date(), nick + ' has joined the channel.', 'join');
		}
	});

	client.addListener('part', function (channel, nick, reason, message) {
		if(nick === clientConfig.userName) {

		}
		else {
			service.addMessage(nick, channel, +new Date(), nick + ' has left the channel. ('+reason+')', 'part');
		}
		service.removeUserFromChannel(nick, channel);
	});

	client.addListener('quit', function (nick, reason, channels, message) {
		channels.forEach(function(channel) {
			service.removeUserFromChannel(nick, channel);
			service.addMessage(nick, channel, +new Date(), nick + ' has quit. ('+reason+')', 'quit');
		});
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

	client.addListener('motd', function (motd) {
		motd.split('\n').forEach(function(line) {
			log.info(line);
			service.addMessage('', 'Freenode', +new Date(), line, 'motd');
		});
	});

	client.addListener('nick', function (oldnick, newnick, channels, message) {
		if(oldnick === service.nick) {
			service.changeClientNick(newnick);
		}
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