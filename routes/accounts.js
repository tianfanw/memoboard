require('../models');

var mongoose = require('mongoose')
  , nodemailer = require("nodemailer")
  , User = mongoose.model('User')
  , Board = mongoose.model('Board');

var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "memoboard.mysun@gmail.com",
        pass: "memoboardmysun"
    }
});

var forms = require('forms'),
    fields = forms.fields,
    validators = forms.validators,
    widgets = forms.widgets;

var login_form = forms.create({
  username_email: fields.string({required: true, label: 'Username/Email:'}),
  password: fields.password({required: true, label: 'Password:'})
});

var reg_form = forms.create({
  username: fields.string({required: true, label: 'Username:', validators: [validators.minlength(6), validators.maxlength(20), isUniqueUsername]}),
  email: fields.email({required: true, label: 'Email:', validators: [isUniqueEmail]}),
  password: fields.password({required: true, label: 'Password:', validators: [validators.minlength(6), validators.maxlength(20)]}),
  confirm:  fields.password({
      required: true,
      label: 'Confirm your password:',
      validators: [validators.matchField('password')]
  }),
});

function isUniqueUsername(form, field, callback) {
  User.findOne({username: field.data}, function(err, user) {
    if(err) throw err;
    if(user) {
      callback('Your username is used.');
    } else {
      callback();
    }
  });
};

function isUniqueEmail(form, field, callback) {
  User.findOne({email: field.data}, function(err, user) {
    if(err) throw err;
    if(user) {
      callback('Your email is used.');
    } else {
      callback();
    }
  });
};

exports.index = function(req, res){
  console.log(validators);
  if (req.session.user_id) {
    User.findById(req.session.user_id, function(err, user) {
      if (user) {
        req.currentUser = user;
        res.redirect('/boards');
      } 
      else
        res.render('index', { title: 'Memoboard', login_form: login_form.toHTML(), reg_form: reg_form.toHTML() });
    });
  }
  else
    res.render('index', { title: 'Memoboard', login_form: login_form.toHTML(), reg_form: reg_form.toHTML() });
};

exports.login = function(req, res) {
  login_form.handle(req, {
    success: function(form) {
      console.log(form);
      User.findOne({ email: form.data.username_email }, function(err, user) {
        if (user) {
           if(user.authenticate(form.data.password)) {
            req.session.user_id = user.id;
            res.redirect('/boards');
          } else { // Invalid username/password
              form.fields.username_email.error = 'Invalid username/email or password.';
              res.render('index', { title: 'Memoboard', login_form: form.toHTML(), reg_form: reg_form.toHTML() });
              //res.redirect('/');
          }
        } else {
          User.findOne({username: form.data.username_email }, function(err, user) {
            if(user) {
              if(user.authenticate(form.data.password)) {
                req.session.user_id = user.id;
                res.redirect('/boards');
              } else { // Invalid username/password
                  form.fields.username_email.error = 'Invalid username/email or password.';
                  res.render('index', { title: 'Memoboard', login_form: form.toHTML(), reg_form: reg_form.toHTML() });
                  //res.redirect('/');
                }
            } else {
              // Invalid username/password
              form.fields.username_email.error = 'Invalid username/email or password.';
              res.render('index', { title: 'Memoboard', login_form: form.toHTML(), reg_form: reg_form.toHTML() });
              //res.redirect('/');
            }
          });
        }
      }); 
    },
    other: function(form) {
      console.log(form);
      res.render('index', { title: 'Memoboard', login_form: form.toHTML(), reg_form: reg_form.toHTML() });
    }
  });
  
};

exports.logout = function(req, res) {
  if (req.session) {
    req.session.destroy(function() {});
  }
  res.redirect('/');
};

exports.register = function(req, res) {

  reg_form.handle(req, {
    success: function (form) {
      
      var user = new User();
      user.email = form.data.email;
      user.username = form.data.username;
      user.password = form.data.password;
      user.save(function(err) {
        if (err){
          form.fields.email.error = 'Failed to register.';
          res.render('index', { title: 'Memoboard', login_form: login_form.toHTML(), reg_form: form.toHTML() });
        } 
        switch (req.params.format) {
          case 'json':
            res.send(user.toObject());
          break;

          default:
            req.session.user_id = user.id;
            var mailOptions = {
              from: "Mysun", // sender address
              to: user.email, // list of receivers
              subject: "Welcome to Memoboard!", // Subject line
              text: "Dear " + user.username + ":\n\n\nWelcome to Memoboard! Hope you enjoy it!\n\n\n Group Mysun", // plaintext body
              html: "<p>Dear" + user.username + ":<br><br><br>Welcome to Memoboard! Hope you enjoy it!<br><br><br> Group Mysun</p>" // html body
            }
            smtpTransport.sendMail(mailOptions, function(error, response){
              if(error){
                  console.log(error);
              }else{
                  console.log("Message sent: " + response.message);
              }
            });
            res.redirect('/boards');
        }
      });
        // there is a request and the form is valid
        // form.data contains the submitted data
    },
    other: function (form) {
        // the data in the request didn't validate,
        // calling form.toHTML() again will render the error messages
        res.render('index', { title: 'Memoboard', login_form: login_form.toHTML(), reg_form: form.toHTML() });
    },
    // empty: function (form) {
    //     // there was no form data in the request
    //     res.render('index', { title: 'Memoboard', reg_form: reg_form.toHTML() });
    // }
  });
};