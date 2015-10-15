
/**
 * Module Dependencies (down under)
 */

var slice = [].slice;
var kr = require('kr');
var cwd = process.cwd();
var koa = require('koa');
var throng = require('throng');
var views = require('co-views');
var error = require('koa-error');
var Timer = require('koa-timer');
var methods = require('methods');
var assign = require('object-assign');
var resolve = require('path').resolve;
var extname = require('path').extname;
var bodyparser = require('koa-bodyparser');

/**
 * DEBUG=roo*
 */

 var trace = require('debug')('trace');
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
 * Attach "all" manually
 */

methods.push('all');

/**
 * Initialize `Roo`
 */

function Roo(dir) {
  if (!(this instanceof Roo)) return new Roo(dir);
  this.cwd = this._root = dir || cwd;
  this.views = views(this.cwd, { default: 'jade', map: { html: 'handlebars' }});
  this._timer = Timer({ debug: 'trace:time' })
  this._bodyparser = bodyparser();
  this.tracing = trace.enabled;
  this._cluster = false;
  this._error = error();
  this.bundler = null;
  this.children = [];
  this.entries = [];
  this.app = koa();
  this.files = [];
  this.stack = [];
}

/**
 * Set the root mount
 *
 * @param {String} root
 * @return {Roo}
 * @api public
 */

Roo.prototype.root = function(root) {
  if (!arguments.length) return this._root;
  this._root = root;
  return this;
}

/**
 * Compile an extension
 *
 * @param {String|Function} fn
 * @return {Roo}
 * @api public
 */

Roo.prototype.bundle = function(fn, options) {
  var Bundle = require('koa-bundle');
  if (!arguments.length) return this.bundler;
  var self = this;

  options = assign({
    root: this.cwd
  }, options);

  if ('function' == typeof fn) {
    this.bundler = Bundle(fn);
  } else if ('string' == typeof fn) {
    this.use(bundle(fn, options));
  }

  function bundle(path, options) {
    if (self.bundler) return self.bundler(path, options);
    return function *(next) {
      yield self.bundler(path, options).call(this, next);
    }
  }

  return this;
};

/**
 * Custom `bodyparser`
 *
 * @param {Object} opts
 * @return {Roo}
 * @api public
 */

Roo.prototype.bodyparser = function(opts) {
  this._bodyparser = bodyparser(opts);
  return this;
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
  var Logger = require('koa-logger');
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
  this.app.use(enter_credentials);
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
  trace
    ? this.app.use(this._timer(gen))
    : this.app.use(gen)

  return this;
};

/**
 * Time the middleware
 *
 * @param {Object} opts
 * @return {Roo}
 * @api public
 */

Roo.prototype.time = function (opts) {
  if (!arguments.length) {
    return this._timer
  }

  this._timer = new Timer(opts)
  return this
}

/**
 * Mount `Roo` inside another koa app
 * with mount `path`
 *
 * Or mount an `app` inside `Roo`
 *
 * @param {String} path
 * @param {Roo|Koa} app
 * @return {Roo}
 */

Roo.prototype.mount = function(path, app) {
  var mount = require('koa-mount');

  path = path || '/';

  // ensure path begins with '/'
  if ('/' != path[0]) {
    throw new Error('mount path must begin with "/"');
  }

  if (1 == arguments.length) {
    return mount(path, this.app);
  }


  // attach to the root roo
  if (app instanceof Roo) {
    this.children.push(app);
    walk(this, function(child) {
      child.root(this.root())
      if (!child.bundle()) {
        child.bundler = this.bundle();
      }
    })
  }

  this.use(mount(path, app.app || app));
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
 * Custom error
 *
 * @param {Object} opts
 * @return {Roo}
 * @api public
 */

Roo.prototype.error = function(opts) {
  this._error = error(opts);
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
  var cluster = this.cluster();
  var app = this.app;

  // add some middleware at the top
  // TODO right now this is silent, probably shouldn't be
  app.middleware.unshift(this._error);
  app.middleware.unshift(this._bodyparser);

  var p = process.env.PORT;
  port = port || p;

  if ('function' == typeof port) {
    fn = port;
    port = p;
  }

  return cluster
    ? throng(start, cluster)
    : start();

  function start() {
    return app.listen(port, fn);
  }
};

/**
 * Cluster / Zero-downtime support
 *
 * @param {Boolean|Object} cluster
 * @return {Roo}
 */

Roo.prototype.cluster = function(cluster) {
  if (!arguments.length) return this._cluster;
  var defaults = { lifetime: Infinity };

  if ('boolean' == typeof cluster && cluster) {
    this._cluster = defaults;
  } else {
    this._cluster = assign(defaults, cluster);
  }

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
  locals.env = process.env;
  var ext = extname(view).slice(1);
  if ('jade' == ext) locals.basedir = this.root();
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
    locals = assign(params, locals);
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

function * enter_credentials (next) {
  try {
    yield next;
  } catch (err) {
    if (401 == err.status) {
      this.status = 401;
      this.set('WWW-Authenticate', 'Basic');
    } else {
      throw err;
    }
  }
}

/**
 * Walk the `roo` mounts
 *
 * @param {Roo} roo
 * @param {Function} fn
 * @param {Roo} ctx (optional)
 */

function walk(roo, fn, ctx) {
  ctx = ctx || roo;

  for (var i = 0, child; child = roo.children[i]; i++) {
    fn.call(ctx, child);
    walk(child, fn, ctx);
  }
}
