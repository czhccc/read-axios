"use strict";

var utils = require("./../utils");
var buildURL = require("../helpers/buildURL");
var InterceptorManager = require("./InterceptorManager");
var dispatchRequest = require("./dispatchRequest");
var mergeConfig = require("./mergeConfig");

// Axios构造器
function Axios(instanceConfig) {
  // 默认配置
  this.defaults = instanceConfig;
  // 请求拦截器/响应拦截器
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager(),
  };
}

// request请求函数
Axios.prototype.request = function request(config) {
  if (typeof config === "string") {
    // 使用形式一：axios('example/url'[, config])
    // 如果config是一个字符串，说明是一个url地址，需要进行处理
    config = arguments[1] || {};
    config.url = arguments[0];
  } else {
    // 使用形式二：axios(config)
    config = config || {};
  }

  // 将默认的配置跟传入的配置进行合并
  config = mergeConfig(this.defaults, config);

  // 将method统一转化为小写
  if (config.method) {
    config.method = config.method.toLowerCase();
  } else if (this.defaults.method) {
    // 这个判定条件好像是多余的，因为如果this.defaults.method存在值，那么通过mergeConfig之后config也一定会存在值
    config.method = this.defaults.method.toLowerCase();
  } else {
    config.method = "get";
  }

  // promise调用链（chain数组），dispatchRequest是负责派发请求的
  // dispatchRequest函数暂时不用关心这个函数的实现，只需要知道他返回的是一个promise即可
  // promise调用链（chain数组）每2个为一对的，一个是成功回调方法，一个是失败回调方法
  // dispatchRequest, undefined为一对，
  // dispatchRequest是成功回调方法，
  // 失败回调方法可有可无，我们这里不需要，所以给undefined即可
  var chain = [dispatchRequest, undefined];
  // 初始化一个promise
  var promise = Promise.resolve(config);
  // 遍历请求拦截器
  this.interceptors.request.forEach(function unshiftRequestInterceptors(
    interceptor
  ) {
    // 对于请求拦截器，是通过unshift方法往chain数组前面添加的
    // 在执行拦截器的时候，通过shift方法从chain数组里取出的
    // 所以，请求拦截器先添加的后执行
    chain.unshift(interceptor.fulfilled, interceptor.rejected);
  });
  // 遍历响应拦截器
  this.interceptors.response.forEach(function pushResponseInterceptors(
    interceptor
  ) {
    // 对于响应拦截器，是通过push方法往chain数组后面添加的
    // 在执行拦截器的时候，通过shift方法从chain数组里取出的
    // 所以：响应拦截器后添加的先执行
    chain.push(interceptor.fulfilled, interceptor.rejected);
  });

  // 添加了请求。响应拦截器后的chain数组如下，请求拦截器在前，dispatchRequest请求处理函数在中间，响应拦截器在后
  // [
  //   requestFulfilledFn, requestRejectedFn, ...,
  //   dispatchRequest, undefined,
  //   responseFulfilledFn, responseRejectedFn, ....,
  // ]

  // 开始执行promise调用链（chain数组）
  while (chain.length) {
    // 数组的 shift() 方法用于把数组的第一个元素从其中删除，并返回第一个元素的值
    // 每次执行while循环，从chain数组里按序取出两项，并分别作为promise.then方法的第一个和第二个参数
    // 在这里就可以看出promise调用链（chain数组）中，每2个就是一对的
    // 第一个chain.shift()是成功回调函数
    // 第二个chain.shift()是失败回调函数
    // 第一个请求拦截器的fulfilled函数会接收到promise对象初始化时传入的config对象，而请求拦截器又规定用户写的fulfilled函数必须返回一个config对象，所以通过promise实现链式调用时，每个请求拦截器的fulfilled函数都会接收到一个config对象
    // 第一个响应拦截器的fulfilled函数会接受到dispatchRequest请求处理函数返回的数据,而响应拦截器又规定用户写的fulfilled函数必须返回一个response对象，所以通过promise实现链式调用时，每个响应拦截器的fulfilled函数都会接收到一个response对象
    // 根据promise的特性，任何一个拦截器的抛出的错误，都会被下一个拦截器的rejected函数收到，所以dispatchRequest抛出的错误才会被响应拦截器接收到。
    // 因为采用的是promise调用的形式，所以我们可以再拦截器中执行异步操作，而拦截器的执行顺序还是会按照我们上面说的顺序执行，也就是 dispatchRequest 方法一定会等待所有的请求拦截器执行完后再开始执行，响应拦截器一定会等待 dispatchRequest 执行完后再开始执行。
    promise = promise.then(chain.shift(), chain.shift());
  }

  return promise;
};

Axios.prototype.getUri = function getUri(config) {
  config = mergeConfig(this.defaults, config);
  return buildURL(config.url, config.params, config.paramsSerializer).replace(
    /^\?/,
    ""
  );
};

// 添加请求方法别名
utils.forEach(
  ["delete", "get", "head", "options"],
  function forEachMethodNoData(method) {
    Axios.prototype[method] = function (url, config) {
      // 实际上是调用了`request`函数
      return this.request(
        mergeConfig(config || {}, {
          method: method,
          url: url,
          data: (config || {}).data,
        })
      );
    };
  }
);

// 添加请求方法别名
utils.forEach(["post", "put", "patch"], function forEachMethodWithData(method) {
  Axios.prototype[method] = function (url, data, config) {
    // 实际上是调用了`request`函数
    return this.request(
      mergeConfig(config || {}, {
        method: method,
        url: url,
        data: data,
      })
    );
  };
});

module.exports = Axios;
