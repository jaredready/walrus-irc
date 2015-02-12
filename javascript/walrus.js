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

client.addListener('names', function(channel, nicks){
	log.info(channel);
	var channel_panel = document.getElementById('channel0-server0-panel');
	var channel_user_list = (channel_panel.getElementsByClassName('channel-user-list'))[0];
	log.info(nicks);
	Object.keys(nicks).forEach(function(nick) {
		var user = document.createElement('a');
		user.classList.add('list-group-item');
		user.href = '#';

		if(nicks[nick] === '@') {
			var glyphiconSpan = document.createElement('span');
			glyphiconSpan.classList.add('glyphicon', 'glyphicon-exclamation-sign');
		}
		else {
			var glyphiconSpan = document.createElement('span');
			glyphiconSpan.classList.add('glyphicon', 'glyphicon-user');
		}

		user.appendChild(glyphiconSpan);
		user.appendChild(document.createTextNode(" " + nick));
		channel_user_list.appendChild(user);
	});
});

client.addListener('join', function(channel, nick, message){
	var message_table = document.getElementById('messageTable');
	var message_row = message_table.insertRow(-1);
	var timestamp = moment();

	var timestamp_cell = message_row.insertCell(0);
	timestamp_cell.classList.add('message-timestamp');
	timestamp_cell.innerHTML = '1/1/2015 13:31:55';

	var from_cell = message_row.insertCell(1);
	from_cell.classList.add('message-nick');
	var join_icon = document.createElement('span');
	join_icon.classList.add('glyphicon', 'glyphicon-arrow-right');
	from_cell.appendChild(join_icon);

	var message_cell = message_row.insertCell(2);
	message_cell.classList.add('message-text');
	message_cell.innerHTML = nick + ' has joined';
});

client.addListener('part', function(channel, nick, reason, message){
	var message_table = document.getElementById('messageTable');
	var message_row = message_table.insertRow(-1);
	var timestamp = moment();

	var timestamp_cell = message_row.insertCell(0);
	timestamp_cell.classList.add('message-timestamp');
	timestamp_cell.innerHTML = '1/1/2015 13:31:55';

	var from_cell = message_row.insertCell(1);
	from_cell.classList.add('message-nick');
	var join_icon = document.createElement('span');
	join_icon.classList.add('glyphicon', 'glyphicon-arrow-left');
	from_cell.appendChild(join_icon);

	var message_cell = message_row.insertCell(2);
	message_cell.classList.add('message-text');
	message_cell.innerHTML = nick + ' has left. (' + reason + ')';
});

document.getElementById('message-button').addEventListener('click', function(){
	var message = document.getElementById('messageInput');
	client.say('#botdever', message.value);

	var message_table = document.getElementById('messageTable');
	var message_row = message_table.insertRow(-1);
	var timestamp = moment();

	var timestamp_cell = message_row.insertCell(0);
	timestamp_cell.classList.add('message-timestamp');
	timestamp_cell.innerHTML = '1/1/2015 13:31:55';

	var from_cell = message_row.insertCell(1);
	from_cell.classList.add('message-nick');
	from_cell.innerHTML = clientConfig.userName;

	var message_cell = message_row.insertCell(2);
	message_cell.classList.add('message-text');
	message_cell.innerHTML = message.value;

	message.value = "";
});

document.getElementById('messageForm').addEventListener('submit', function(ev){
	var message = document.getElementById('messageInput');
	client.say('#botdever', message.value);

	var message_table = document.getElementById('messageTable');
	var message_row = message_table.insertRow(-1);
	var timestamp = moment();

	var timestamp_cell = message_row.insertCell(0);
	timestamp_cell.classList.add('message-timestamp');
	timestamp_cell.innerHTML = '1/1/2015 13:31:55';

	var from_cell = message_row.insertCell(1);
	from_cell.classList.add('message-nick');
	from_cell.innerHTML = clientConfig.userName;

	var message_cell = message_row.insertCell(2);
	message_cell.classList.add('message-text');
	message_cell.innerHTML = message.value;

	message.value = "";

	ev.preventDefault();
})

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