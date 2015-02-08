var log = require('winston');
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
	channels: ['#cplusplus.com'],
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