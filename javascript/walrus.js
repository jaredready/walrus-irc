require('../javascript/foo.js');

var entry = require('../javascript/db.js');

var log = require('winston');
var fs = require('fs');
var path = require('path');
var dirname = require('../javascript/utils.js').dirname;
var moment = require('moment');
var IRClient = require('irc').Client;

var clientConfig = JSON.parse(fs.readFileSync(path.join(dirname, '../conf/client.json'), 'utf8'));

var channel_map = new Map();
var current_channel_id = 0;
var channelContext = "";

var client = new IRClient(clientConfig.server, clientConfig.userName, clientConfig);

client.addListener('message', function(nick, to, text) {
	var msg = new entry.message({ nick: nick, channel: to, message: text, time: +new Date() });
	msg.save();

	if(to === channelContext) {
		var msg = {
			"nick": nick,
			"text": text
		};

		display_message(msg, 'message');
	}
});

client.addListener('names', function(channel, nicks){
	Object.keys(nicks).forEach(function(nick) {
		entry.user.findOne({ server: 'Freenode', channel: channel, nick: nick }, function(error, user_found) {
			if (error) {
				throw error;
			}

			if (!user_found) {
				var user_ = new entry.user({ server: 'Freenode', channel: channel, user: nick });
				user_.save();
			}
		});

		add_nick_to_channel(nick, false, false, channel);
	});
});

client.addListener('join', function(channel, nick, message){
	entry.user.findOne({ server: 'Freenode', channel: channel, user: nick }, function(error, user_found) {
		if (error) {
			throw error;
		}

		if (!user_found) {
			var user_ = new entry.user({ server: 'Freenode', channel: channel, user: nick });
			user_.save();
		}
	});

	//We get added on the 'names' listener already
	if(nick !== clientConfig.userName) {
		add_nick_to_channel(nick, false, false, channel);
	}

	var msg = {
		"nick": nick,
		"message": message
	};

	display_message(msg, 'join');
});

client.addListener('part', function(channel, nick, reason, message){
	var msg = {
		"nick": nick,
		"reason": reason,
		"message": message
	};

	remove_nick_from_channel(nick, channel);
	display_message(msg, 'part');
});

client.addListener('quit', function(nick, reason, channels, message){
	var msg = {
		"nick": nick,
		"reason": reason,
		"message": message
	};

	display_message(msg, 'quit');
});

client.addListener('motd', function(motd){
	var message_table = document.getElementById('messageTable');

	motd.split('\n').forEach(function(line){
		var message_row = message_table.insertRow(-1);
		var timestamp_cell = message_row.insertCell(0);
		timestamp_cell.classList.add('message-timestamp');
		timestamp_cell.innerHTML = moment().format('L HH:mm');

		var message_cell = message_row.insertCell(1);
		message_cell.classList.add('message-text');
		message_cell.innerHTML = line;
	});
});

document.getElementById('message-button').addEventListener('click', function(){
	process_outbound_message(document.getElementById('messageInput').value);
	document.getElementById('messageInput').value = "";
});

document.getElementById('messageForm').addEventListener('submit', function(ev){
	process_outbound_message(document.getElementById('messageInput').value);
	document.getElementById('messageInput').value = "";

	ev.preventDefault();
});

function add_nick_to_channel(nick, op, voice, channel) {
	var channel_num = channel_map.get(channel);
	var channel_panel = document.getElementById('channel' + channel_num + '-server0-panel');
	var channel_user_list = (channel_panel.getElementsByClassName('channel-user-list'))[0];

	var user = document.createElement('a');
	user.classList.add('list-group-item');
	user.href = '#';

	var glyphiconSpan = document.createElement('span');
	glyphiconSpan.classList.add('glyphicon', 'glyphicon-user');

	user.appendChild(glyphiconSpan);
	user.appendChild(document.createTextNode(" " + nick));
	channel_user_list.appendChild(user);
}

function remove_nick_from_channel(nick, channel) {
	var channel_num = channel_map.get(channel);
	var channel_panel = document.getElementById('channel' + channel_num + '-server0-panel');
	var channel_user_list = (channel_panel.getElementsByClassName('channel-user-list'))[0];

	var user_array = channel_user_list.childNodes;

	for(var i = 0; i < user_array.length; i++) {
		if(user_array[i].text == ' ' + nick) {
			user_array[i].remove();
		}
	}
}

function display_message(msg, type) {
	if(msg.length === 0) return;

	var message_table = document.getElementById('messageTable');
	var message_row = message_table.insertRow(-1);

	var timestamp_cell = message_row.insertCell(0);
	timestamp_cell.classList.add('message-timestamp');
	timestamp_cell.innerHTML = moment().format('L HH:mm:ss');

	if(type === 'message') {
		var from_cell = message_row.insertCell(1);
		from_cell.classList.add('message-nick');
		from_cell.innerHTML = msg.nick;

		var message_cell = message_row.insertCell(2);
		message_cell.classList.add('message-text');
		message_cell.innerHTML = msg.text;
	}
	else if(type === 'part'|| type === 'quit') {
		var from_cell = message_row.insertCell(1);
		from_cell.classList.add('message-nick');
		var part_icon = document.createElement('span');
		part_icon.classList.add('glyphicon', 'glyphicon-arrow-left');
		from_cell.appendChild(part_icon);

		var message_cell = message_row.insertCell(2);
		message_cell.classList.add('message-text');
		message_cell.innerHTML = msg.nick + ' has left. (' + msg.reason + ')';
	}
	else if(type === 'join') {
		var from_cell = message_row.insertCell(1);
		from_cell.classList.add('message-nick');
		var join_icon = document.createElement('span');
		join_icon.classList.add('glyphicon', 'glyphicon-arrow-right');
		from_cell.appendChild(join_icon);

		var message_cell = message_row.insertCell(2);
		message_cell.classList.add('message-text');
		message_cell.innerHTML = msg.nick + ' has joined.';
	}

	scrollMessagesToBottom();
}

