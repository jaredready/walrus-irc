var log = require('winston');
var moment = require('moment');
var IRClient = require('irc').Client;

var clientConfig = {
	server: 'irc.freenode.net',
	userName: 'ResidentWalrus',
	realName: 'ResidentBiscuit',
	password: '',
	port: 6667,
	debug: false,
	showErrors: false,
	autoRejoin: false,
	autoConnect: false,
	channels: ['#botdever'],
	secure: false,
	selfSigned: false,
	certExpired: false,
	floodProtection: false,
	floodProtectionDelay: 1000,
	sasl: false,
	stripColors: false,
	channelPrefixes: "&#",
	messageSplit: 512
};

var client = new IRClient(clientConfig.server, clientConfig.userName, clientConfig);

client.addListener('message', function(nick, to, text) {
	var message_table = document.getElementById('messageTable');
	var message_row = message_table.insertRow(-1);
	var timestamp = moment();

	var timestamp_cell = message_row.insertCell(0);
	timestamp_cell.classList.add('message-timestamp');
	timestamp_cell.innerHTML = '1/1/2015 13:31:55';

	var from_cell = message_row.insertCell(1);
	from_cell.classList.add('message-nick');
	from_cell.innerHTML = nick;

	var message_cell = message_row.insertCell(2);
	message_cell.classList.add('message-text');
	message_cell.innerHTML = text;
});

client.addListener('raw', function(message) {
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