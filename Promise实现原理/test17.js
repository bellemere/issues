var ref = function (value) {
  if (value && typeof value.then === "function")
    return value;
  return {
    then: function (callback) {
      return ref(callback(value));
    }
  };
};

var reject = function (reason) {
  return {
    then: function (callback, errback) {
      return ref(errback(reason));
    }
  };
};

var defer = function () {
  var pending = [],
    value;
  return {
    resolve: function (_value) {
      if (pending) {
        /*
        _value如果是reject返回的，则调用errback
        _value如果是正常的，则调用callback
        */
        value = ref(_value);
        for (var i = 0, ii = pending.length; i < ii; i++) {
          //apply允许将数组参数拆分给value
          value.then.apply(value, pending[i]);
        }
        pending = undefined;
      }
    },
    promise: {
      then: function (_callback, _errback) {
        var result = defer();
        var callback = function (value) {
          result.resolve(_callback(value));
        };
        var errback = function (reason) {
          result.resolve(_errback(reason));
        };
        if (pending) {
          pending.push([callback, errback]);
        } else {
          value.then(callback, errback);
        }
        return result.promise;
      }
    }
  };
};


var result = defer();
var promise = result.promise;

promise.then(function(v){
  console.log(v);
}, function(reason){
  console.log(reason);
})

setTimeout(function () {
  if (Math.random() < .5) {
    result.resolve(1);
  } else {
    result.resolve(reject("Can't provide one."));
  }
}, 1000);


