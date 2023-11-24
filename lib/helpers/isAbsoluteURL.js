'use strict';

/**
 * Determines whether the specified URL is absolute
 *
 * @param {string} url The URL to test
 * @returns {boolean} True if the specified URL is absolute, otherwise false
 */
module.exports = function isAbsoluteURL(url) {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.

  // 这个正则表达式匹配以 <scheme>:// 或 //（协议相对 URL）开头的字符串。
  // <scheme> 部分定义为以字母开头，后跟字母、数字、加号、点或连字符的组合。
  // 正则表达式使用 i 标志，使匹配不区分大小写。

  return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
};

用于判断一个给定的 URL 是否是绝对 URL。这个函数对于处理网络请求和资源加载等场景非常有用，特别是在需要区分绝对 URL 和相对 URL 的情况下。