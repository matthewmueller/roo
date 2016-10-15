/**
 * Module Dependencies
 */

const methods = require('methods').concat('all')
const sliced = require('sliced')
const koa = require('koa')

/**
 * Middleware
 */

const bodyparser = require('koa-bodyparser')
const error = require('koa-error')
const mount = require('koa-mount')
const kr = require('kr')

/**
 * Export `Roo`
 */

module.exports = Roo

/**
 * Initialize Roo
 */

function Roo () {
  if (!(this instanceof Roo)) return new Roo()
  this.app = koa()

  // allow for proxy requests
  this.app.proxy = true

  // initial middleware boiler
  this.app.use(error())
  this.app.use(bodyparser())
}

/**
 * Attach methods
 */

methods.map(method => {
  Roo.prototype[method] = function () {
    this.app.use(kr[method].apply(null, sliced(arguments)))
    return this
  }
})

/**
 * Use
 */

Roo.prototype.use = function (fn) {
  this.app.use(fn)
  return this
}

/**
 * Mount
 */

Roo.prototype.mount = function (path, app) {
  app = app.app || app
  path = path || '/'

  this.app.use(mount(path, app.app || app))
  return this
}

/**
 * Listener
 */

Roo.prototype.listener = function () {
  return this.app.callback()
}

/**
 * Listen
 */

Roo.prototype.listen = function (port, fn) {
  return this.app.listen(port, fn)
}
