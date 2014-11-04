/**
 * Module Dependencies
 */

var slice = [].slice;
var cwd = process.cwd();
var koa = require('koa');
var kroute = require('kroute');
var methods = require('methods');
var views = require('co-views');
var logger = require('koa-logger');
var resolve = require('path').resolve;
var extname = require('path').extname;
var basename = require('path').basename;
var assert = require('assert');

/**
 * Export `Serve`
 */

module.exports = Serve;

/**
 * Production
 */

var production = process.env.NODE_ENV == 'production';

/**
 * Initialize `Serve`
 */

function Serve(root) {
  if (!(this instanceof Serve)) return new Serve(root);
  this.render = views(root, { default: 'jade' });
  this.root = root || cwd;
  this.router = kroute();
  this.app = koa();

  // middleware
  this.app.use(logger());
  this.app.use(this.router);
}

/**
 * Set the favicon
 *
 * @param {String} path
 * @return {Serve}
 * @api public
 */

Serve.prototype.favicon = function(path) {
  var favicon = require('koa-favicon');
  this.app.use(favicon(path));
  return this;
};

/**
 * Basic Auth
 *
 * @param {String} user
 * @param {String} pass
 * @return {Serve}
 * @api public
 */

Serve.prototype.auth = function(user, pass) {
  var auth = require('koa-basic-auth');
  this.app.use(auth({ name: user, pass: pass }));
  return this;
};

/**
 * Koa middleware to execute a `cmd`
 *
 * @param {String} cmd
 * @return {Serve}
 */

Serve.prototype.exec = function(cmd) {
  var exec = require('co-exec');
  var root = this.root;

  this.app.use(function *(next) {
    var stdout = yield exec(cmd, { cwd: root });
    if (stdout && stdout.trim()) console.log(stdout);
    yield next;
  });

  return this;
};

/**
 * Add some middleware
 *
 * @param {GeneratorFunction} gen
 * @return {Serve}
 * @api public
 */

Serve.prototype.use = function(gen) {
  this.app.use(gen);
  return this;
};

/**
 * Mount `Serve` inside another koa app
 * with mount `path`
 *
 * Or mount an `app` inside `Serve`
 */

Serve.prototype.mount = function(path, app) {
  var mount = require('koa-mount');
  path = path || '/';

  // ensure path begins with '/'
  assert('/' == path[0], 'mount path must begin with "/"');

  if (2 == arguments.length) {
    this.app.use(mount(path, app));
    return this;
  } else {
    return mount(path, this.app);
  }
};

/**
 * Compress the assets
 *
 * @param {Boolean} compress
 */

Serve.prototype.compress = function() {
  var compress = require('koa-compress');
  this.app.use(compress());
  return this;
};

/**
 * Directory
 */

Serve.prototype.directory = function() {
  var directory = require('koa-serve-index');
  this.static(this.root);
  this.app.use(directory(this.root));
  return this;
}

/**
 * static
 *
 * @param {String} dir
 * @return {Serve}
 */

Serve.prototype.static = function(dir) {
  var static = require('koa-static');
  dir = resolve(this.root, dir);
  this.app.use(static(dir));
  return this;
};

/**
 * Support CORS
 *
 * @param {Object} opts
 * @return {Serve}
 * @api public
 */

Serve.prototype.cors = function(opts) {
  var cors = require('koa-cors');
  this.app.use(cors(opts));
  return this;
};


/**
 * listen on a `port` with
 * an optional callback `fn`
 *
 * @param {Number} port (optional)
 * @param {Function} fn (optional)
 * @return {App}
 * @api public
 */

Serve.prototype.listen = function(port, fn) {
  var p = process.env.PORT || 3000;
  port = port || p;

  if ('function' == typeof port) {
    fn = port;
    port = p;
  }

  return this.app.listen(port, fn);
};

/**
 * Use duo to serve assets
 */

Serve.prototype.duo = function(glob) {
  var duo = this._duo = this._duo || require('duo-bundle')(this.root);
  this.app.use(duo(glob));
  return this;
};


/**
 * Wrap the `view` in the render function
 *
 * @param {Strign} path
 * @param {Object} locals
 * @api private
 */

Serve.prototype.view = function(view) {
  var render = this.render;
  var root = this.root;

  return function *() {
    this.locals = this.locals || {}
    var ext = extname(view).slice(1);
    if ('jade' == extname) this.locals.basedir = root;
    this.body = yield render(view, this.locals);
  }
};

/**
 * Attach all the routing methods
 */

methods.forEach(function(method) {
  Serve.prototype[method] = function() {
    var args = slice.call(arguments);
    var len = args.length;

    // support string paths
    if (len > 1 && 'string' == typeof args[len - 1]) {
      args[len - 1] = this.view(args[len - 1]);
    }

    // add to kroute
    this.router[method].apply(this.router, args);
    return this
  };
});
