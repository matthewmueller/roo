/**
 * Module Dependencies
 */

var request = require('supertest');
var assert = require('assert');
var Roo = require('roo');

/**
 * Tests
 */

describe('Roo', function() {

  describe('routing', function() {

    it('should support GET requests', function(done) {
      var roo = Roo(__dirname);
      roo.get('/user', function *() {
        this.body = 'matt';
      });

      request(roo.listen())
        .get('/user')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          assert(res.text == 'matt');
          done();
        })
    })

    it('should suport post requests', function(done) {
      var roo = Roo(__dirname);
      roo.post('/user', function *() {
        this.body = 'matt';
      });

      request(roo.listen())
        .post('/user')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          assert(res.text == 'matt');
          done();
        })
    })

    it('should support parameters', function(done) {
      var roo = Roo(__dirname);
      roo.post('/:user', function *() {
        assert('matt' == this.params.user)
        this.body = 'matt';
      });

      request(roo.listen())
        .post('/matt')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          assert(res.text == 'matt');
          done();
        })
    });

    it('should render jade', function(done) {
      var roo = Roo(__dirname);
      roo.get('/user', function *() {
        this.body = yield roo.render('./fixtures/jade/index.jade');
      });

      request(roo.listen())
        .get('/user')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          assert(res.text == '<h1>header</h1><h2>hi</h2>');
          done();
        })
    })
  });

  it('should response to /', function() {

  })

});
