var defer = function () {
  var pending = [], value;
  return {
    resolve: function (_value) {
      if (pending) {
        value = _value;
        for (var i = 0, ii = pending.length; i < ii; i++) {
          var callback = pending[i];
          callback(value);
        }
        pending = undefined;
      } else {
        throw new Error("A promise can only be resolved once.");
      }
    },
    then: function (callback) {
      if (pending) {
        pending.push(callback);
      } else {
        callback(value);
      }
    }
  }
};

var oneOneSecondLater = function () {
  var result = defer();
  setTimeout(function () {
    result.resolve(0);
    //如果去掉下面这行的注释，会抛出一个错误
    //result.resolve(1);
  }, 1000);
  return result;
};

var o = oneOneSecondLater();

o.then((val)=>console.log(val));