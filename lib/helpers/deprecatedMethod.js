'use strict';

/*eslint no-console:0*/

/**
 * Supply a warning to the developer that a method they are using
 * has been deprecated.
 *
 * @param {string} method The name of the deprecated method
 * @param {string} [instead] The alternate method to use if applicable
 * @param {string} [docs] The documentation URL to get further details
 */
module.exports = function deprecatedMethod(method, instead, docs) {
  try {
    console.warn('DEPRECATED method `' + method + '`.' + (instead ? ' Use `' + instead + '` instead.' : '') + ' This method will be removed in a future release.');
    if (docs) {
      console.warn('For more information about usage see ' + docs);
    }
  } catch (e) { /* Ignore */ }
};

用于向开发者提供警告，表明他们正在使用的方法已被弃用，指导开发者向新的API过渡，同时保持向后兼容性。