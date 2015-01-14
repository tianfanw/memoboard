require('../models');

var url = require("url")
  , nodemailer = require("nodemailer")
  , path = require('path')
  , fs = require('fs')
  , util = require('util')
  , en = require('int-encoder')
  , thumb = require('node-thumbnail').thumb
	, mongoose = require('mongoose')
  , User = mongoose.model('User')
  , Board = mongoose.model('Board')
  , Image = mongoose.model('Image')
  , Text = mongoose.model('Text')
  , Path = mongoose.model('Path')
  , Notice = mongoose.model('Notice')
  , Poll = mongoose.model('Poll')
  , Choice = mongoose.model('Choice');

var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "memoboard.mysun@gmail.com",
        pass: "memoboardmysun"
    }
});

exports.index = function(req, res) {
  console.log(req.currentBoard.isShared);
  if(req.currentBoard.isShared) {
    User.find({_id: {$in: req.currentBoard.member_id} }, function(err, members) {
      if(err) throw err;
      Poll.find({board_id: req.currentBoard._id}, function(err, polls) {
        if(err) throw err;
        res.render('board', {board: req.currentBoard, user: req.currentUser, members: members, polls: polls});
      });
    });
  } else {
    res.render('board', {board: req.currentBoard, user: req.currentUser});
  }  
};

exports.info = function(req, res) {
  User.findById(req.currentBoard.creator_id).select('username email').exec(function(err, creator) {
    if(err) throw err;
    if(creator) {
      User.findById(req.currentBoard.modifier_id).select('username email').exec(function(err, modifier) {
        if(err) throw err;
        if(modifier) {
          if(req.currentBoard.isShared == true){
            User.find({_id: {$in: req.currentBoard.member_id} }).select('username email').exec(function(err, members) {
              if(err) throw err;
              res.send({creator: creator, modifier: modifier, members: members});
            })
          } else {
            res.send({creator: creator, modifier: modifier});
          }
        } else {
          res.send({error: 'Cannot retrieve modifier info.'});
        }
      })
    } else {
      res.send({error: 'Cannot retrieve creator info.'});
    }
  })
}

exports.load = function(socket, data) {
  Image.find({board_id: data.board_id}).sort({created: 1}).exec(function(err, images) {
    if(err) throw err;
    console.log(images);
    Text.find({board_id: data.board_id}).sort({created: 1}).exec(function(err, texts) {
      if(err) throw err;
      Path.find({board_id: data.board_id}).sort({created: 1}).exec(function(err, paths){
        socket.emit('load', {images: images, texts: texts, paths: paths});
      }); 
    });
  });
}

exports.deleteAll = function(socket, data) {
  delAllImages = function() {
    Image.find({board_id: socket.board_id}, function(err, images) {
      if(err) throw err;
      images.forEach(function(image) {
        var localPath = path.join(__dirname, '../public') + image.path;
        fs.unlink(localPath, function (err) {
          if (err) throw err;
          image.remove(function(err){
            if(err) throw err;
          });
        });
      });
    });
  }
  
  delAllTexts = function() {
    Text.remove({board_id: socket.board_id}, function(err) {
      if(err) throw err;
    });
  }
  delAllPaths = function() {
    Path.remove({board_id: socket.board_id}, function(err) {
      if(err) throw err;
    });
  }
  delAllImages();
  delAllTexts();
  delAllPaths();
  socket.broadcast.to(socket.board_id).emit('deleteAll');
};

