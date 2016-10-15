
2.0.0 / 2016-10-15
==================

  * Starting anew :sparkles:

0.6.0 / 2015-10-15
==================

  * add middleware timing via `DEBUG=trace:time`

0.5.0 / 2015-10-10
==================

  * deprecate node 0.12 support for roo(1) by removing harmony proxy stuff for node 4

0.4.5 / 2015-08-17
==================

  * fix path for react

0.4.4 / 2015-08-13
==================

  * fix basic auth

0.4.3 / 2015-07-30
==================

  * bump koa to latest (v0.21.0)

0.4.2 / 2015-07-08
==================

  * pathname shouldnt affect assets

0.4.1 / 2015-06-25
==================

  * add cuteness

0.4.0 / 2015-06-25
==================

  * add wtch and update help
  * make executable more like beefy

0.3.3 / 2015-05-31
==================

  * pass process.env as env to templates by default (ex. title= env.NODE_ENV)

0.3.2 / 2015-05-31
==================

  * make views just work (install jade and hogan.js by default)

0.3.1 / 2015-05-07
==================

  * recursively update mounts

0.3.0 / 2015-04-16
==================

  * readme and roo.cluster(opts) support
  * cleanup dependencies. remove support for node 0.10.x
  * replace duo specific code with more generic koa-bundle
  * added: debug
  * added: roo.bundle()
  * add roo.bundle(...)
  * update makefile
  * add tests
  * allow user to pass options to static middleware

0.2.0 / 2015-01-19
==================

  * started: tests
  * remove: default logging
  * add: log filtering

0.1.8 / 2015-01-11
==================

  * do not compile duo in production

0.1.7 / 2015-01-11
==================

  * bump koa-error
  * fix roo's 'test'
  * loosen dependency pinning on duo-build

0.1.6 / 2014-12-09
==================

  * add missing uniques

0.1.5 / 2014-12-09
==================

  * fix duo builds

0.1.4 / 2014-12-08
==================

  * major speed fix when using duo

0.1.3 / 2014-11-27
==================

  * add koa-bodyparser

0.1.2 / 2014-11-26
==================

  * add koa-error (my branch until merge)

0.1.1 / 2014-11-17
==================

  * add roo#all(route, [middleware, ...], handler)

0.1.0 / 2014-11-12
==================

  * updated names. disable duo in production. add a way to pass multiple statics from CLI
  * Release 0.0.12
  * support html pages using hogan
  * kroute => kr

0.0.12 / 2014-11-12
==================

  * support html pages using hogan

0.0.11 / 2014-11-07
==================

  * replaced kroute with kr.
  * fixed roo.directory()

0.0.10 / 2014-11-07
==================

  * log once

0.0.9 / 2014-11-07
==================

  * resolve duo dependencies

0.0.8 / 2014-11-07
==================

  * expose roo#render(view, locals)

0.0.7 / 2014-11-06
==================

  * fix root for duo and jade

0.0.6 / 2014-11-06
==================

  * mounts now respect original roo.
  * change prototype to roo.
  * pass params to jade

0.0.5 / 2014-11-05
==================

  * fix mount

0.0.4 / 2014-11-05
==================

  * update to use koa-static

0.0.3 / 2014-11-05
==================

  * allow default port finding

0.0.2 / 2014-11-05
==================

  * bundle marked

0.0.1 / 2010-01-03
==================

  * Initial release
