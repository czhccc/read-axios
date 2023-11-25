'use strict';

// 判断是否已经被取消了请求
module.exports = function isCancel(value) {
  return !!(value && value.__CANCEL__);
};

// value.__CANCEL__ 详见 ./Cancel.js

isCancel 函数可以用于检查一个错误或拒绝的原因是否是因为请求被取消。
在需要区分请求失败的不同原因（例如网络错误、服务器错误、请求取消等）时非常有用。

