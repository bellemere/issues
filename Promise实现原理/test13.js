var ref = function (value) {
  if (value && typeof value.then === "function")
    return value;
  return {
    then: function (callback) {
      return ref(callback(value));
    }
  };
};

var defer = function () {
  var pending = [],
    value;
  return {
    resolve: function (_value) {
      if (pending) {
        value = ref(_value); // values wrapped in a promise
        for (var i = 0, ii = pending.length; i < ii; i++) {
          var callback = pending[i];
          value.then(callback); // then called instead
        }
        pending = undefined;
      }
    },
    promise: {
      then: function (_callback) {
        var result = defer();
        // callback is wrapped so that its return
        // value is captured and used to resolve the promise
        // that "then" returns
        var callback = function (value) {
          result.resolve(_callback(value));
        };
        if (pending) {
          pending.push(callback);
        } else {
          value.then(callback);
        }
        return result.promise;
      }
    }
  };
};

function oneOneSecondLater(){
  var d = defer();
  setTimeout(function(){
    d.resolve(1);
  }, 1000);
  return d.promise;
}

var a = oneOneSecondLater();
var b = oneOneSecondLater();

var c = a.then(function(a){
  return b.then(function (b) {
    return a + b;
  });
}).then(function(v){
  console.log(v);
})