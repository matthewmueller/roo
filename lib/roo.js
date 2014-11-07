/**
 * Module Dependencies
 */

var slice = [].slice;
var cwd = process.cwd();
var koa = require('koa');
var assert = require('assert');
var kroute = require('kroute');
var views = require('co-views');
var methods = require('methods');
var extend = require('extend.js');
var logger = require('koa-logger');
var resolve = require('path').resolve;
var extname = require('path').extname;
var basename = require('path').basename;
var assert = require('assert');

/**
 * Export `Roo`
 */

module.exports = Roo;

/**
 * Production
 */

var production = process.env.NODE_ENV == 'production';

/**
 * Initialize `Roo`
 */

function Roo(dir) {
  if (!(this instanceof Roo)) return new Roo(dir);
  this.cwd = dir || cwd;
  this.views = views(this.cwd, { default: 'jade' });
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
 * @return {Roo}
 * @api public
 */

Roo.prototype.favicon = function(path) {
  var favicon = require('koa-favicon');
  this.app.use(favicon(path));
  return this;
};

/**
 * Basic Auth
 *
 * @param {String} user
 * @param {String} pass
 * @return {Roo}
 * @api public
 */

Roo.prototype.auth = function(user, pass) {
  var auth = require('koa-basic-auth');
  this.app.use(auth({ name: user, pass: pass }));
  return this;
};

/**
 * Koa middleware to execute a `cmd`
 *
 * @param {String} cmd
 * @return {Roo}
 */

Roo.prototype.exec = function(cmd) {
  var exec = require('co-exec');
  var cwd = this.cwd;

  this.app.use(function *(next) {
    var stdout = yield exec(cmd, { cwd: cwd });
    if (stdout && stdout.trim()) console.log(stdout);
    yield next;
  });

  return this;
};

/**
 * Add some middleware
 *
 * @param {GeneratorFunction} gen
 * @return {Roo}
 * @api public
 */

Roo.prototype.use = function(gen) {
  this.app.use(gen);
  return this;
};

/**
 * Mount `Roo` inside another koa app
 * with mount `path`
 *
 * Or mount an `app` inside `Roo`
 */

Roo.prototype.mount = function(path, app) {
  var mount = require('koa-mount');
  path = path || '/';

  // ensure path begins with '/'
  assert('/' == path[0], 'mount path must begin with "/"');

  if (2 == arguments.length) {
    if (app instanceof Roo) app.root = this.cwd;
    this.app.use(mount(path, app.app || app));
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

Roo.prototype.compress = function() {
  var compress = require('koa-compress');
  this.app.use(compress());
  return this;
};

/**
 * Directory
 */

Roo.prototype.directory = function() {
  var directory = require('koa-Roo-index');
  this.static(this.cwd);
  this.app.use(directory(this.cwd));
  return this;
}

/**
 * static
 *
 * @param {String} dir
 * @return {Roo}
 */

Roo.prototype.static = function(dir) {
  var static = require('koa-static');
  dir = resolve(this.cwd, dir);
  this.app.use(static(dir));
  return this;
};

/**
 * Support CORS
 *
 * @param {Object} opts
 * @return {Roo}
 * @api public
 */

Roo.prototype.cors = function(opts) {
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

Roo.prototype.listen = function(port, fn) {
  var p = process.env.PORT;
  port = port || p;

  if ('function' == typeof port) {
    fn = port;
    port = p;
  }

  return this.app.listen(port, fn);
};

/**
 * Use duo to Roo assets
 */

Roo.prototype.duo = function(glob) {
  var bundle = require('duo-bundle');
  var self = this;

  this.app.use(function *(next) {
    var duo = bundle(self.root || self.cwd);
    yield duo(glob)(next);
  });

  return this;
};

/**
 * render
 */

Roo.prototype.render = function *(view, locals) {
  locals = locals || {};
  var ext = extname(view).slice(1);
  if ('jade' == ext) locals.basedir = this.root || this.cwd;
  return yield this.views(view, locals);
};


/**
 * Wrap the `view` in the render function
 *
 * @param {Strign} path
 * @param {Object} locals
 * @api private
 */

Roo.prototype.view = function(view) {
  var cwd = this.cwd;
  var self = this;

  return function *() {
    var locals = this.locals || {};
    var params = this.params || {};
    locals = extend(params, locals);
    this.body = yield self.render(view, locals);
  }
};

/**
 * Attach all the routing methods
 */

methods.forEach(function(method) {
  Roo.prototype[method] = function() {
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
