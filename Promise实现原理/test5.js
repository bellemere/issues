var maybeOneOneSecondLater = function () {
  //pending存在表示unresolved, 不存在则表示resolved
  var pending = [], value;
  setTimeout(function () {
    value = 1;
    for (var i = 0, ii = pending.length; i < ii; i++) {
      var callback = pending[i];
      callback(value);
    }
    pending = undefined;
  }, 1000);
  return {
    then: function (callback) {
      if (pending) {
        pending.push(callback);
      } else {
        callback(value);
      }
    }
  };
};

var m = maybeOneOneSecondLater();

//所有注册的回调函数都被执行了
m.then(()=>console.log(1))
m.then(()=>console.log(2))
m.then(()=>console.log(3))

//过期注册的函数也被调用了
setTimeout(function(){
  m.then(()=>console.log(4))
}, 3000);