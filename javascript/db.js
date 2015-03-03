var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/walrus');

var Message = new mongoose.Schema({
	nick: String,
	to: String,
	message: String,
	time: Number
});

var Channel = new mongoose.Schema({
	server: String,
	channel: String
});

var User = new mongoose.Schema({
	server: String,
	channel: String,
	nick: String
})

var entry = {
	message: mongoose.model('Message', Message),
	channel: mongoose.model('Channel', Channel),
	user: mongoose.model('User', User)
};

module.exports = entry;
