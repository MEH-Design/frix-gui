const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressSession = require('express-session');
const passport = require('passport');
const passportLocal = require('passport-local');
const connectEnsureLogin = require('connect-ensure-login');
const frix = require('frix');
const fs = require('then-fs');
const db = require('../db');
const wwwRedirect = require('../wwwRedirect');
const convertToSchema = require('../convertToSchema');
const guiRoot = __dirname.replace('tasks', 'gui');
const gutil = require('gulp-util');

// login
module.exports = () => {
  let app = express();
  app.use(cookieParser());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(expressSession({ secret: '|=|2!><', resave: false, saveUninitialized: false }));
  app.set('trust proxy', true);
  app.use(wwwRedirect);

  if(db) {
    initPassport(app);
  } else {
    function emptyMiddleware() {
      return function(req, res, next) {
        if(req.headers.host === 'localhost:61824') {
          next();
        } else {
          gutil.log(`Cannot run without password.js from anything other than localhost on port 61824.\nYour current host is ${req.headers.host}.`);
        }
      }
    };
    passport.authenticate = emptyMiddleware;
    connectEnsureLogin.ensureLoggedIn = emptyMiddleware;
  }

  app.get('/login', (req, res) => {
    res.sendFile(`${guiRoot}/login.html`);
  });

  app.get('/style.css', (req, res) => {
    res.sendFile(`${guiRoot}/style.css`);
  });

  app.get('/script.js', (req, res) => {
    res.sendFile(`${guiRoot}/script.js`);
  });

  app.get('/editor.js', (req, res) => {
    res.sendFile(`${guiRoot}/editor.js`);
  });

  app.post('/login',
    passport.authenticate('local', { failureRedirect: '/login#failed' }),
    (req, res) => {
      res.redirect('/login#success');
    }
  );

  app.post('/schema',
   connectEnsureLogin.ensureLoggedIn(),
    (req, res) => {
      let contentFile = frix.api.keys[req.body.page].content;
      fs.readFile(frix.api.getOpt().root + 'content/' + contentFile)
      .then(JSON.parse)
      .then((content) => {
        try {
          let result = JSON.stringify({
            data: JSON.stringify(content),
            schema: convertToSchema(req.body.page, content)
          }, null, 4);
          res.json(JSON.parse(result));
        } catch (e) {
          console.log(e);
        }
      });
    }
  );

  app.post('/write',
   connectEnsureLogin.ensureLoggedIn(),
    (req, res) => {
      let contentFile = frix.api.keys[req.body.page].content;
      fs.writeFile(frix.api.getOpt().root + 'content/' + contentFile, JSON.stringify(req.body.data, null, 4))
      .then(() => {
        res.json({
          success: true
        });
      });
    }
  );

  app.get('/editor',
   connectEnsureLogin.ensureLoggedIn(),
    (req, res) => {
      res.sendFile(`${guiRoot}/editor.html`);
    }
  );

  app.get('/pages',
   connectEnsureLogin.ensureLoggedIn(),
    (req, res) => {
      res.json(frix.api.keys);
    }
  );

  app.get('/',
   passport.authenticate('local', { failureRedirect: '/login' }),
    (req, res) => {
      res.redirect('/editor');
    }
  );

  app.listen(61824);
};

function initPassport(app) {
  passport.use(new passportLocal.Strategy(function(username, password, cb) {
    db.findByUsername(username, function(err, user) {
      if (err) { return cb(err); }
      if (!user) { return cb(null, false); }
      if (user.password != password) { return cb(null, false); }
      return cb(null, user);
    });
  }));

  passport.serializeUser(function(user, cb) {
    cb(null, user.id);
  });

  passport.deserializeUser(function(id, cb) {
    db.findById(id, function (err, user) {
    if (err) { return cb(err); }
      cb(null, user);
    });
  });

  app.use(passport.initialize());
  app.use(passport.session());
}
