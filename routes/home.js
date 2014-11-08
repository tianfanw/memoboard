require('../models');

var path = require('path')
  , fs = require('fs')
  , en = require('int-encoder')
  , mongoose = require('mongoose')
  , User = mongoose.model('User')
  , Board = mongoose.model('Board')
  , Notice = mongoose.model('Notice');

exports.index = function(req, res) {
  // Some kind of Mongo query/update
  Board.find({member_id: req.currentUser._id }).sort({lastModified: -1}).exec(function(err, boards) {
    if(err) throw err;
    res.format({
      html: function(){
        res.render('home', {boards: boards, user: req.currentUser });
      },

      json: function(){
        res.send({boards: boards});
      }
    });
  });

  // console.log(req.currentUser);
  // res.render('home', {user: req.currentUser});
};

exports.getNotices = function(req, res) {
  Notice.find({receiver_id: req.currentUser._id}, function(err, notices) {
    if(err) throw err;
    res.send({notices: notices});
  })
};

exports.sendNotices = function(req, res, next) {
  if(!req.body.notice_id)
  {
    res.send({error: 'Invalid request!'});
    return;
  }

  Notice.findById(req.body.notice_id, function(err, notice) {
    if(err) throw err;
    if(notice) {
      if(notice.type == 'Request') {
        req.body.notices = [];
        notice.remove(function(err) {
          if(err) throw err;
          if(req.body.status == 'Accept') {
            Board.findById(notice.board_id, function(err, board) {
              if(err) throw err;
              var newNotice = new Notice();
              newNotice.sender_id = req.currentUser._id;
              newNotice.sender_name = req.currentUser.username;
              newNotice.receiver_id = notice.sender_id;
              newNotice.created = Date();
              newNotice.type = req.body.status;
              newNotice.board_id = notice.board_id;
              newNotice.board_name = notice.board_name;
              req.body.notices.push(newNotice);
              newNotice.save(function(err) {
                if(err) throw err;
              })
              // Send to all users already in the board with a notice
              board.member_id.forEach(function(recv_id) {
                var n = new Notice();
                n.sender_id = req.currentUser._id;
                n.sender_name = req.currentUser.username;
                n.receiver_id = recv_id;
                n.created = Date();
                n.type = 'Join';
                n.board_id = notice.board_id;
                n.board_name = notice.board_name;
                req.body.notices.push(n);
                n.save(function(err) {
                  if(err) throw err;
                  User.findById(recv_id, function(err, receiver) {
                    if(receiver.hasNewNotice == false)
                    {
                      receiver.hasNewNotice = true;
                      receiver.save(function(err){
                        if(err) throw err;
                      })
                    }
                  })
                })
              });
             if(board.isShared == false)
                board.isShared = true;
              board.member_id.push(req.currentUser._id);
              board.save(function(err) {
                if(err) throw err;
              });
              next();
            });
          } else if(req.body.status == 'Reject') {
            var newNotice = new Notice();
            newNotice.sender_id = req.currentUser._id;
            newNotice.sender_name = req.currentUser.username;
            newNotice.receiver_id = notice.sender_id;
            newNotice.created = Date();
            newNotice.type = req.body.status;
            newNotice.board_id = notice.board_id;
            newNotice.board_name = notice.board_name;
            newNotice.save(function(err) {
              if(err) throw err;
              req.body.notices.push(newNotice);
              User.findById(notice.sender_id, function(err, receiver) {
                if(receiver.hasNewNotice == false)
                {
                  receiver.hasNewNotice = true;
                  receiver.save(function(err){
                    if(err) throw err;
                  })
                }
              })
              //req.body.notice = newNotice;
              next();
            })
          } else {
            res.send({error: 'Unrecognizable status!'});
            return;
          }
        });
      } else {
        // Not 'Request' notice response
      }
    } else {
      res.send({error: 'Cannot find the notice!'});
      return;
    }
  })
}

exports.createBoard = function(req, res) {
  var board = new Board();
  board.owner_id = req.currentUser._id;
  board.creator_id = req.currentUser._id;
  board.created = Date();
  board.modifier_id = req.currentUser._id;
  board.lastModified = Date();
  board.member_id.push(req.currentUser._id);
  if(req.body.boardName.replace(/^\s+/,'').replace(/\s+$/,'') != "")
    board.name = req.body.boardName;
  board.save(function(err) {
      //Failed to create a new board
      if(err) {
        console.log(err);
        res.send({
          error: 'Failed to create a new board.'
          });
        return;
      }
      // Make directory for the board data
      var boardDir = path.join(__dirname, '../public/upload/') + board.id64;
      fs.mkdir(boardDir, function(err) {
        if(err)
        {
          res.send({error: 'Failed to make directory for the board at server.'});
          return;
        };
        fs.mkdir(boardDir + '/images', function(err) {
          if(err)
          {
            res.send({error: 'Failed to make directory for the board at server.'});
            return;
          };
          fs.mkdir(boardDir + '/thumbnails', function(err) {
            if(err) throw err;
            var imagepath = path.join(__dirname, '../public/images/')
            fs.createReadStream(imagepath + 'default_board.png').pipe(
              fs.createWriteStream(boardDir + '/board.png'), function(err){
                if(err) throw err;
            });
            fs.createReadStream(imagepath + 'default_board_thumb200.png').pipe(
              fs.createWriteStream(boardDir + '/thumbnails/board_thumb200.png'), function(err){
                if(err) throw err;
            });
            fs.createReadStream(imagepath + 'default_board_thumb400.png').pipe(
              fs.createWriteStream(boardDir + '/thumbnails/board_thumb400.png'), function(err){
                if(err) throw err;
            });
            res.redirect('/boards/' + board.id64);
          })
        });
      });
    });
};

deleteFolderRecursive = function(path) {
    var files = [];
    if( fs.existsSync(path) ) {
        files = fs.readdirSync(path);
        files.forEach(function(file,index){
            var curPath = path + "/" + file;
            if(fs.statSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};
