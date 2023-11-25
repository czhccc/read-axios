'use strict';

/**
 * 请求被取消之后，reject的是这个Cancel示例
 *
 * @class
 * @param {string=} message The message.
 */
function Cancel(message) {
  this.message = message; // 错误消息，存储取消请求的原因或描述
}

Cancel.prototype.toString = function toString() {
  return 'Cancel' + (this.message ? ': ' + this.message : '');
};

// 取消请求标志位
Cancel.prototype.__CANCEL__ = true; // 用于在处理错误或响应时，检测抛出的异常或拒绝的原因是否是因为请求被取消。

module.exports = Cancel;

主要用于在请求被取消时创建一个表示取消的实例
Cancel 类用于创建一个特定类型的错误对象，表示请求被取消的情况。
当使用取消功能（如 CancelToken）取消请求时，可以抛出或返回一个 Cancel 实例，从而在响应处理逻辑中区分请求被正常处理的结果和请求被取消的情况。