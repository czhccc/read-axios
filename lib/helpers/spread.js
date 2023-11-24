'use strict';

/**
 * Syntactic sugar for invoking a function and expanding an array for arguments.
 *
 * Common use case would be to use `Function.prototype.apply`.
 *
 *  ```js
 *  function f(x, y, z) {}
 *  var args = [1, 2, 3];
 *  f.apply(null, args);
 *  ```
 *
 * With `spread` this example can be re-written.
 *
 *  ```js
 *  spread(function(x, y, z) {})([1, 2, 3]);
 *  ```
 *
 * @param {Function} callback
 * @returns {Function}
 */
module.exports = function spread(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
};

目的是提供一个语法糖（syntactic sugar），用于调用函数并展开一个数组作为参数。
它是对 Function.prototype.apply 方法的一种封装，使得函数的调用更加简洁和直观。


返回一个新的函数 wrap，该函数接受一个数组 arr 作为参数。
当 wrap 被调用时，它使用 apply 方法调用原始的 callback 函数，同时将 arr 数组展开作为参数传递给 callback。
apply 的第一个参数为 null，这意味着 callback 函数中的 this 将指向全局对象（在严格模式下为 undefined）。