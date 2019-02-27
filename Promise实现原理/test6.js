var defer = function () {
  var pending = [], value;
  return {
    resolve: function (_value) {
      value = _value;
      for (var i = 0, ii = pending.length; i < ii; i++) {
        var callback = pending[i];
        callback(value);
      }
      pending = undefined;
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
    result.resolve(1);
  }, 1000);
  return result;
};

var o = oneOneSecondLater();

o.then(()=>console.log(1));
o.then(()=>console.log(2));
o.then(()=>console.log(3));

setTimeout(function(){
  o.then(()=>console.log(4));
}, 3000);