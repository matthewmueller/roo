
/**
 * Module Dependencies
 */

var slice = [].slice;
var kr = require('kr');
var cwd = process.cwd();
var koa = require('koa');
var assert = require('assert');
var views = require('co-views');
var unique = require('uniques');
var error = require('koa-error');
var Glob = require('glob').sync;
var join = require('path').join;
var methods = require('methods');
var extend = require('extend.js');
var Logger = require('koa-logger');
var resolve = require('path').resolve;
var extname = require('path').extname;
var parser = require('koa-bodyparser');
var relative = require('path').relative;
var basename = require('path').basename;

/**
 * DEBUG=roo*
 */

 var trace = require('debug')('roo:trace');
 var debug = require('debug')('roo');

/**
 * Export `Roo`
 */

module.exports = Roo;

/**
 * Production
 */

var production = process.env.NODE_ENV == 'production';

/**
 * Add middleware once
 */

var once = true;

/**
 * Attach "all" manually
 */

methods.push('all');

/**
 * Initialize `Roo`
 */

function Roo(dir) {
  if (!(this instanceof Roo)) return new Roo(dir);
  this.cwd = dir || cwd;
  this.views = views(this.cwd, { default: 'jade', map: { html: 'hogan' }});
  this.tracing = trace.enabled;
  this.app = koa();
  this.duos = [];

  // add middleware once
  // TODO: should check self.parent in middleware
  once && this.app.use(error());
  once && this.app.use(parser());
  once = false;
}

/**
 * Build
 */

Roo.prototype.duobuild = function() {
  var bundle = require('duo-bundle/lib/bundle');
  var self = this;

  return function *(next) {
    if ('GET' != this.method) return yield next;
    var path = join(self.cwd, this.path);
    if (!~self.duos.indexOf(path)) return yield next;
    yield bundle(self.cwd, relative(self.cwd, path));
    yield next;
  }
};


/**
 * Set the favicon
 *
 * @param {String} path
 * @return {Roo}
 * @api public
 */

Roo.prototype.favicon = function(path) {
  var favicon = require('koa-favicon');
  this.app.use(favicon(resolve(this.cwd, path)));
  return this;
};

/**
 * Set tracing
 *
 * @param {Boolean} trace
 * @return {Roo}
 * @api public
 */

Roo.prototype.trace = function(trace) {
  this.tracing = !!trace;
  return this
}

/**
 * Set up the logger
 *
 * TODO: more comprehensive filtering
 *
 * @param {Boolean|Function} filter
 * @return {Roo}
 */

Roo.prototype.logger = function(filter) {
  filter = arguments.length ? filter : function () { return true; };
  var log = Logger();

  this.app.use(function *logger(next) {
    filter
      ? filter(this) && (yield log.call(this, next))
      : yield log.call(this, next);
    return yield next;
  });

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
    if (stdout && stdout.trim()) process.stdout.write(stdout);
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
  // trace all middleware
  this.tracing
    ? this.app.use(tracer(gen))
    : this.app.use(gen);

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

  if (1 == arguments.length) return mount(path, this.app);

  if (app instanceof Roo) {
    app.parent = this;
    var rootroo = rootmount(app);
    rootroo.duos = unique(rootroo.duos.concat(app.duos));
  }

  this.app.use(mount(path, app.app || app));
  return this;
};

/**
 * Compress the assets
 *
 * @param {Boolean} compress
 */

Roo.prototype.compress = function(opts) {
  var compress = require('koa-compress');
  this.app.use(compress(opts));
  return this;
};

/**
 * Directory
 *
 * @TODO abstract out express middleware implementation
 */

Roo.prototype.directory = function(path, opts) {
  path = resolve(this.cwd, path || '');
  opts = opts || {};
  opts.icons = undefined == opts.icons ? true : opts.icons;

  var index = require('serve-index')(path, opts);

  this.static(path);
  this.app.use(function *(next) {
    var req = this.req;
    var res = this.res;
    var end = res.end;

    var body = yield function(done) {
      res.end = function(val) {
        res.end = end;
        done(null, val);
      }

      index(req, res, function(err) {
        if (err) done(err);
        return done();
      });
    }

    this.body = body;
  });

  return this;
}

/**
 * static
 *
 * @param {String} dir
 * @return {Roo}
 */

Roo.prototype.static = function(dir, opts) {
  var static = require('koa-static');
  dir = resolve(this.cwd, dir);
  this.app.use(static(dir, opts));
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
  var cors = require('kcors');
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
 * Use Duo to build Roo assets
 *
 * @param {String} glob
 * @return {Roo}
 * @api public
 */

Roo.prototype.duo = function(glob) {
  production && console.warn('roo warning: you should pre-compile duo in production');
  var glob = resolve(this.cwd, glob);
  var files = Glob(glob, { cwd: this.cwd });
  this.duos = this.duos.concat(files);
  return this;
};

/**
 * Render the jade `view`
 *
 * @param {String} view
 * @param {Object} locals
 * @return {String}
 * @api public
 */

Roo.prototype.render = function *(view, locals) {
  locals = locals || {};
  var ext = extname(view).slice(1);
  if ('jade' == ext) locals.basedir = rootmount(this).cwd;
  return yield this.views(view, locals);
};


/**
 * Wrap the `view` in the render function
 *
 * @param {String} path
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

    // add route using `kr`
    this.app.use(kr[method].apply(this.router, args));
    return this
  };
});

/**
 * Get the root mount
 *
 * @param {Roo} roo
 * @return {Roo}
 * @api public
 */

function rootmount(roo) {
  if (!roo.parent) return roo;
  var parent = roo.parent;
  while (parent.parent) parent = parent.parent;
  return parent ? parent : roo;
}

/**
 * Trace the middleware
 *
 * @param {Generator} gen
 * @return {Generator}
 */

function tracer(gen) {
  console.log('implement tracer!');
}
