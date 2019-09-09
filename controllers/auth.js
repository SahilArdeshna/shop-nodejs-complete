const crypto = require('crypto');
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator');
const User = require("../models/User");

const transporter = nodemailer.createTransport(sendgridTransport({
  auth: {
    api_key: `${process.env.SENDGRID_KEY}`
  }
}));

exports.getLogin = (req, res, next) => {  
  let message = req.flash('error');

  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render("auth/login", {
    pageTitle: "Login",
    path: "/login",
    isAuthenticated: false,
    errorMessage: message,
    oldInput: { email: '', password: '' },
    validationErrors: []
  });  
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');

  if (message) {
    message = message[0];
  } else {
    message = null
  }
   
  res.render("auth/signup", {
    pageTitle: "Signup",
    path: "/signup",
    isAuthenticated: false,
    errorMessage: message,
    oldInput: { email: '', password: '', confirmPassword: '' },
    validationErrors: []
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      pageTitle: "Login",
      path: "/login",
      isAuthenticated: false,
      errorMessage: errors.array()[0].msg,
      oldInput: { email, password },
      validationErrors: errors.array()
    });
  }

  User.findOne({ email })
    .then(user => {
      if (!user) {
        return res.status(422).render("auth/login", {
          pageTitle: "Login",
          path: "/login",
          isAuthenticated: false,
          errorMessage: 'Invalid email or password',
          oldInput: { email, password },
          validationErrors: []
        });
      }

      bcrypt.compare(password, user.password)
        .then(doMatch => {     
          if (doMatch) {            
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              res.redirect("/");
            });
          } 

          return res.status(422).render("auth/login", {
            pageTitle: "Login",
            path: "/login",
            isAuthenticated: false,
            errorMessage: 'Invalid email or password',
            oldInput: { email, password },
            validationErrors: []
          });
        }); 
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStutusCode = 500;
      return next(error);
    });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('auth/signup', {
      pageTitle: 'Signup',
      path: '/signup',
      isAuthenticated: false,
      errorMessage: errors.array()[0].msg,
      oldInput: { email, password, confirmPassword },
      validationErrors: errors.array()
    });
  }

  bcrypt.hash(password, 10)
    .then(hashPassword => {
      const user = new User({
        email,
        password: hashPassword,
        cart: { items: [] }
      });
      return user.save();
    })
    .then(result => {
      res.redirect("/login");
      return transporter.sendMail({
        to: email,
        from: 'node-course@gmail.com',
        subject: 'Signup succeeded!',
        html: '<h1>You successfully signed up!</h1>'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStutusCode = 500;
      return next(error);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect("/");
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');

  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message    
  });
};  

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      return res.redirect('/reset');
    }

    const token = buffer.toString('hex');
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          req.flash('error', 'No account with that email found!');
          return res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then(result => {
        res.redirect('/');
          transporter.sendMail({
            to: req.body.email,
            from: 'node-course@gmail.com',
            subject: 'Password Reset',
            html: `
              <P>You requested a password reset</P>
              <P>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</P>
            `
          });
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStutusCode = 500;
        return next(error);
      });
  });
};
 
exports.gotNewPassword = (req, res, next) => {
  let message = req.flash('error');
  const token = req.params.token;

  if (message.length > 0 ) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/new-password', {
    pageTitle: 'New Password',
    path: '/reset/new-password',
    errorMessage: message,
    token
  });
};

exports.postNewPassword = (req, res, next) => {
  const token = req.params.token;
  const newPassword = req.body.password;
  let resetUser;

  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then(user => {
      resetUser = user;
      return bcrypt.hash(newPassword, 10)               
    })
    .then(hashPassword => {
      resetUser.password = hashPassword;
      resetUser.resetToken = null;
      resetUser.resetTokenExpiration = null; 
      return resetUser.save();
    })
    .then(result => {
      console.log('PASSWORD CHANGED!');
      res.redirect('/login');
    })  
    .catch(err => {
      const error = new Error(err);
      error.httpStutusCode = 500;
      return next(error);
    });
};