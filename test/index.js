/**
 * Module Dependencies
 */

var stdout = require('catch-stdout');
var request = require('supertest');
var assert = require('assert');
var path = require('path');
var extname = path.extname;
var Roo = require('../');

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

  describe('logger([fn])', function() {
    it('should log when true', function(done) {
      var roo = Roo(__dirname)
        .logger()
        .get('/user', function *() { this.body = 'user'; });

      var restore = stdout();

      request(roo.listen())
        .get('/user')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          assert('user' == res.text);
          var value = restore();
          assert(~value.indexOf('<--'))
          assert(~value.indexOf('GET'))
          assert(~value.indexOf('/user'))
          assert(~value.indexOf('-->'))
          assert(~value.indexOf('GET'))
          assert(~value.indexOf('/user'))
          assert(~value.indexOf('200'))
          done();
        })

    });
  });

  it('should support filtering', function(done) {
    var roo = Roo(__dirname)
      .logger(filter)
      .get('/user', function *() { this.body = 'user'; })
      .get('/user.js', function *() { this.body = 'posts'; });

    var server = roo.listen();

    var a = stdout();
    request(server)
      .get('/user')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        assert('user' == res.text);
        var value = a();
        assert(value.length);

        var b = stdout();
        request(server)
          .get('/user.js')
          .expect(200)
          .end(function(err, res) {
            if (err) return done(err);
            var value = b();
            assert(!value.length);
            done();
          })
      })

    function filter(ctx) {
      return extname(ctx.url) ? false : true;
    }
  })
});
