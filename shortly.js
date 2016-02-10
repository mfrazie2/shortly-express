var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var util2 = require('util');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

// Express session
app.use(session({
  genid: function(req) {
    return 1;
  },
  secret: 'ILLINI'
}));


app.get('/',
function(req, res) {
  req.session.reload(function(err) {
    if(req.session.isValid === true) {
      res.render('index');
    } else {
      res.redirect('login')
    }
  });
  // restrict(req, res, function(res) {
  //   res.render('index');
  // });
  // // sess = req.session;
});

app.get('/create',
function(req, res) {
  req.session.reload(function(err) {
    if(req.session.isValid === true) {
      res.render('index');
      // res.end();
    } else {
      res.redirect('login');
    }
  });
  // restrict(req, res, function(res) {
  //   res.render('create');
  // });
  // sess = req.session;
  // res.render('create');
});

app.get('/links',
function(req, res) {
  req.session.reload(function(err) {
    if(req.session.isValid === true) {
      Links.reset().fetch().then(function(links) {
      res.send(200, links.models);
    });
    } else {
      res.redirect('login')
    }
  });


});

app.post('/links',
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
// function restrict(req, res, callback) {
//   if(sess && sess.username && sess.username === req.body.username) {
//     callback(res);
//   } else {
//     req.session.error = "Access Denied!";
//     res.redirect("/login");
//   }
// }

app.get("/login", function(req, res) {
  // sess = req.session;

  res.render('login');
});

app.get("/signup", function(req, res) {
  // sess = req.session;
  res.render('signup');
});

app.get('/logout', function(req, res) {
  req.session.destroy(function(err){
    res.redirect('/login');
  });
});

app.post("/signup", function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  new User({ username: username }).fetch().then(function(found) {
    if (found) {
      // To Do : Username already picked
      //res.send(200, found.attributes);
    } else {
      var user = new User({
        username: username,
        password: password
      });

      user.save().then(function(newUser) {
        Users.add(newUser);
        res.redirect('/login');
      });
    }
  });
});

app.post("/login", function(req, res) {
  sess = req.session;
  // get username/password from page
  var username = req.body.username;
  var password = req.body.password;
  // username exist?
    // check password against hash
  // check agains db
  new User({ username: username }).fetch().then(function(found) {
    if (found) {
      if (found.comparePassword(password)) {
        req.session.regenerate(function() {
          req.session.isValid = true;
          req.session.save(function(err) {});
        });
        res.redirect('/');
      }
    } else {
      res.redirect('/login');
    }
  });
});

//app.get();
/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  // sess = req.session;
  req.session.reload(function(err) {
    if(req.session.isValid === true) {



    new Link({ code: req.params[0] }).fetch().then(function(link) {
      if (!link) {
        res.redirect('/');
      } else {
        var click = new Click({
          link_id: link.get('id')
        });

        click.save().then(function() {
          db.knex('urls')
            .where('code', '=', link.get('code'))
            .update({
              visits: link.get('visits') + 1
            }).then(function() {
              return res.redirect(link.get('url'));
            });
        });
      }
    });



  } else {
    res.redirect('/login');
  }
});
});

console.log('Shortly is listening on 4568');
app.listen(4568);