exports.delete = function(req, res, next) {
  // the execute ordering still needs to be taken care of...
  
  // delete all images
  delAllImages = function() {
    Image.remove({board_id: req.currentBoard._id}, function(err) {
      if(err) throw err;
    });
  }

  // delete all texts
  delAllTexts = function() {
    Text.remove({board_id: req.currentBoard._id}, function(err) {
      if(err) throw err;
    });
  }

  // delete all texts
  delAllPaths = function() {
    Path.remove({board_id: req.currentBoard._id}, function(err) {
      if(err) throw err;
    });
  }

  // delete all polls
  delAllPolls = function() {
  
    Poll.find({board_id: req.currentBoard._id}, function(err, polls) {
      if(err) throw err;
      console.log(req.currentBoard._id);
      console.log(polls);
      for(var i = 0; i < polls.length; i++)
      {
        var poll_id = polls[i]._id;
        Choice.remove({poll_id: poll_id}, function(err) {
          if(err) throw err;
          Poll.remove({_id: poll_id}, function(err) {
            if(err) throw err;
          });
        });
      }
    });
  }

  function sendLeaveNotice(recv_ids) {
    req.body.notices = [];
    recv_ids.forEach(function(recv_id) {
      var notice = new Notice();
      notice.sender_id = req.currentUser._id;
      notice.sender_name = req.currentUser.username;
      notice.receiver_id = recv_id;
      notice.created = Date(),
      notice.type = 'Leave';
      notice.board_id = req.currentBoard._id;
      notice.board_name = req.currentBoard.name;
      req.body.notices.push(notice);
      notice.save(function(err) {
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
      });
    });
  }

  if(String(req.currentBoard.owner_id) != String(req.currentUser._id)) {
    console.log(req.currentBoard.owner_id);
    console.log(req.currentUser._id);
    req.currentBoard.member_id.remove(req.currentUser._id);
    req.currentBoard.save(function(err) {
      if(err) throw err;
      sendLeaveNotice(req.currentBoard.member_id);
      next();
    })
  } else {
    console.log('Number of members');
    console.log(req.currentBoard.member_id.length);
    if(req.currentBoard.member_id.length > 1) {
      req.currentBoard.member_id.remove(req.currentUser._id);
      req.currentBoard.owner_id = req.currentBoard.member_id[0];
      req.currentBoard.save(function(err) {
        if(err) throw err;
        sendLeaveNotice(req.currentBoard.member_id);
        next();
      });
    } else {
      //delete the board
      req.currentBoard.remove(function(err) {
        if(err) throw err;
        delAllImages();
        delAllTexts();
        delAllPaths();
        delAllPolls();
        // delete all related files
        deleteFolderRecursive(path.join(__dirname, '../public/upload/') + req.currentBoard.id64);
        res.send({success: 'success'});   
      });
    }
  }
  
};

exports.share = function(req, res, next) {
  console.log(req.body);
  if(!req.body.username_email) {
    res.send({error: 'Invalid request!'});
    return;
  }
  
  function sendShareMsg(invitedUser) {
    console.log(invitedUser);
    if(invitedUser.id == req.currentUser.id) {
      res.send({error: "Cannot share with self!"});
      return;
    }
    if(req.currentBoard.member_id.indexOf(invitedUser._id) == -1) {
      // req.currentBoard.update({isShared: true, $push: {member_id: invitedUser._id} }, function(err) {
      //   if(err) throw err;
      //   res.send({email: invitedUser.email, name: invitedUser.name});
      // })
      Notice.findOne({sender_id: req.currentUser._id, receiver_id: invitedUser._id, board_id: req.currentBoard._id}, function(err, notice) {
        if(err) throw err;
        if(notice) {
          res.send({error: 'The invitation is already sent!'});
          return;
        } else {
          var newNotice = new Notice();
          newNotice.sender_id = req.currentUser._id;
          newNotice.sender_name = req.currentUser.username;
          newNotice.receiver_id = invitedUser._id;
          newNotice.created = Date();
          newNotice.type = 'Request';
          newNotice.board_id = req.currentBoard._id;
          newNotice.board_name = req.currentBoard.name;
          newNotice.save(function(err) {
            if(err) throw err;
            req.body.notices = [];
            req.body.notices.push(newNotice);
            User.findById(invitedUser._id, function(err, receiver) {
              if(receiver.hasNewNotice == false)
              {
                receiver.hasNewNotice = true;
                receiver.save(function(err){
                  if(err) throw err;
                })
              }
            })
            next();
          });
          //req.currentBoard.member_id.push(invitedUser._id);
        }
      });
    } else {
      res.send({error: 'Already shared with the user!'});
    }
  }
  User.findOne({username: req.body.username_email}, function(err, user) {
    if(err) throw err;
    if(user) {
      sendShareMsg(user);
    } else {
      User.findOne({email: req.body.username_email}, function(err, user) {
        if(err) throw err;
        if(user) {
          sendShareMsg(user);
        } else {
          res.send({error: 'Cannot find the user!'});
        }
      })
    }
  });
};

exports.uploadImage = function(req, res) {

  if(!req.files) {
    res.send({
      error: 'No file found.'
    });
    return;
  };
  if(!req.files.uploadedImage) {
    res.send({
      error: 'No file found.'
    });
    return;
  };
  console.log(req.files.uploadedImage);
  if(req.files.uploadedImage.type.indexOf('image') == -1) {
    res.send({
      error: 'Invalid image type.'
    });
    return;
  }

  var image = new Image();
  image.board_id = req.currentBoard._id;
  image.created = Date();
  image.name = req.files.uploadedImage.name;
  var ext = image.name.split('.').pop();
  var serverPath = '/upload/' + req.params.id + '/images/' + image._id.toHexString() + '.' + ext;
  var localPath = path.join(__dirname, '../public') + serverPath;
  image.path = serverPath;

  var is = fs.createReadStream(req.files.uploadedImage.path)
  var os = fs.createWriteStream(localPath);

  util.pump(is, os, function() {
    fs.unlink(req.files.uploadedImage.path, function (err) {
      if(err) {
        console.log(err);
        res.send({
          error: 'Ah crap! Something bad happened'
          });
        return;
      }
      image.save(function(error) {
        if(error) {
          res.send({
            error: 'Failed to save image.'
          });
          return;
        }
        res.send({
          image: image
        });
        console.log('successfully deleted' + req.files.uploadedImage.path);
      });
    });
  });
};

