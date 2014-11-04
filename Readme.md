
# Roo

  ![kangaroo](https://cldup.com/X4VwDx3Mlx.png)

  Jump-start your front-end server. Bundles and configures the boilerplate of a Koa app. Originally inspired by [tj/serve](https://github.com/tj/serve).

## Example

**API:**

```js
Roo(__dirname)
  .auth('username', 'password')
  .get('/', 'index.jade')
  .duo('*.{js,css}')
  .exec('make build')
  .mount('/api', api)
  .compress()
  .serve('build')
  .cors()
  .listen(4000);
```

**CLI**

```bash
$ roo -h
```

## Features

  * Flexible: Javascript & CLI API
  * Deployable: Ready to be deployed to Dokku or Heroku
  * Composable: Mount Koa servers within or mount within other Koa servers.
  * Higher-level: Templating, Routing & Duo baked-in

## API

### `Roo(root)`

Initialize `Roo` at the `root` path.

### `Roo.{get,post,put,delete,...}(route[, middleware, ...], handle)`

Add a route to `Roo`. Routing is powered by [kroute](https://github.com/blakeembrey/kroute), so visit there for API details.

Additionally, you may pass a `filepath` to `handle`, which will render using [consolidate](https://github.com/tj/consolidate.js).

```js
roo
  .get('/', 'index.jade')
  .post('/signup', signup)
```

### `Roo.favicon(path)`

Set a favicon at `path`

### `Roo.auth(user, pass)`

Add basic auth with a `user` and `pass`.

### `Roo.exec(command)`

Execute a `command` every refresh

### `Roo.use(generator)`

Pass additional middleware `generator`'s to `Roo`.

### `Roo.mount(path)`

Mount inside another app at `path`.

```js
app.use(roo.mount('/dashboard'));
```

### `Roo.duo(file|glob)`

Pass a `file` or `glob` expression to be compiled using [duo](http://duojs.com).

### `Roo.mount(path, app)`

Mount an app inside of `Roo` at `path`

```js
roo.mount('/dashboard', app);
```

### `Roo.compress()`

Compress CSS and JS assets

### `Roo.directory()`

Roo the entire directory using [koa-roo-index](https://github.com/yiminghe/koa-roo-index)

### `Roo.static(directory)`

Add a static asset `directory` to roo from

### `Roo.cors([options])`

Enable `CORS` on the roo. `options` get passed directly to [node-cors](https://github.com/troygoode/node-cors/).

### `Roo.listen(port, fn)`

Start the server on `port`. You may pass the environment variable `PORT=8080` in to specify a port. Otherwise it defaults to `3000` if otherwise not specified.

## TODO

- LiveReload support
- Tests would be nice

## Why Roo?

Roo is short for Kangaroo. I wrote this while visiting Australia for [CampJS](http://campjs.com) and I have Kangaroos on my mind.

## Credits

Kangaroo Icon by [Olivier Guin](http://thenounproject.com/olivierguin)

## License

(The MIT License)

Copyright (c) 2014 Matthew Mueller &lt;matt@lapwinglabs.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
