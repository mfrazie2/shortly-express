var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  initialize: function() {
    this.on('creating', function(model, attributes, options) {
      var password = model.get('password');
      var salt = bcrypt.genSaltSync(10);
      var hash = bcrypt.hashSync(password, salt);
      model.set('password', hash);
    }
    // this.on('creating', function(model, attributes, options) {
    //   bcrypt.genSalt(10, function(err, salt) {
    //     var password = model.get('password');
    //     bcrypt.hash(password, salt, function(err, hash) {
    //       model.set('password', hash);
    //     });
    //   });
    // });
  )}
});

module.exports = User;