exports.addA = function(socket, data, callback) {
  Board.findById(socket.board_id, function(err, board){
    board.lastModified = Date();
    board.modifier_id = socket.user_id;
    board.save(function(err){
      if(err) throw err;
    });
  });
  if(data.type == "image") {
      // the routine of adding an image is a bit different:
      // since websocket does not support binary file transmission, the image file
      // need to be submitted from form first, and then use socket to broadcast
      Image.findById(data.id, function(err, image){
        if(err) throw err;
        if(image) {
          // no need to send to the adder, only send to other users
          socket.broadcast.to(socket.board_id).emit('add', {type: 'image', data: image});
          if(callback && typeof(callback) === "function") {  
            callback();  
          }
        }
        else {
        }
      });
    } else if(data.type == 'text') {
      var text = new Text();
      for(attr in data.data)
        text[attr] = data.data[attr];
      text.board_id = socket.board_id;
      text.created = Date();
      text.save(function(err) {
        if(err) throw err;
        socket.emit('add', {type: 'text', data: text});
        socket.broadcast.to(socket.board_id).emit('add', {type: 'text', data: text});
        if(callback && typeof(callback) === "function") {  
          callback();  
        }
      });
    } else if(data.type == 'path') {
      var cpath = new Path();
      for(attr in data.data)
        cpath[attr] = data.data[attr];
      cpath.board_id = socket.board_id;
      cpath.created = Date();
      cpath.save(function(err) {
        if(err) throw err;
        socket.emit('setpathname', {type: 'path', data: cpath});
        socket.broadcast.to(socket.board_id).emit('add', {type: 'path', data: cpath});
        if(callback && typeof(callback) === "function") {  
          callback();  
        }
      })
    }
};

exports.deleteImage = function(req, res) {
  if(!req.body.imagePath) {
    res.send({
      error: 'Invalid request!'
    });
    return;
  };
  var imagePath = req.body.imagePath;

  Image.findOne({board_id: req.currentBoard._id, path: imagePath }, function(err, image) {
    if(err) throw err;
    if(image) {
      var localPath = path.join(__dirname, '../public') + imagePath;
      fs.unlink(localPath, function (err) {
        if (err) {
          res.send({error: 'Failed to delete image.'});
          return;
        }
        image.remove(function(err){
          if(err) {
            res.send({error: 'Failed to delete image.'});
            return;
          }
          res.send({success: 'success'});
        });
      });
    } else {
      res.send({error: 'Cannot find the image!'});
    }
  });
};

exports.updateA = function(socket, data, callback) {
  Board.findById(socket.board_id, function(err, board){
    board.lastModified = Date();
    board.modifier_id = socket.user_id;
    board.save(function(err){
      if(err) throw err;
    });
  });
  if(data.type == 'image') {
    Image.findById(data.data.id, function(err, image) {
      if(err) throw err;
      if(image) {
        if(image.board_id != socket.board_id) {
          // If the image doesn' belong to the board>
          console.log(image.board_id);
          console.log(socket.board_id);
        } else {
          for(attr in data.data)
            image[attr] = data.data[attr];
          image.save(function(err) {
            if(err) throw err;
            console.log('OK');
            if(callback && typeof(callback) === "function") {  
              callback();  
            }
          })
        }
      } else {
        console.log('Cannot find the image!');
      }
    })
  } else if (data.type == 'text') {
    Text.findById(data.data.id, function(err, text) {
      if(err) throw err;
      if(text) {
        if(text.board_id != socket.board_id) {
          console.log(text.board_id);
          console.log(socket.board_id);
        } else {
          for(attr in data.data)
            text[attr] = data.data[attr];
          text.save(function(err) {
            if(err) throw err;
            console.log('OK');
            if(callback && typeof(callback) === "function") {  
              callback();  
            }
          })
        }
      } else {
        console.log('Cannot find the text!');
      }
    });
  } else if (data.type == 'path') {
    Path.findById(data.data.id, function(err, cpath) {
      if(err) throw err;
      if(cpath) {
        if(cpath.board_id != socket.board_id) {
          console.log(cpath.board_id);
          console.log(socket.board_id);
        } else {
          for(attr in data.data)
            cpath[attr] = data.data[attr];
          cpath.save(function(err) {
            if(err) throw err;
            console.log('OK');
            if(callback && typeof(callback) === "function") {  
              callback();  
            }
          })
        }
      } else {
        console.log('Cannot find the cpath!');
      }
    })
  }
}

