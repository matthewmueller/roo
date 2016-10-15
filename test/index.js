/**
 * Module Dependencies
 */

var request = require('supertest')
var assert = require('assert')
var Roo = require('../')

/**
 * Tests
 */

describe('Roo', function () {
  describe('roo.mount(path, roo)', function () {
    it('should support mounting other roo apps', function (done) {
      var a = Roo()
      var b = Roo()
      a.mount('/a', b)
      b.get('/b', function *() {
        this.body = 'from b'
      })

      request(a.listen())
        .get('/a/b')
        .expect(200)
        .expect('from b', done)
    })

    it('mount should work recursively', function (done) {
      var a = Roo()
      var b = Roo()
      var c = Roo()

      c.get('/c', function *() {
        this.body = 'from c'
      })

      b.mount('/', c)
      a.mount('/', b)

      request(a.listen())
        .get('/c')
        .expect(200)
        .expect('from c', done)
    })

    it('mount should work recursively (order shouldnt matter)', function (done) {
      var a = Roo()
      var b = Roo()
      var c = Roo()

      c.get('/c', function *() {
        this.body = 'from c'
      })

      a.mount('/', b)
      b.mount('/', c)

      request(a.listen())
        .get('/c')
        .expect(200)
        .expect('from c', done)
    })
  })

  describe('routing', function () {
    it('should support GET requests', function (done) {
      var roo = Roo(__dirname)
      roo.get('/user', function *() {
        this.body = 'matt'
      })

      request(roo.listen())
        .get('/user')
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)
          assert(res.text == 'matt')
          done()
        })
    })

    it('should suport post requests', function (done) {
      var roo = Roo(__dirname)
      roo.post('/user', function *() {
        this.body = 'matt'
      })

      request(roo.listen())
        .post('/user')
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)
          assert(res.text == 'matt')
          done()
        })
    })

    it('should support parameters', function (done) {
      var roo = Roo(__dirname)
      roo.post('/:user', function *() {
        assert('matt' == this.params.user)
        this.body = 'matt'
      })

      request(roo.listen())
        .post('/matt')
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)
          assert(res.text == 'matt')
          done()
        })
    })
  })
})
