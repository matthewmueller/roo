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
      var roo = Roo()
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
      var roo = Roo()
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
      var roo = Roo()
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

  describe('errors', (done) => {
    it('should handle unexpected errors', (done) => {
      var roo = Roo()
      roo.post('/:user', function * () {
        oh.dear.lol
      })

      request(roo.listen())
        .post('/matt')
        .expect(500)
        .end(function (err, res) {
          if (err) return done(err)
          assert.equal(res.body.message, 'oh is not defined')
          assert.equal(res.status, 500)
          done()
        })
    })

    it('should handle thrown errors', (done) => {
      var roo = Roo()
      roo.post('/:user', function * () {
        this.throw(403)
      })

      request(roo.listen())
        .post('/matt')
        .expect(403)
        .end(function (err, res) {
          if (err) return done(err)
          assert.equal(res.body.message, 'Forbidden')
          assert.equal(res.status, 403)
          done()
        })
    })

    it('should handle custom messages', (done) => {
      var roo = Roo()
      roo.post('/:user', function * () {
        this.throw(403, 'you shall not pass')
      })

      request(roo.listen())
        .post('/matt')
        .expect(403)
        .end(function (err, res) {
          if (err) return done(err)
          assert.equal(res.body.message, 'you shall not pass')
          assert.equal(res.status, 403)
          done()
        })
    })

    it('should handle 404s', (done) => {
      var roo = Roo()
      request(roo.listen())
        .post('/matt')
        .expect(404)
        .end(function (err, res) {
          if (err) return done(err)
          assert.equal(res.body.message, 'Not Found')
          assert.equal(res.status, 404)
          done()
        })
    })
  })
})
