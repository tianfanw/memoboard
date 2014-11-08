
/**
 * Module dependencies.
 */

var express = require('express')
  , app = express()
  , MemoryStore = express.session.MemoryStore
  , sessionStore = new MemoryStore()
  , accounts = require('./routes/accounts')
  , home = require('./routes/home')
  , boards = require('./routes/boards')
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , path = require('path')
  , mongoose = require('mongoose')
  , models = require('./models')
  , db
  , mw = require('./middleware')
  , en = require('int-encoder');


// Models
var User = mongoose.model('User')
  , Board = mongoose.model('Board')
  , Notice = mongoose.model('Notice');

// App Configuration
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  //app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({store: sessionStore
    , secret: 'your secret is safe with me'
  }));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
  app.set('db-uri', 'mongodb://localhost/memoboard-dev');
  app.use(express.logger());
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function() {
  app.set('db-uri', 'mongodb://localhost/memoboard-prod'); 
});

// Connect MongoDB
db = mongoose.connect(app.set('db-uri'));

// socket.io event handling

var usernames = {}; // Maintain all the users on boards
var sockets = {};  // Maintain all the sockets connected

io.sockets.on('connection', function (socket) {

  // when the client emits 'sendchat', this listens and executes
  socket.on('sendchat', function (data) {
    // we tell the client to execute 'updatechat' with 2 parameters
    io.sockets.emit('updatechat', socket.username, data);
  });

  // when the client emits 'adduser', this listens and executes
  socket.on('adduser', function(data){
    // store the username in the socket session for this client
    socket.username = data.username;
    socket.user_id = data.user_id;
    // socket connect to board
    if(data.board_id) {
      // store the board id in the socket session for this client
      socket.board_id = data.board_id;
      
      socket.join(socket.board_id);

      if(!usernames[socket.board_id])
        usernames[socket.board_id] = {};

      // add all other online users
      for(uid in usernames[socket.board_id]){
        if(uid != socket.user_id)
          socket.emit('adduser', {username: usernames[socket.board_id][uid], user_id: uid});
      }

      if(!usernames[socket.board_id][socket.user_id])
        usernames[socket.board_id][socket.user_id] = socket.username;

      boards.load(socket, data);
      var onlineUserNum = Object.keys(usernames[socket.board_id]).length;
      var onlineInfo;
      if(onlineUserNum <= 1) {
        onlineInfo = 'Currently no user is online.';
      }
      else if(onlineUserNum == 2) {
        onlineInfo = 'Currently there is 1 user online: ';
        for(uid in usernames[socket.board_id]) {
          if(uid != socket.user_id) 
            onlineInfo += usernames[socket.board_id][uid] + ' ';
        }
      } else {
        onlineInfo = 'Currently there are' + (onlineUserNum - 1) + ' users online: ';
        for(uid in usernames[socket.board_id]) {
          if(uid != socket.user_id) 
            onlineInfo += usernames[socket.board_id][uid] + ' ';
        }
      }
      socket.emit('updatechat', '[SERVER]', onlineInfo);
     
      socket.broadcast.to(socket.board_id).emit('updatechat', '[SERVER]', socket.username + ' comes online!');
      socket.broadcast.to(socket.board_id).emit('adduser', {username: socket.username, user_id: socket.user_id});
    }
    
    if(!sockets[socket.user_id])
      sockets[socket.user_id] = {};
    if(!sockets[socket.user_id][socket.id])
      sockets[socket.user_id][socket.id] = socket;

});
  
  socket.on('disconnect', function(){
    
    // socket connect to board
    if(socket.board_id) {
      socket.broadcast.to(socket.board_id).emit('updatechat', '[SERVER]', socket.username + ' has left.');
      socket.broadcast.to(socket.board_id).emit('deluser', {username: socket.username, user_id: socket.user_id});
      socket.leave(socket.board_id);
      // delete the user

      if(usernames[socket.board_id]) {
        if(usernames[socket.board_id][socket.user_id])
          delete usernames[socket.board_id][socket.user_id];
      }

      //  delete the board if there's no user on the board
      if(usernames[socket.board_id]) {
        if(Object.keys(usernames[socket.board_id]).length == 0)
          delete usernames[socket.board_id];
      }
    }

    if(sockets[socket.user_id]) {
      if(sockets[socket.user_id][socket.id])
        delete sockets[socket.user_id][socket.id];
    }

    if(sockets[socket.user_id]) {
      if(Object.keys(sockets[socket.user_id]).length == 0)
        delete sockets[socket.user_id];
    }
  });

  socket.on('add', function(data){
    boards.addA(socket, data);
  });

  socket.on('update', function(data){
    // broadcast the change to all other online users
    socket.broadcast.to(socket.board_id).emit('update', data);
  });

  socket.on('save', function(data){
    //save to database
    boards.updateA(socket, data);
  });

  socket.on('delete', function(data){
    boards.deleteA(socket, data);
  });
  socket.on('deleteAll', function(){
    boards.deleteAll(socket);
  })
  socket.on('mousemove', function(data){
    console.log(data);
    socket.broadcast.to(socket.board_id).emit('mousemove', {user_id: socket.user_id, left: data.x, top: data.y});
  });

  socket.on('noticeReaded', function(){
    User.findById(socket.user_id, function(err, user) {
      if(err) throw err;
      if(user.hasNewNotice == true) {
        user.hasNewNotice = false;
        user.save(function(err) {
          if(err) throw err;
        });
      }
      Notice.find({receiver_id: socket.user_id}, function(err, notices){
        notices.forEach(function(notice){
          console.log(notice);
          if(notice.type != 'Request') {
            notice.remove(function(err) {
              if(err) console.log(err);
            })
          }
        })
      })
    })
  });

  socket.on('changeBackground', function(data){
    console.log('dadadsadada');
    console.log(data);
    boards.changeBackground(socket, data);
  });

  socket.on('sendPng', function(data){
    console.log('receive png url');
    boards.updatePng(socket, data);
  });
});

