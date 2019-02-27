var maybeOneOneSecondLater = function () {
  //保存回调函数
  var callback;
  setTimeout(function () {
    var value = 1;
    callback(value);
  }, 1000);
  return {
    then: function (_callback) {
      callback = _callback;
    }
  };
};

var m = maybeOneOneSecondLater();

m.then(()=>console.log(1));
m.then(()=>console.log(2));
m.then(()=>console.log(3));

setTimeout(function(){
  m.then(()=>console.log(4));
}, 3000);