// Pulled from: https://github.com/koajs/json-error/blob/1.0.1/index.js

'use strict'

/**
 * Error properties
 */

const props = [ 'name', 'code', 'message', 'stack', 'type' ]

/**
 * Export `error`
 */

module.exports = error

/**
 * JSON error handler
 */

function error () {
  return function * handle (next) {
    try {
      yield* next

      // future proof status
      const status = this.response.status
      if (!status) this.throw(404)
      if (status === 404 && this.response.body == null) this.throw(404)
    } catch (err) {
      // set body
      const body = {}
      const status = err.status || 500

      // set all properties of error onto the object
      Object.keys(err).forEach(function (key) {
        body[key] = err[key]
      })
      props.forEach(function (key) {
        let value = err[key]
        if (value) body[key] = value
      })

      // emit the error if we really care
      if (!err.expose && status >= 500) {
        this.app.emit('error', err, this)
      }

      this.response.status = status
      this.response.body = body
    }
  }
}