function process_outbound_message(msg) {
	if(msg.startsWith('/j') || msg.startsWith('/join')) {
		//Need to create new channel pane. This is kind of a mess.
		var channel = msg.split(' ')[1];

		var new_panel =	channel_panel_factory('freenode', channel);
		var channel_accordion = document.getElementById('channelAccordion');
		channel_accordion.appendChild(new_panel);
		
		changeChannelContext(channel);

		client.join(channel, function(error){
			if(error) {
				throw error;
			}
			log.info('Joined channel ' + channel);
		});
		return;
	}
	if((msg.startsWith('/n') || msg.startsWith('/nick')) && msg.split(' ').length == 2) {
		client.send('NICK', msg.split(' ')[1]);
		document.getElementById('clientNick').innerHTML = msg.split(' ')[1];
		log.info('Changed nick to: ' + msg.split(' ')[1]);
		return;
	}

	var messasge = new entry.message({ nick: clientConfig.userName, channel: channelContext, message: msg, time: +new Date() });
	messasge.save();

	client.say(channelContext, msg);

	var message_table = document.getElementById('messageTable');
	var message_row = message_table.insertRow(-1);

	var timestamp_cell = message_row.insertCell(0);
	timestamp_cell.classList.add('message-timestamp');
	timestamp_cell.innerHTML = moment().format('L HH:mm:ss');

	var from_cell = message_row.insertCell(1);
	from_cell.classList.add('message-nick');
	from_cell.innerHTML = clientConfig.userName;

	var message_cell = message_row.insertCell(2);
	message_cell.classList.add('message-text');
	message_cell.innerHTML = msg;

	scrollMessagesToBottom();
	return;
};

function channel_panel_factory(server, channel){
	/**
	var new_panel =	'<div class="panel panel-default">
						    <div class="panel-heading" role="tab" id="freenode-'+channel+'">
						      <h4 class="panel-title">
						        <a data-toggle="collapse" data-parent="#channelAccordion" href="#channel'+channel_id+'-server0-panel">
						          '+channel'
						        </a>
						        <span class="badge" id="'+channel'-unread">6</span>
						        <a href="#">
						        	<span class="glyphicon glyphicon-remove-circle" style="float:right;"></span>
					        	</a>
						      </h4>
						    </div>
						    <div id="channel'+channel_id'-server0-panel" class="panel-collapse collapse in" role="tabpanel">
						      <div class="panel-body channel-user-list-div">
						      	<div class="channel-user-list list-group">
						      		
						      	</div>
						      </div>
						    </div>
						  </div>
						</div>';
	**/

	channel_map.set(channel, current_channel_id++)
	var channel_id = channel_map.get(channel);

	var panel = document.createElement('div');
	panel.classList.add('panel', 'panel-default');

	var panel_heading = document.createElement('div');
	panel_heading.classList.add('panel-heading');
	panel_heading.id = server + '-' +  channel;

	var panel_title = document.createElement('h4');
	panel_title.classList.add('panel-title');

	var channel_anchor = '<a data-toggle="collapse" data-parent="#channelAccordion" href="#channel'+channel_id+'-server0-panel" onclick="changeChannelContext(this.text)">'+channel+'</a>'

	var unread_span = document.createElement('span');
	unread_span.classList.add('badge');
	unread_span.id = channel + '-unread';

	var part_button = document.createElement('a');
	part_button.href = '#';
	var part_button_icon = document.createElement('span');
	part_button_icon.classList.add('glyphicon', 'glyphicon-remove-circle');
	part_button_icon.style.float = 'right';

	var panel_collapse = document.createElement('div');
	panel_collapse.classList.add('panel-collapse', 'collapse');
	panel_collapse.id = 'channel' + channel_id + '-server0-panel';

	var panel_body = document.createElement('div');
	panel_body.classList.add('panel-body', 'channel-user-list-div');

	var channel_user_list = document.createElement('div');
	channel_user_list.classList.add('channel-user-list', 'list-group');

	//Time to wire these all together
	panel.appendChild(panel_heading);

	panel_heading.appendChild(panel_title);
	panel_title.innerHTML = channel_anchor;
	panel_title.appendChild(unread_span);
	panel_title.appendChild(part_button);
	part_button.appendChild(part_button_icon);

	panel.appendChild(panel_collapse);
	panel_collapse.appendChild(panel_body);
	panel_body.appendChild(channel_user_list);

	return panel;
}

function changeChannelContext(channel) {
	log.info('Change context to: ' + channel);
	channelContext = channel;
	entry.message.find({ channel: channel }, function(error, cursor){
		if(error) {
			throw error;
		}
		// Wipe out table, replace messages with messages in this context
		document.getElementById('messageTable').innerHTML = "";
		cursor.forEach(function(message){
			var message_table = document.getElementById('messageTable');
			var message_row = message_table.insertRow(-1);

			var timestamp_cell = message_row.insertCell(0);
			timestamp_cell.classList.add('message-timestamp');
			timestamp_cell.innerHTML = moment(message.time).format('L HH:mm:ss');

			var from_cell = message_row.insertCell(1);
			from_cell.classList.add('message-nick');
			from_cell.innerHTML = message.nick;

			var message_cell = message_row.insertCell(2);
			message_cell.classList.add('message-text');
			message_cell.innerHTML = message.message;

			scrollMessagesToBottom();
		});
	});
}

function scrollMessagesToBottom() {
	log.info('Scrolling messages');
	document.getElementById('messageTable').childNodes[0].scrollTop = document.getElementById('messageTable').childNodes[0].scrollHeight;
}

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