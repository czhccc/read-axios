'use strict';

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
module.exports = function combineURLs(baseURL, relativeURL) {
  // 如果`baseURL`末尾存在`/`则去掉
  // 如果`relativeURL`开头存在`/`则去掉
  // 在`baseURL`和`relativeURL`中间添加`/`
  // 这样做可以避免以下的情况:
  // baseURL：http://xx.x/；relativeURL：/api/v1/demo
  // ==> http://xx.x//api/v1/demo  会出现多条 `/`
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
};

作用是将一个基础 URL (baseURL) 和一个相对 URL (relativeURL) 组合成一个完整的 URL。这个函数主要解决了路径连接时可能出现的重复斜杠 (/) 问题。
接收参数：
baseURL：基础 URL，如 'http://example.com/'。
relativeURL：相对 URL，如 '/api/data'。

处理斜杠：
如果 baseURL 末尾有斜杠，使用正则表达式 replace(/\/+$/, '') 去除这些斜杠。
如果 relativeURL 开头有斜杠，使用正则表达式 replace(/^\/+/, '') 去除这些斜杠。

组合 URL：
将处理后的 baseURL 和 relativeURL 通过一个斜杠 / 连接起来。
处理无 relativeURL 的情况：

如果没有提供 relativeURL，则函数只返回 baseURL。

例如：
baseURL：'http://example.com/'，relativeURL：'/api/data' => 'http://example.com/api/data'
baseURL：'http://example.com'，relativeURL：'api/data' => 'http://example.com/api/data'
baseURL：'http://example.com/'，relativeURL：无 => 'http://example.com/'


不使用正则表达式：
function combineURLs(baseURL, relativeURL) {
  // 移除 baseURL 末尾的斜杠
  if (baseURL.endsWith('/')) {
    baseURL = baseURL.slice(0, -1);
  }
  // 移除 relativeURL 开头的斜杠
  if (relativeURL.charAt(0) === '/') {
    relativeURL = relativeURL.slice(1);
  }
  return baseURL + '/' + relativeURL;
}
