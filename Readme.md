
# Roo

  **NOTE: 2.x is a significant departure from 0.x. Roo has been updated to reflect the changing landscape. The new roo is only meant to recieve and response to dynamic data.**

  Jump-start your front-end server. Bundles and configures the boilerplate of a Koa app.

## Installation

```sh
npm install roo
```

## Features

  * Deployable: Ready to be deployed to Dokku or Heroku
  * Composable: Mount Koa servers within or mount within other Koa servers.

## Example

```js
const roo = Roo()
const users = Roo()

roo.mount('/users', users)

users.get('/', function * () {
  this.body = 'users!'
})

roo.listen(3000)
```

## API

##### `Roo()`

Initialize `Roo`.

##### `Roo.{get,post,put,delete,...}(route[, middleware, ...], handle)`

Add a route to `Roo`. Routing is powered by [kr](https://github.com/lapwinglabs/kr), so visit there for API details.

```js
roo.post('/signup', signup)
```

##### `Roo.use(generator)`

Pass additional middleware `generator`'s to `Roo`.

##### `Roo.mount([path], app)`

Mount an app inside of `Roo` at `path`. `path` defaults to `/`

```js
const app = roo()
const dash = roo()
app.mount('/dashboard', dash);
```

##### `Roo.listen(port, fn)`

Start the server on `port`. You may pass the environment variable `PORT=8080` in to specify a port. Otherwise it defaults to `3000` if otherwise not specified.

##### `Roo.listener()`

Get koa's request handler. Useful if you'd like to proxy requests.

## Test

```
npm install
make test
```

## Why Roo?

Roo is short for Kangaroo. I wrote this while visiting Australia for [CampJS](http://campjs.com) and I have Kangaroos on my mind.

## Credits

Kangaroo Icon by [Olivier Guin](http://thenounproject.com/olivierguin)

## License

MIT
