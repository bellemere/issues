var defer = function () {
  var pending = [],
    value;
  return {
    /*
    resolve用来将promise的状态从pending转换成resolved
    回调函数的返回值会用来resolve promise，并传递给下一个promise的回调函数
    */
    resolve: function (_value) {
      if (pending) {
        /*
        如果value是一个普通的值，那么相当于立刻执行ref()的then方法
        如果value是一个promise，那么相当于把then里面的callback注册到这个promise上，相当于用这个promise“取代”了原先的promise
        */
        value = ref(_value); // values wrapped in a promise
        for (var i = 0, ii = pending.length; i < ii; i++) {
          var callback = pending[i];
          value.then(callback); // then called instead
        }
        pending = undefined;
      }
    },
    promise: {
      //then用来注册回调函数
      then: function (_callback) {
        var result = defer();
        //用回调函数的返回值resolve返回的promise
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