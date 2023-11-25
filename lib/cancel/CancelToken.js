


'use strict';

var Cancel = require('./Cancel');

/**
 * 用来创建取消请求的实例的类
 *
 * @class
 * @param {Function} executor 执行函数
 */
function CancelToken(executor) {
  if (typeof executor !== 'function') { // executor必须是一个函数
    throw new TypeError('executor must be a function.');
  }

  var resolvePromise;
  // 创建一个promise实例，resolvePromise 用于改变 Promise 的状态
  this.promise = new Promise(function promiseExecutor(resolve) {
    // 将resolve函数保存起来
    resolvePromise = resolve;

    创建一个新的 Promise 实例，赋值给 this.promise。这个 Promise 将用于在取消操作发生时改变其状态。
    这样做的目的是允许在类的其他方法中，特别是在 cancel 函数中，能够随时改变这个 Promise 的状态。

    这种模式允许在 Promise 执行器函数外部控制 Promise 的解决（resolve）。
    在 CancelToken 的上下文中，这意味着当 cancel 函数被调用时，可以通过 resolvePromise 函数立即将 this.promise 的状态从“待定（pending）”改变为“已解决（fulfilled）”。
    这是处理可取消操作（如 HTTP 请求）的一种常见模式。通过关联的 Promise，可以在取消请求时执行相应的处理逻辑，例如中断 HTTP 请求或清理资源。

    当调用 cancel 函数时，内部会调用 resolvePromise，从而改变 this.promise 的状态。这个 Promise 的状态改变可以被用来触发取消请求的逻辑，例如中断 AJAX 请求或不再处理请求的响应。

    1、使得可以在外部改变 Promise 的状态：
    通常，一个 Promise 的状态（从 pending 到 fulfilled 或 rejected）只能在其执行器函数（executor function）内部改变。
    但通过将 resolve 函数保存在外部变量 resolvePromise 中，可以在 Promise 的外部调用这个 resolve 函数，从而改变 Promise 的状态。

    2、请求被取消后，防止进一步的逻辑执行
    当 Promise 的状态被改变为 fulfilled（通常是因为调用了取消函数），与该 Promise 相关的逻辑（例如 HTTP 请求的处理逻辑）将会根据 Promise 的状态来决定后续的行为。
    在 HTTP 请求的上下文中，如果请求已经被取消（即 Promise 状态变为 fulfilled），那么即使请求随后返回了数据，也不会执行原本基于该 Promise 的成功处理逻辑。
    这样可以避免在请求已经不再需要时执行不必要的操作。
    （网络请求还是会继续执行并正常返回内容，但是后续的处理逻辑则会被忽略而并不是网络请求就不再正常发送或返回数据了）
    （取消操作通常不会阻止请求本身的发送。如果请求已经发出，取消操作不会从网络层面撤回该请求）
  });

  var token = this;
  // `executor`是一个函数，该函数的参数是`cancel`函数
  // 外部需要将`cancel`函数保存起来，在需要取消请求的时候，调用`cancel`函数
  executor(function cancel(message) { 
    if (token.reason) { // 如果已经取消，不执行后续操作
      return;
    }
    // 设置取消原因
    token.reason = new Cancel(message);
    // promise实例将会变成成功状态,实际上就是调用了resolve函数
    resolvePromise(token.reason); // 改变 promise 的状态为已解决

    // 我们查看`lib/adapters/xhr.js`中又如下几行代码：
    // if (config.cancelToken) {
    //   // cancelToken对象，该对象上面会存在一个promise实例
    //   // 一旦promise实例变成成功状态，就会来到`then`函数这里
    //   config.cancelToken.promise.then(function onCanceled(cancel) {
    //     if (!request) {
    //       return;
    //     }
    //     // 中断请求
    //     request.abort();
    //     reject(cancel);
    //     request = null;
    //   });
    // }
  });
}

/**
 * 如果已经被取消了请求，就会抛出错误对象，错误对象为`Cancel`类型
 * throwIfRequested 方法用于在请求已经被取消的情况下抛出错误
 */
CancelToken.prototype.throwIfRequested = function throwIfRequested() {
  if (this.reason) {// 如果已经取消，则抛出取消原因
    throw this.reason;
  }
};

/**
 * 静态属性，返回一个`CancelToken`实例和`cancel`函数，`cancel`就是用来取消请求的
 * 
 * source 是一个静态方法，用于创建 CancelToken 实例和关联的取消函数
 * 
 * axios提供2种方式给开发者取消请求
 */
CancelToken.source = function source() {
  var cancel;
  var token = new CancelToken(function executor(c) {
    cancel = c;
  });
  return {
    token: token,
    cancel: cancel
  };
};

module.exports = CancelToken;

CancelToken 类在创建可取消的 HTTP 请求（如使用 axios 发送请求）时非常有用。通过提供取消功能，开发者可以在需要时中断请求，
这在处理长时间运行的请求或需要基于某些条件动态取消请求的场景中特别重要。
例如，如果用户离开一个页面或组件，可能需要取消该页面或组件发起的未完成请求，以避免不必要的资源消耗或潜在的错误。
