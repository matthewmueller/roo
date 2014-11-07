/**
 * Module Dependencies
 */

var bundle = require('duo-bundle')(__dirname);
var roo = require('../');

function *auth(next) {
  console.log('authing!');
  yield next;
}

roo(__dirname)
  .compress()
  .duo('test.{js,css}')
  .static('build')
  .get('/', auth, 'test.jade')
  .directory()
  .listen(5000, function() {
    console.log('listening on: %s', this.address().port);
  });
