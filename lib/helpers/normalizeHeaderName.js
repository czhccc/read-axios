'use strict';

var utils = require('../utils');

/**
 *
 * @param {Object} headers 请求或响应头对象。
 * @param {string} normalizedName 要标准化的头字段名称。
 */
module.exports = function normalizeHeaderName(headers, normalizedName) {
  // 遍历 headers 对象的每个字段
  utils.forEach(headers, function processHeader(value, name) {
    // 如果当前字段名称的大写形式等于指定字段名称的大写形式，且当前字段名称与指定字段名称不完全相同
    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
      headers[normalizedName] = value;// 更新 headers，将当前字段值赋给指定的标准字段名称
      delete headers[name];// 删除原有的字段
    }
  });
};

用于标准化 HTTP 请求或响应头中的头字段名称。这在处理 HTTP 头时非常有用，因为头字段名称是大小写不敏感的。
例如，无论开发者如何书写“Content-Type”（可能是“content-type”、“Content-type”等），都可以确保它在 headers 对象中统一表示为同一个字段名称。
这有助于简化后续处理头字段的逻辑，减少因大小写差异导致的错误。