exports.deleteA = function(socket, data, callback) {
  Board.findById(socket.board_id, function(err, board){
    board.lastModified = Date();
    board.modifier_id = socket.user_id;
    board.save(function(err){
      if(err) throw err;
    });
  });
  if(data.type == 'image')
  {
    console.log(data.id);
    Image.findById(data.id, function(err, image) {
      if(err) throw err;
      if(image) {
        if(image.board_id != socket.board_id) // If the image doesn' belong to the board
        {
          console.log(image.board_id);
          console.log(socket.board_id);
        }
        else {
          var localPath = path.join(__dirname, '../public') + image.path;
          fs.unlink(localPath, function (err) {
            if (err) {
              socket.emit('error', {error: 'Failed to delete image.'});
              return;
            }
            image.remove(function(err){
              if(err) {
                socket.emit('error', {error: 'Failed to delete image.'});
                return;
              }
              socket.emit('delete', {type: 'image', id: image._id});
              socket.broadcast.to(socket.board_id).emit('delete', {type: 'image', id: image._id});
              if(callback && typeof(callback) === "function") {  
                callback();  
              }  
            });
          });
        }
      }
      else {
        socket.emit('error', {error: 'Cannot find the image!'});
      }
    });
  } else if(data.type == 'text') {
    console.log(data.id);
    Text.findById(data.id, function(err, text) {
      if(err) throw err;
      if(text) {
        if(text.board_id != socket.board_id)
        {
          console.log(text.board_id);
          console.log(socket.board_id);
        }
        else {  
          text.remove(function(err){
            if(err) {
              socket.emit('error', {error: 'Failed to delete text.'});
              return;
            }
            socket.emit('delete', {type: 'text', id: text._id});
            socket.broadcast.to(socket.board_id).emit('delete', {type: 'text', id: text._id});
            if(callback && typeof(callback) === "function") {  
              callback();  
            }  
          });
        }
      }
      else {
        socket.emit('error', {error: 'Cannot find the text!'});
      }
    });
  } else if(data.type == 'path') {
    console.log(data.id);
    Path.findById(data.id, function(err, cpath) {
      if(err) throw err;
      if(cpath) {
        if(cpath.board_id != socket.board_id)
        {
          console.log(cpath.board_id);
          console.log(socket.board_id);
        }
        else {  
          cpath.remove(function(err){
            if(err) {
              socket.emit('error', {error: 'Failed to delete path.'});
              return;
            }
            socket.emit('delete', {type: 'path', id: cpath._id});
            socket.broadcast.to(socket.board_id).emit('delete', {type: 'path', id: cpath._id});
            if(callback && typeof(callback) === "function") {  
              callback();  
            }  
          });
        }
      }
      else {
        socket.emit('error', {error: 'Cannot find the path!'});
      }
    });
  }
};

exports.changeBackground = function(socket, data) {
  console.log(data);
  Board.findById(socket.board_id, function(err, board) {
    board.bgColor = data.data.bgColor;
    board.bgImage = data.data.bgImage;
    board.save(function(err) {
      if(err) throw err;
      socket.broadcast.to(socket.board_id).emit('changeBackground', data);
    })
  });
};

exports.updatePng = function(socket, img) {
  var data = img.replace(/^data:image\/\w+;base64,/, "");
  var buf = new Buffer(data, 'base64');
  var boardpath = path.join(__dirname, ('../public/upload/' + en.encode(socket.board_id, 16)));
  var thumbpath = boardpath + '/thumbnails/';
  fs.writeFile(boardpath + '/board.png', buf, function(err){
    if(err) throw err;
    thumb({
      suffix: '_thumb200',
      width: 200,
      height: 300,
      source: boardpath,
      destination: thumbpath,
      overwrite: true,
    }, function(err) {
      if(err) throw err;
    });
    thumb({
      suffix: '_thumb400',
      width: 400,
      height: 600,
      source: boardpath,
      destination: thumbpath,
      overwrite: true,
    }, function(err) {
      if(err) throw err;
    });
  });
};

