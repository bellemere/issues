var Promise = function () {};

var isPromise = function (value) {
  return value instanceof Promise;
};

var defer = function () {
  var pending = [],
    value;

  Promise.prototype.then = function (callback) {
    if (pending) {
      pending.push(callback);
    } else {
      callback(value);
    }
  };

  var promise = new Promise();

  return {
    resolve: function (_value) {
      if (pending) {
        value = _value;
        for (var i = 0, ii = pending.length; i < ii; i++) {
          var callback = pending[i];
          callback(value);
        }
        pending = undefined;
      }
    },
    promise: promise
  };
};

module.exports = defer;