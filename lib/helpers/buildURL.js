'use strict';

var utils = require('./../utils');

// 编码
// encodeURIComponent会把一些特殊字符也进行编码，比如$，+等
// 所以encodeURIComponent编码完成之后需要把一些特殊字符给转义回来
function encode(val) {
  return encodeURIComponent(val).
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}



buildURL 函数的本质就是根据不同类型的参数进行适当的拼接操作，以构建正确格式的 URL 查询字符串。

序列化参数：然后根据参数的类型选择不同的序列化方法：
如果有自定义的序列化函数，使用该函数处理参数。
如果参数是 URLSearchParams 对象，使用其 toString 方法进行序列化。
否则，遍历参数对象，将每个参数根据其类型（数组、对象、Date 等）转换为字符串，并进行URL编码。
构建查询字符串：将处理后的参数拼接成查询字符串的形式。

组合 URL：将查询字符串附加到原始 URL 上，考虑是否已经存在查询字符串或哈希部分。

/**
 * 构建一个带查询参数的url地址
 *
 * @param {string} url url地址
 * @param {object} [params] 参数
 * @param {Function} [paramsSerializer] 自定义序列化参数函数
 * @returns {string} 构建好的url
 * 
 * eg：buildURL('http://xxx.xx.x', {age:10,name:'张三',hobby:['学习','睡觉']})
 *  
 * ==> http://xxx.xx.x?age=10&name='张三'&hobby[]='学习'&hobby[]='睡觉'
 */
module.exports = function buildURL(url, params, paramsSerializer) {
  if (!params) { // 不存在参数的情况下，不做任何处理，直接返回url
    return url;

  // 序列化参数
  var serializedParams;
  if (paramsSerializer) { // 如果存在自定义序列化参数的函数，就是用自定义的
    serializedParams = paramsSerializer(params);
  } else if (utils.isURLSearchParams(params)) { // 如果传入的参数是 `URLSearchParams` 类型的，则可以直接调用`toString`方法进行序列化
    // 可参考 https://developer.mozilla.org/zh-CN/docs/Web/API/URLSearchParams
    serializedParams = params.toString();
  } else {
    // url查询参数数组，最终存储的是这种形式：`['name=张三','age=10','hobby[]=学习','hobby[]=睡觉']`
    var parts = [];
    // 遍历params参数
    utils.forEach(params, function serialize(val, key) {
      if (val === null || typeof val === 'undefined') { // 跳过值为`null`和`undefined`的参数
        return;
      }
      // 从上面的例子中可以看见，参数可能会是一个数组（hobby:['学习','睡觉']）。
      // 所以统一转化为数组进行处理
      if (utils.isArray(val)) {
        // 值是数组的情况下，key需要添加[]。
        // hobby:['学习','睡觉'] ==>  hobby[]='学习'&hobby[]='睡觉'
        key = key + '[]';
      } else {
        // 值不是数组的情况下，需要转化为数组
        val = [val];
      }

      // 对值进行遍历
      utils.forEach(val, function parseValue(v) {
        if (utils.isDate(v)) {
          v = v.toISOString(); // 值是`Date`类型的，需要使用`toISOString`转化为字符串
        } else if (utils.isObject(v)) {
          v = JSON.stringify(v); // 值是对象的情况下，使用JSON.stringify转化为字符串
        }
        parts.push(encode(key) + '=' + encode(v)); // 拼接key和val值，同时还需要对key和val进行编码
      });
    });
    // 将数组拼接成查询参数，eg：age=10&name='张三'&hobby[]='学习'&hobby[]='睡觉'
    serializedParams = parts.join('&');
  }

  if (serializedParams) {
    // 序列化参数存在的情况
    // 查找是否存在hash
    var hashmarkIndex = url.indexOf('#');
    // 存在hash就需要去掉，否则请求地址是无效的
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }
    // 将序列化参数拼接到url中
    // 如果存在`?`这说明url地址已经存在参数（eg：http://xxx.xx.xx?name='张三'），
    // 否则就是不存在（http://xxx.xx.xx）
    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};


/**
 * 总结：
 * 
 * 重点关注 `else`部分的内容，涉及到一些参数序列化的知识
 * 
 * 参数序列化关键点：
 * 1、值为null或者undefined的不需要进行序列化
 * 2、参数类型为`URLSearchParams`的直接使用`toString`方法进行序列化
 * 3、值为数组的参数，查询参数的key值需要添加`[]`标识为一个数组
 * 4、值为`Date`类型的需要使用`toISOString`转化为字符串
 * 5、值是对象的情况下，使用JSON.stringify转化为字符串
 * 6、其余情况，直接对key，val进行拼接即可
 */

/**
 * 设计的巧妙之处：
 * 
 * 1、首先是`var parts = []`，存储的是每一部分的参数（eg：`['name=张三','age=10','hobby[]=学习','hobby[]=睡觉']`），最终通过`parts.join('&')`拼接成完整的字符串。减少了字符串拼接的繁琐工作
 * 
 * 2、在处理 key-val 拼接的时候，考虑到会存在数组的参数，所以在遍历参数的时候，将所有val统一转化为数组进行处理，然后在对val数组进行遍历拼接。统一了处理的方式，这样子就可以不用通过if-else分别对数组和非数组进行分别处理。
 */


/*
输入：
URL: 'http://example.com/api'
参数：{ userId: 123, name: 'John Doe' }
输出：

'http://example.com/api?userId=123&name=John%20Doe'
在这个例子中，buildURL 函数将基本 URL 'http://example.com/api' 和参数对象 { userId: 123, name: 'John Doe' } 组合在一起，生成了一个包含查询参数的 URL。

示例 2：带数组的参数
输入：

URL: 'http://example.com/api'
参数：{ userId: 123, hobbies: ['reading', 'gaming'] }
输出：

'http://example.com/api?userId=123&hobbies[]=reading&hobbies[]=gaming'
在这个例子中，hobbies 是一个数组，所以在序列化时，每个元素都会以 hobbies[] 作为键来处理。

示例 3：带特殊字符的参数
输入：

URL: 'http://example.com/api'
参数：{ search: 'C++ programming' }
输出：

'http://example.com/api?search=C%2B%2B%20programming'
这里 search 参数中包含特殊字符 +，它会被正确编码。

示例 4：参数中包含 Date 对象
输入：

URL: 'http://example.com/api'
参数：{ startDate: new Date('2023-01-01') }
假设输出：

'http://example.com/api?startDate=2023-01-01T00%3A00%3A00.000Z'
这里 startDate 是一个 Date 对象，它会被转换为 ISO 格式的字符串。

示例 5：参数中包含对象
输入：

URL: 'http://example.com/api'
参数：{ filter: { type: 'new', active: true } }
输出：

'http://example.com/api?filter=%7B%22type%22%3A%22new%22%2C%22active%22%3Atrue%7D'
这里 filter 参数是一个对象，它会被转换为 JSON 字符串并进行编码。

*/