exports.newPoll = function(req, res) {
  if(!req.currentBoard.isShared) {
    res.send({error: 'Not shared board!'});
    return;
  }
  var poll = new Poll();
  poll.board_id = req.currentBoard._id;
  poll.promoter_id = req.currentUser._id;
  poll.title = req.body.title;
  poll.description = req.body.description;
  poll.location = req.body.location;
  // if(req.body.title.replace(/^\s+/,'').replace(/\s+$/,'') != "") {
  //   poll.title = req.body.title;
  // }
  // var choices = new Array();
  for(var i=0; i < req.body.dates.length; i++) {
    var choice = new Choice();
    choice.poll_id = poll._id;
    choice.date = Date.parse(req.body.dates[i]);
    console.log(choice.date);
    choice.save(function(err) {
     if(err) throw err;
    });
    // choices.push(choice);
  }
  poll.save(function(err) {
    if(err) throw err;
  })
  res.send({poll_id: poll._id, poll_title: poll.title});
};

exports.updatePoll = function(req, res) {
  //req.body.poll_id,
  //req.body.choice_id;
  Choice.find({_id: req.body.choice_id}, function(err, choices) {
    choices.forEach(function(choice) {
      choice.voters.voter_username = req.currentUser.username;
      choice.voters.voter_id = req.currentUser._id;
      choice.save(function(err) {
        if(err) throw err;
      }) 
    })
  })
  res.send({success: 'success'});
};

exports.getPoll = function(req, res) {
  var parts = url.parse(req.url, true);
  console.log(parts);
  console.log(req.params);
  if(!parts.query.poll_id) { // get all polls
    Poll.find({board_id: req.currentBoard._id}, function(err, polls) {
      if(err) throw err;
      res.send({polls: polls});
    })
  } else {
    Poll.findById(parts.query.poll_id, function(err, poll) {
      if(err) throw err;
      Choice.find({poll_id: parts.query.poll_id}, function(err, choices){
        if(err) throw err;
        User.find({_id: {$in: req.currentBoard.member_id}}).select('username email').exec(function(err, members) {
          if(err) throw err;
          res.send({poll: poll, choices: choices, members:members});
        })
      })
    });
  }
};

exports.deletePoll = function(req, res) {
  if(!req.currentBoard.isShared) {
    res.send({error: 'Not shared board!'});
    return;
  }
  if(!req.body.poll_id) {
    res.send({error: 'Invalid request!'});
    return;
  }

  Poll.findOne({_id: req.body.poll_id, board_id: req.currentBoard._id}, function(err, poll) {
    if(err) throw err;
    if(poll) {
      if(poll.promoter_id != req.currentUser.id) {
        res.send({error: 'Invalid request!'});
        return;
      }
      if(req.body.dates) {
        User.find({_id: {$in: req.currentBoard.member_id} }, function(err, members){
          var msg = "Dear user,\nthe following event is decided by polling on Board " + req.currentBoard.name +
          ":\nTitle: " + poll.title  + "\nLocation: " + poll.location + "\nDescription: " + poll.description + "\nDates: ";
          req.body.dates.forEach(function(date) {
            msg += date + ",";
          })
          msg += "\nMembers: ";
          members.forEach(function(member){
            msg += member.username + ",";
          })
          var html_msg = "<p>Dear user,<br>the following event is decided by polling on Board " + req.currentBoard.name +
          ":<br>Title: " + poll.title  + "<br>Location: " + poll.location + "<br>Description: " + poll.description + "<br>Dates: ";
          req.body.dates.forEach(function(date) {
            html_msg += date + ",";
          })
          html_msg += "<br>Members: ";
          members.forEach(function(member){
            html_msg += member.username + ",";
          })
          html_msg += "<p>";
          var mailto = new String();
          members.forEach(function(member){
            mailto += member.email + ",";
          })
          var mailOptions = {
            from: "Mysun", // sender address
            to: mailto, // list of receivers
            subject: "New event decided by polling", // Subject line
            text: msg, // plaintext body
            html: html_msg // html body
          }
          smtpTransport.sendMail(mailOptions, function(error, response){
            if(error){
                console.log(error);
            }else{
                console.log("Message sent: " + response.message);
            }
          });
        });
      }
      Choice.find({poll_id: poll._id}).remove(function(err) {
        if(err) {
          res.send({error: 'Failed to delete the poll!'});
          return;
        }
        poll.remove(function(err) {
          if(err) {
            res.send({error: 'Failed to delete the poll!'});
          }
          res.send({success: 'success'});
        });
      });
    } else {
      res.send({error: 'Cannot find the poll!'});
    }
  })
}