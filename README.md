# fit-vite-loader

转换部分语法，让webpack、vite可以共存。
转换语法用到了`@babel/parser`、`@babel/traverse`、`@babel/types`、`@babel/generator`、`glob-to-regexp`


目前仅处理以下情况：


1、`import.meta.globEager`： 用glob-to-regexp转换语法，适配webpack的`require.context`语法
   
eg:

转换前
```js
let requireRouter = import.meta.globEager('./*.config.js');
```
转换后
```js
let requireRouter = {};
(r => r.keys().forEach(key => (requireRouter[key] = r(key))))(require.context('.', true, /.*\.config\.js$/));
```
2、`import.meta.env.DEV`： 编译环境判断问题

eg:
```js
if (import.meta.env.DEV) {
  // ...
}
```
```js
if (process.env.NODE_ENV ='development') {
  // ...
}
```
在使用到import.meta但以上情况均不匹配时, 语句会直接转换为false
eg:
```js
let a = import.meta;
```
```js
let a = false;
```
## Install

```sh
npm install fit-vite-loader
```

## Usage
webpack.config.js

```js
module.exports = {
  //...
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'fit-vite-loader'
      }
    ]
  }
};
```

## Contributing
## License

MIT
