"use strict";

var utils = require("./../utils");
var settle = require("./../core/settle");
var cookies = require("./../helpers/cookies");
var buildURL = require("./../helpers/buildURL");
var buildFullPath = require("../core/buildFullPath");
var parseHeaders = require("./../helpers/parseHeaders");
var isURLSameOrigin = require("./../helpers/isURLSameOrigin");
var createError = require("../core/createError");

// `xhrAdapter` 函数用于发送 HTTP 请求
module.exports = function xhrAdapter(config) {
  // 返回一个新的 Promise 对象
  return new Promise(function dispatchXhrRequest(resolve, reject) {
   
    var requestData = config.data; // 请求数据
   
    var requestHeaders = config.headers; // 请求头

    // 如果请求数据是 FormData 类型，则移除 Content-Type，让浏览器自行设置
    if (utils.isFormData(requestData)) {
      // 如果请求数据是`FormData`类型的，需要删除`Content-Type`请求头，否则浏览器会不知道你所发送的数据类型为`FormData`
      delete requestHeaders["Content-Type"];
    }

    // 创建`request`对象
    var request = new XMLHttpRequest();


    HTTP 基本认证（Basic Authentication）是一种用于 HTTP 协议的简单认证机制，最初定义在 HTTP/1.0 规范中，并继续被 HTTP/1.1 和更高版本所采用。

    作用
    主要作用是允许 HTTP 用户代理（例如浏览器）向服务器提供用户名和密码作为身份验证的手段。
    这种机制通常用于控制对特定资源的访问，要求用户提供有效的认证凭据才能获得对资源的访问权限。

    使用场景
    受限资源访问：用于保护 Web 服务器上的受限资源，只允许经过认证的用户访问。
    简单的身份验证需求：适用于需要基本安全性的场景，如内部网络或开发环境。
    API 访问控制：在某些简单的 API 服务中，使用基本认证来控制对 API 的访问。
    使用方法
    客户端请求：在进行 HTTP 请求时，客户端需要在请求头 Authorization 字段中提供经过编码的认证信息。
    格式通常为 Basic <credentials>，其中 <credentials> 是用户名和密码的组合（username:password），经过 Base64 编码的字符串。

    服务器端验证：服务器接收到请求后，解析 Authorization 请求头，提取并解码凭据，然后验证用户名和密码的有效性。
    如果认证成功，服务器继续处理请求；如果失败，通常会返回一个 401 Unauthorized 状态码，并在响应头 WWW-Authenticate 中标明认证类型为 Basic。

    安全性注意事项：

    由于 Base64 编码不是加密，认证信息可以被轻易解码，因此基本认证应该总是与 HTTPS（安全 HTTP）一起使用，以确保用户名和密码的安全传输。
    适合于信任的环境，或者作为更复杂认证机制的一个组成部分。

    // 处理 HTTP 基本认证。在 HTTP 基本认证中，客户端需要提供用户名和密码来验证其身份。  
    // http身份验证，采用的是 基本认证（Basic access authentication）
    // 只适用于`HTTP Basic auth`，`Bearer`需要自己去定义`Authorization`请求头
    if (config.auth) {
      // 开启之后，会设置`Authorization`请求头，如果已经存在，会被覆盖
      // 用户名
      var username = config.auth.username || "";
      // 密码
      var password = config.auth.password
        ? unescape(encodeURIComponent(config.auth.password))
        : "";
      // 加密策略：用户名和密码用`:`合并，将合并后的字符串使用BASE64加密为密文，然后在前面添加`Basic `
      requestHeaders.Authorization = "Basic " + btoa(username + ":" + password);
    }

    // 根据`baseURL`和`url`拼接完整的请求地址
    var fullPath = buildFullPath(config.baseURL, config.url);
    // 准备发送请求，`buildURL`函数会构建出一个带有查询参数的完整url地址
    // 打开一个请求，使用构建的 URL 和配置的方法
    request.open(
      config.method.toUpperCase(),
      buildURL(fullPath, config.params, config.paramsSerializer),
      true
    );

    // 设置请求超时时间
    request.timeout = config.timeout;

    // 监听onreadystatechange事件
    request.onreadystatechange = function handleLoad() {
      // 0：未初始化，还没有调用send()方法；
      // 1：载入，已调用send()方法，正在发送请求；
      // 2：载入完成，send()方法执行完成，已经接收到全部响应内容；
      // 3：交互，正在解析响应内容；
      // 4：完成，响应内容解析完成，可以在客户端进行调用了；

      // 如果请求未完成，直接返回
      if (!request || request.readyState !== 4) {
        return;
      }

      // status=0说明还没初始化，就是还没调用send()方法
      // 会在`onerror`和`ontimeout`事件之前变成status=0
      // 在特定情况下跳过无响应状态的处理
      if (
        request.status === 0 &&
        !(request.responseURL && 
        request.responseURL.indexOf("file:") === 0)
      ) {
        return;
      }

      // 获取响应头，并转化为json对象
      var responseHeaders =
        "getAllResponseHeaders" in request
          ? parseHeaders(request.getAllResponseHeaders())
          : null;
      // 获取响应数据
      var responseData =
        !config.responseType || config.responseType === "text"
          ? request.responseText
          : request.response;
      // 构建响应对象
      var response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config,
        request: request,
      };

      // settle函数是根据返回的状态码来判断请求是否成功，
      // 然后调用resolve/reject
      // 处理响应，决定是解决（resolve）还是拒绝（reject）Promise
      settle(resolve, reject, response);

      // 清理 request 对象，以便垃圾回收
      request = null;
    };

    // 监听 `onabort` 事件，即请求取消事件
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }
      // 拒绝 Promise 并提供错误信息
      reject(createError("Request aborted", config, "ECONNABORTED", request));
      // 清理 request 对象
      request = null;
    };

    // 网络错误
    request.onerror = function handleError() {
      // 拒绝 Promise 并提供错误信息
      reject(createError("Network Error", config, null, request));
      // 清理 request 对象
      request = null;
    };

    // 请求超时
    request.ontimeout = function handleTimeout() {
      // 超时错误信息
      var timeoutErrorMessage = "timeout of " + config.timeout + "ms exceeded";

      // 如果传入了`config.timeoutErrorMessage`，就使用`config.timeoutErrorMessage`的
      if (config.timeoutErrorMessage) {
        timeoutErrorMessage = config.timeoutErrorMessage;
      }

      // 拒绝 Promise 并提供超时错误信息
      reject(createError(timeoutErrorMessage, config, "ECONNABORTED", request));
      // 清理 request 对象
      request = null;
    };


    /**
     * CSRF跨站点请求伪造
     * CSRF攻击攻击原理及过程如下
     * 1、用户打开浏览器，访问网站A，并输入了用户名和密码进行了登录
     * 2、用户登录成功之后，网站A会把cookie信息返回给浏览器，此时浏览器会保存cookie
     * 3、用户在没有退出登录网站A之前，在同一浏览器中，新开了一个TAB页访问网站B
     * 4、网站B接收到用户请求之后，返回一些攻击性的代码，并发出一个请求要访问网站A
     * 5、浏览器在接收到这些攻击性代码之后，会根据网站B的请求，在用户不知情的情况下携带cookie信息，向网站A发出请求。
     * 6、网站A并不知道这个请求是由网站B发起的。所以会接收并处理这条请求，导致来自网站B的恶意代码被执行了
     * 
     * 解决方案：
     * 1、验证 HTTP Referer 字段。该字段记录了http请求的来源地址，但是Referer字段是由浏览器提供的，每个浏览器对于Referer字段的实现可能会有所差异。而且Referer字段是可以被篡改的
     * 2、在 HTTP 请求头中自定义属性并验证。比如添加token并验证。我们可以在请求头中添加token信息，后端通过验证这个token信息，来判断是否为csrf攻击。axios就是基于这种方式去做csrf防御的
     * 3、在请求地址中添加 token 并验证。这种做法要比验证 HTTP Referer 字段要好一些，但是这种做法会导致请求地址边长，很有可能会超出get请求地址长度的限制。
     */

    // 防御 CSRF（跨站请求伪造）
    // 需要在标准浏览器中才能使用，如果是在react-native中就不能使用了
    if (utils.isStandardBrowserEnv()) {
      // 默认值
      // {
      //   xsrfCookieName: 'XSRF-TOKEN',
      //   xsrfHeaderName: 'X-XSRF-TOKEN',
      // }
      // 这段代码的逻辑很简单。如果 cookie 中包含 XSRF-TOKEN 这个字段，就把 header 中 X-XSRF-TOKEN 字段的值设为 XSRF-TOKEN 对应的值

      // `withCredentials`配置参数为`true`并且是同源请求
      // isURLSameOrigin涉及到一些知识点，需要重点分析
      // 获取 CSRF token（如果存在）并设置到请求头中
      var xsrfValue =
        (config.withCredentials || isURLSameOrigin(fullPath)) &&
        config.xsrfCookieName
          ? cookies.read(config.xsrfCookieName)
          : undefined;

      if (xsrfValue) {
        // 设置请求头
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    }

    // 添加请求头到请求中
    if ("setRequestHeader" in request) {
      // 遍历 requestHeaders 对象，并使用 setRequestHeader 方法将每个头字段添加到请求中
      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
        if (
          typeof requestData === "undefined" &&
          key.toLowerCase() === "content-type"
        ) {
          // 空数据需要删除`content-type`请求头
          delete requestHeaders[key];
        } else {
          // 调用`setRequestHeader`设置请求头
          request.setRequestHeader(key, val);
        }
      });
    }

    // 设置跨域的时候是否携带cookie，同域的时候不管设置或者不设置，效果都是一样的
    if (!utils.isUndefined(config.withCredentials)) {
      request.withCredentials = !!config.withCredentials;
    }

    // 设置响应数据类型
    if (config.responseType) {
      try {
        request.responseType = config.responseType;
      } catch (e) {
        // 忽略与 XMLHttpRequest 级别 2 不兼容的 DOMException
        // 浏览器引发的预期DomeException与XMLHttpRequest级别2不兼容。
        // 但是，对于`json`类型，这可以被限制，因为它可以通过默认的`transformResponse`函数进行解析。
        if (config.responseType !== "json") {
          throw e;
        }
      }
    }

    // 监听下载和上传事件（如果提供了相应的回调函数）
    // 监听下载事件，下载文件的时候
    if (typeof config.onDownloadProgress === "function") {
      request.addEventListener("progress", config.onDownloadProgress);
    }
    // 监听上传事件，上传文件的时候，但是并不是所有浏览器都支持上传事件
    if (typeof config.onUploadProgress === "function" && request.upload) {
      request.upload.addEventListener("progress", config.onUploadProgress);
    }

    // 处理请求取消逻辑
    if (config.cancelToken) {
      // cancelToken对象，该对象上面会存在一个promise实例
      // 一旦promise实例变成成功状态，就会来到`then`函数这里
      config.cancelToken.promise.then(function onCanceled(cancel) {
        if (!request) {
          return;
        }
        // 中断请求
        request.abort();
        reject(cancel);
        request = null;
      });
    }

    if (!requestData) {
    // 请求数据不存在的情况下，置为null
      requestData = null;
    }

    // 发送请求
    request.send(requestData);
  });
};
