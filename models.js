var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var en = require('int-encoder');

// Model Image,Text,Path /////////////////////////
var Image = new Schema({
  path: String,
  name: {type: String, default: ''},
  left: {type: Number, default: 200},
  top: {type: Number, default: 200},
  angle: {type: Number, default: 11},
  scaleX: {type: Number, default: 1},
  scaleY: {type: Number, default: 1},
  board_id: Schema.Types.ObjectId,
  created: {type: Date, default: Date()}
});

mongoose.model('Image', Image);

var Text = new Schema({
  text: {type: String, default: 'Hello world!'},
  left: {type: Number, default: 200},
  top: {type: Number, default: 200},
  angle: {type: Number, default: 10},
  scaleX: {type: Number, default: 1},
  scaleY: {type: Number, default: 1},
  fill: {type: String, default: '#000'},
  fontFamily: {type: String, default: 'helvetica'},
  board_id: Schema.Types.ObjectId,
  created: {type: Date, default: Date()}
});

mongoose.model('Text', Text);

var Path = new Schema({
  path: String,
  left: {type: Number, default: 200},
  top: {type: Number, default: 200},
  angle: {type: Number, default: 10},
  scaleX: {type: Number, default: 1},
  scaleY: {type: Number, default: 1},
  width: Number,
  height: Number,
  stroke: String,
  strokeWidth: Number,
  board_id: Schema.Types.ObjectId,
  created: {type: Date, default: Date()}
});

mongoose.model('Path', Path);

// Model Choice ////////////////////////////////////
var Choice = new Schema({
  date: Date,
  voters: [{
    voter_username: String,
    voter_id: Schema.Types.ObjectId
  }],
  poll_id: Schema.Types.ObjectId
});

mongoose.model('Choice', Choice);

// Model Poll //////////////////////////////////////
var Poll = new Schema({
  board_id: Schema.Types.ObjectId,
  promoter_id: Schema.Types.ObjectId,
  title: {type: String, default: 'Untitled'},
  location: {type: String, default: 'null'},
  description: {type: String, default: 'null'},
  created: {type: Date, default: Date() },
  expired: Date,
  // isDone: {type: Boolean, default: false },
});

mongoose.model('Poll', Poll);

// Friend-Request //////////////////////////////////

//..................................................

// Notice //////////////////////////////////////////
var noticeTypes = ['Request', 'Accept', 'Reject', 'Join', 'Leave'];
var Notice = new Schema({
  sender_id: Schema.Types.ObjectId,
  sender_name: String,
  receiver_id: Schema.Types.ObjectId,
  created: {type: Date, default: Date()},
  type: {type: String, enum: noticeTypes},
  // only board invitation notifications now
  board_id: Schema.Types.ObjectId,
  board_name: String
});

mongoose.model('Notice', Notice);

// Board-Invitation ////////////////////////////////
var BoardInvitation = new Schema({
  inviter_id: Schema.Types.ObjectId,
  board_id: Schema.Types.ObjectId,
  guest_id: Schema.Types.ObjectId
});

mongoose.model('BoardInvitation', BoardInvitation);

// Model Board /////////////////////////////////////
var Board = new Schema({
  name: { type: String, default: 'Untitled' },
  creator_id: Schema.Types.ObjectId,
  created: { type: Date, default: Date() },
  modifier_id: Schema.Types.ObjectId,
  lastModified: { type: Date, default: Date() },
  owner_id: Schema.Types.ObjectId,
  isShared: {type: Boolean, default: false },
  member_id: [Schema.Types.ObjectId],
  bgImage: {type: String, default: '/images/defaultbg.png'},
  bgColor: {type: String, default: '#9ACD32'}
});

Board.virtual('image_origin')
.get(function() {
  return 'upload/' + this.id64 + '/board.png';
});

Board.virtual('image_thumb200')
.get(function() {
  return '/upload/' + this.id64 + '/thumbnails/board_thumb200.png';
});

Board.virtual('image_thumb400')
.get(function() {
  return '/upload/' + this.id64 + '/thumbnails/board_thumb400.png';
});

Board.virtual('id64')
.get(function() {
  return en.encode(this._id, 16);
});

mongoose.model('Board', Board);

function validatePresenceOf(value) {
return value && value.length;
}

// Model User ////////////////////////////////////////////
var User = new Schema({
	email: { type: String, validate: [validatePresenceOf, 'an email is required'], index: { unique: true } },
  username: { type: String, index: { unique: true } },
  hashed_password: String,
  salt: String,
  hasNewNotice: {type: Boolean, default: false}
});

User.virtual('id')
.get(function() {
  return this._id.toHexString();
});

User.virtual('password')
.set(function(password) {
  this._password = password;
  this.salt = this.makeSalt();
  this.hashed_password = this.encryptPassword(password);
})
.get(function() { return this._password; });

User.method('authenticate', function(plainText) {
return this.encryptPassword(plainText) === this.hashed_password;
});

User.method('makeSalt', function() {
return Math.round((new Date().valueOf() * Math.random())) + '';
});

User.method('encryptPassword', function(password) {
return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
});

// User.pre('save', function(next) {
// if (!validatePresenceOf(this.password)) {
//   next(new Error('Invalid password'));
// } else {
//   next();
// }

// });

mongoose.model('User', User);
