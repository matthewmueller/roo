/**
 * Module Dependencies
 */

var Browserify = require('browserify');
var stdout = require('catch-stdout');
var request = require('supertest');
var assert = require('assert');
var path = require('path');
var extname = path.extname;
var Roo = require('../');
var duo = require('duo');
var fs = require('fs');
var join = path.join;

/**
 * Tests
 */

describe('Roo', function() {

  describe('roo.favicon(path)', function() {
    it('should support favicons', function(done) {
      var roo = Roo(__dirname);
      roo.favicon('./fixtures/favicon/favicon.ico');
      request(roo.listen())
        .get('/favicon.ico')
        .expect(200)
        .end(done);
    })
  });

  describe('roo.auth(user, pass)', function() {
    it('should support basic auth', function(done) {
      var roo = Roo(__dirname);

      // custom basic auth error
      roo.use(function *(next) {
        try {
          yield next;
        } catch (err) {
          if (401 == err.status) {
            this.status = 401;
            this.body = 'nope.';
          } else {
            throw err;
          }
        }
      });

      roo.auth('user', 'pass');

      roo.get('/', function *() {
        this.body = 'you\'re in!';
      });

      var server = roo.listen();

      request(server)
        .get('/')
        .expect(401)
        .end(function(err, res) {
          if (err) return done(err);
          assert('nope.' == res.text);

          request(server)
            .get('/')
            .auth('user', 'pass')
            .expect(200)
            .end(function(err, res) {
              if (err) return done(err);
              assert('you\'re in!');
              done();
            })
        })
    });

  });

  describe('roo.exec(path)', function() {
    it('should execute commands directly', function(done) {
      var roo = Roo(__dirname);
      roo.exec('echo hi!')
      roo.get('/', function *() {
        this.body = 'hello';
      });

      var restore = stdout();
      request(roo.listen())
        .get('/')
        .end(function(err, res) {
          if (err) return done(err);
          assert(res.text == 'hello');
          var str = restore();
          assert('hi!\n' == str);
          done();
        })
    })

    it('cwd should be based on Roo(__dirname)', function(done) {
      var roo = Roo(__dirname);
      roo.exec('sh fixtures/exec/script.sh')
      roo.get('/', function *() {
        this.body = 'hello';
      });

      var restore = stdout();
      request(roo.listen())
        .get('/')
        .end(function(err, res) {
          if (err) return done(err);
          assert(res.text == 'hello');
          var str = restore();
          assert(~str.indexOf('--reporter spec'));
          done();
        })
    })
  });

  describe('roo.compress()', function() {
    it('should compress static files', function(done) {
      var roo = Roo(__dirname);
      roo.compress({ threshold: 1 });
      roo.get('/', function *() {
        this.body = 'hi world!';
      });

      request(roo.listen())
        .get('/')
        .end(function(err, res) {
          if (err) return done(err);
          assert('gzip' == res.headers['content-encoding'])
          assert('hi world!' == res.text);
          done();
        })
    })
  });

  describe('roo.directory(path, opts)', function() {
    it('should serve up paths', function(done) {
      var roo = Roo(__dirname);
      roo.directory('./fixtures/directory');
      var server = roo.listen();

      request(server)
        .get('/')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          assert(~res.text.indexOf('<body class="directory">'));

          request(server)
            .get('/one.js')
            .expect(200)
            .end(function(err, res) {
              if (err) return done(err);
              assert.equal('console.log(\'one\');\n', res.text)
              done();
            })
        })
    });
  });

  describe('roo.cors(opts)', function() {
    it('should support cors', function(done) {
      var roo = Roo(__dirname);
      roo.cors();
      roo.get('/', function *(next) {
        this.body = 'hi!';
      });

      request(roo.listen())
        .options('/')
        .set('Origin', 'http://koajs.com')
        .set('Access-Control-Request-Method', 'PUT')
        .expect('Access-Control-Allow-Origin', 'http://koajs.com')
        .expect('Access-Control-Allow-Methods', 'GET,HEAD,PUT,POST,DELETE')
        .expect(204, done);
    });

    it('should support options', function(done) {
      var roo = Roo(__dirname);
      roo.cors({
        origin: '*'
      });

      roo.get('/', function *(next) {
        this.body = { foo: 'bar' };
      });

      request(roo.listen())
        .get('/')
        .set('Origin', 'http://koajs.com')
        .expect('Access-Control-Allow-Origin', '*')
        .expect({foo: 'bar'})
        .expect(200, done);
    })
  });

  describe('roo.mount(path, roo)', function() {
    it('should support mounting other roo apps', function(done) {
      var a = Roo(__dirname);
      var b = Roo(__dirname);
      a.mount('/a', b);
      b.get('/b', function *() {
        this.body = 'from b';
      });

      request(a.listen())
        .get('/a/b')
        .expect(200)
        .expect('from b', done)
    });
    
  });

  describe('roo.bundle(str|fn)', function() {
    it('should bundle simple files', function(done) {
      var roo = Roo(__dirname);

      roo.bundle(function(file, fn) {
        fs.readFile(file.path, 'utf8', function(err, str) {
          if (err) return fn(err);
          file.src = str;
          return fn(null, file);
        })
      });

      roo.bundle('fixtures/bundle/out.{css,js}');

      request(roo.listen())
        .get('/fixtures/bundle/out.js')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          assert(res.type == 'application/javascript');
          assert(res.text == 'module.exports = require(\'./dep.js\');\n');
          done();
        })
    });

    it('should work with css files', function(done) {
      var roo = Roo(__dirname);

      roo.bundle(function(file, fn) {
        fs.readFile(file.path, 'utf8', function(err, str) {
          if (err) return fn(err);
          file.src = str;
          return fn(null, file);
        })
      });

      roo.bundle('fixtures/bundle/out.{css,js}');

      request(roo.listen())
        .get('/fixtures/bundle/out.css')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          assert(res.type == 'text/css');
          assert(res.text == 'body {\n  background: blue;\n}\n');
          done();
        })
    })

    it('should work with mounts', function(done) {
      var app = Roo(__dirname);
      var signup = Roo(join(__dirname, 'fixtures', 'bundle'));

      app.bundle(function(file, fn) {
        fs.readFile(file.path, 'utf8', function(err, str) {
          if (err) return fn(err);
          file.src = str;
          return fn(null, file);
        })
      });

      app.bundle('fixtures/bundle/out.js');
      signup.bundle('out.js');

      app.mount('/', signup);

      request(signup.listen())
        .get('/out.js')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          assert(res.text == 'module.exports = require(\'./dep.js\');\n');

          request(app.listen())
            .get('/fixtures/bundle/out.js')
            .expect(200)
            .end(function(err, res) {
              if (err) return done(err);
              assert(res.text == 'module.exports = require(\'./dep.js\');\n');
              done();
            });
        });
    })

    it('should support browserify', function(done) {
      var roo = Roo(__dirname);

      roo.bundle(function(file) {
        var browserify = Browserify();
        browserify.add(file.path);
        file.src = browserify.bundle();
        return file;
      });

      roo.bundle('fixtures/bundle/out.{css,js}');

      request(roo.listen())
        .get('/fixtures/bundle/out.js')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          assert(res.type == 'application/javascript');
          assert(~res.text.indexOf('[function(require,module,exports){'));
          done();
        });

    })

    it('should support duo', function(done) {
      var roo = Roo(__dirname);

      roo.bundle(function(file, done) {
        duo(file.root)
          .entry(file.path)
          .run(function(err, src) {
            if (err) return done(err);
            file.src = src;
            done(null, file);
          })
      });

      roo.bundle('fixtures/bundle/out.{css,js}');

      request(roo.listen())
        .get('/fixtures/bundle/out.js')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          assert(res.type == 'application/javascript');
          assert(~res.text.indexOf('(function outer(modules, cache, entries){'));
          done();
        })
    })
  });

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
