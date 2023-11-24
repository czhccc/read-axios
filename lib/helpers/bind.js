'use strict';

其作用是创建一个新的函数，这个新函数在调用时会将其 this 关键字设置为提供的值（thisArg），并在执行时将给定的参数传递给原函数（fn）。
这是一个手动实现的函数绑定（function binding）逻辑。

函数的工作原理
接收参数：
fn：要绑定的原始函数。
thisArg：在调用 fn 时将作为 this 上下文的对象。
返回一个新函数 (wrap)：
当这个新函数被调用时，它会接收任意数量的参数。
参数处理：
在 wrap 函数内部，使用 arguments 对象收集所有传入的参数。由于 arguments 是一个类数组对象，所以将它转换为一个真正的数组。
调用原始函数：使用 apply 方法调用原始函数 fn，将 thisArg 作为 this 上下文，并传入参数数组 args。

在现代 JavaScript 中，通常可以使用箭头函数或 Function.prototype.bind 方法来实现类似的功能，而不需要手动实现。
// 使用 Function.prototype.bind
var boundFn = fn.bind(thisArg);

// 使用箭头函数
var boundFn = (...args) => fn.apply(thisArg, args);

module.exports = function bind(fn, thisArg) {
  return function wrap() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    return fn.apply(thisArg, args);
  };
};
