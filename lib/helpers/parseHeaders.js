'use strict';

var utils = require('./../utils');

// node中需要忽略掉的响应头
// c.f. https://nodejs.org/api/http.html#http_message_headers
列出了在 Node.js 环境中被视为单一值的响应头字段
var ignoreDuplicateOf = [
  'age', 'authorization', 'content-length', 'content-type', 'etag',
  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
  'referer', 'retry-after', 'user-agent'
];

/**
 * 把header转化为json对象
 *
 * @param {String} headers Headers needing to be parsed
 * @returns {Object} Headers parsed into an object
 */
module.exports = function parseHeaders(headers) {
  var parsed = {};
  var key;
  var val;
  var i;

  // headers不存在返回一个空对象
  if (!headers) { return parsed; }
  // 根据换行符将`headers`分割成数组
  utils.forEach(headers.split('\n'), function parser(line) {
    i = line.indexOf(':');
    // 提取 key 值，并转换为小写
    key = utils.trim(line.substr(0, i)).toLowerCase();
    // 获取value值
    val = utils.trim(line.substr(i + 1));

    if (key) {
      // 如果 key 已存在，并且是需要忽略重复的响应头之一，则忽略这个值
      if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
        return;
      }
      if (key === 'set-cookie') {// 特殊处理 set-cookie 响应头，因为它可能有多个值
        // set-cookie字段需要特殊处理
        parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
      } else {
        // 多值处理，使用`,`进行拼接
        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
      }
    }
  });

  return parsed;
};

作用是将原始的 HTTP 响应头字符串解析成一个对象。这对于处理网络请求和响应非常有用，特别是在需要读取和操作响应头信息的时候。