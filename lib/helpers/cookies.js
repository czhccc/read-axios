'use strict';

var utils = require('./../utils');

module.exports = (
  utils.isStandardBrowserEnv() ?

  // 标准浏览器环境支持 document.cookie
    (function standardBrowserEnv() {
      return { // 返回一个对象，包含 write, read 和 remove 函数
        // 写入 cookie
        write: function write(name, value, expires, path, domain, secure) {
          var cookie = []; // 创建一个数组用于存储 cookie 字符串的各个部分
          cookie.push(name + '=' + encodeURIComponent(value));// 将 cookie 的名称和值加入数组，值通过 encodeURIComponent 编码

          if (utils.isNumber(expires)) {// 如果提供了有效的过期时间，将其转换为 GMT 格式的字符串，并加入数组
            cookie.push('expires=' + new Date(expires).toGMTString());
          }

          if (utils.isString(path)) {// 如果提供了路径，将其加入数组
            cookie.push('path=' + path);
          }

          if (utils.isString(domain)) {// 如果提供了域，将其加入数组
            cookie.push('domain=' + domain);
          }

          if (secure === true) {// 如果 secure 标志为 true，将 'secure' 加入数组
            cookie.push('secure');
          }

          document.cookie = cookie.join('; ');// 将数组中的所有部分用分号和空格连接起来，赋值给 document.cookie
        },

        read: function read(name) {// 读取 cookie
          // 使用正则表达式匹配给定名称的 cookie 值
          var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
          return (match ? decodeURIComponent(match[3]) : null);// 如果匹配成功，返回解码后的 cookie 值；否则返回 null
        },

        remove: function remove(name) {// 删除 cookie
          this.write(name, '', Date.now() - 86400000);// 通过将 cookie 的过期时间设置为当前时间减去一天来删除 cookie
        }
      };
    })() :

  // 非标准浏览器环境（例如 web workers, react-native）不支持 document.cookie
    (function nonStandardBrowserEnv() {
      return {// 返回一个具有空操作的对象，因为这些环境不支持 cookie
        write: function write() {},
        read: function read() { return null; },
        remove: function remove() {}
      };
    })()
);

用于处理浏览器 cookies 的模块，它根据运行环境是否为标准的浏览器环境来决定具体的实现方式。
在标准浏览器环境中，它提供了用于操作 document.cookie 的 write、read 和 remove 函数。
在非标准浏览器环境（如 Web Workers 或 React Native）中，由于这些环境通常不支持 document.cookie，因此提供了空操作的函数。