function notification(req, res) {
  //console.log(req.body);
  // var notice = req.body.notice;
  // var receiver_id = notice.receiver_id;
  // if(sockets[receiver_id]) {
  //   for(socket_id in sockets[receiver_id]) {
  //     var socket = sockets[receiver_id][socket_id];
  //     console.log(socket);
  //     socket.emit('notification', notice);
  //   }
  // }
  // if(req.body.isOver == true) {
  //   if(notice.type == 'Request')
  //     res.send({success: 'The invitation is successfully sent!'});
  //   else if(notice.type == 'Reject')
  //     res.send({success: 'Successfully rejected!'});
  //   else {
  //     var board_id64 = en.encode(notice.board_id, 16);
  //     res.send({board_id64: board_id64, board_id: notice.board_id});
  //   }
  // }
  console.log(req.body.notices);
  if(req.body.notices) {
    req.body.notices.forEach(function(notice) {
      var receiver_id = notice.receiver_id;
      if(sockets[receiver_id]) {
        for(socket_id in sockets[receiver_id]) {
          var socket = sockets[receiver_id][socket_id];
          console.log('Send notification to:');
          console.log(socket_id);
          socket.emit('notification', notice);
        }
      }
    });
    if(req.body.notices[0]) {
      var n = req.body.notices[0];
      if(n.type == 'Request')
        res.send({success: 'The invitation is successfully sent!'});
      else if(n.type == 'Reject')
        res.send({success: 'Successfully rejected!'});
      else if(n.type == 'Accept') {
        var board_id64 = en.encode(n.board_id, 16);
        res.send({board_id64: board_id64, board_id: n.board_id});
      } else {
        res.send({success: 'success'});
      }
    } 
  } 
};
// Routing mapping

// Accounts
app.get('/', accounts.index);
app.get('/login', function(req, res) {res.redirect('/');});
app.post('/login', accounts.login);
app.post('/logout', mw.loadUser, accounts.logout);
app.get('/logout', function(req, res) {res.redirect('/');});
app.post('/register', accounts.register);
app.get('/register', function(req, res) {res.redirect('/');});

// Homepage
app.get('/notices', mw.loadUser, home.getNotices);
app.post('/notices', mw.loadUser, home.sendNotices, notification);
app.get('/boards', mw.loadUser, home.index);
app.post('/boards', mw.loadUser, home.createBoard);

// Board
app.get('/boards/:id', mw.loadUser, mw.loadBoard, boards.index);
app.del('/boards/:id', mw.loadUser, mw.loadBoard, boards.delete, notification);
app.get('/boards/:id/info', mw.loadUser, mw.loadBoard, boards.info);
app.post('/boards/:id/share', mw.loadUser, mw.loadBoard, boards.share, notification);
app.post('/boards/:id/images', mw.loadUser, mw.loadBoard, boards.uploadImage);
// app.del('/boards/:id/images', mw.loadUser, mw.loadBoard, boards.deleteImage);
app.post('/boards/:id/poll', mw.loadUser, mw.loadBoard, boards.newPoll);
app.get('/boards/:id/poll', mw.loadUser, mw.loadBoard, boards.getPoll);
app.get('/boards/:id/poll', mw.loadUser, mw.loadBoard, boards.updatePoll);
app.del('/boards/:id/poll', mw.loadUser, mw.loadBoard, boards.deletePoll);

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
