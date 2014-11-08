require('./models');

var en = require('int-encoder')
  , mongoose = require('mongoose')
  , Board = mongoose.model('Board')
  , User = mongoose.model('User');

// user authentication
exports.loadUser = function(req, res, next) {
  if (req.session.user_id) {
    User.findById(req.session.user_id, function(err, user) {
      if (user) {
        req.currentUser = user;
        next();
      } else {
        res.redirect('/');
      }
    });
  } else {
    res.redirect('/');
  }
};

exports.loadBoard = function(req, res, next) {
  if(req.params.id) {
    var board_id = en.decode(req.params.id, 16);
    Board.findById(board_id, function(err, board) {
      if(board) {
        if( board.member_id.indexOf(req.currentUser._id) != -1 ) {
          req.currentBoard = board;
          next();
        } else {
          res.send({error: 'Board not found!'});
        }
      }
      else {
        res.send({error: 'Board not found!'});
      }
    });
  } else {
    res.redirect('/boards');
  }
};