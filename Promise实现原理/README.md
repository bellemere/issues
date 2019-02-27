### 为什么我们需要Promise

涉及到异步编程的时候，js经常会遇到回调地狱，例如(test1.js)：

```javascript
function load(url, cb){
  setTimeout(function(){
    console.log(url);
    cb()
  }, 1000);
}

load('a.com', function(){
  load('b.com', function(){
    load('c.com', function(){
      load('d.com', function(){
        load('e.com', function(){
          load('f.com', function(){
            load('g.com', function(){
              //...
            })	
          })
        })
      })
    })
  })
})
```

上面的嵌套里面往往还含有别的逻辑，所以嵌套会更加恐怖。



而Promise则是如下处理（test2.js）：

```javascript
function load2(url){
  return new Promise(function(resolve){
    setTimeout(function(){
      console.log(url);
      resolve();
    }, 1000)
  })
}

load2('a.com')
.then(function(){
  return load2('b.com')
})
.then(function(){
  return load2('c.com')
})
.then(function(){
  return load2('d.com')
})
.then(function(){
  return load2('e.com')
})
.then(function(){
  return load2('f.com')
})
.then(function(){
  return load2('g.com')
})
```



从代码阅读体验来说，会好很多。



------



Promise是如何一步步实现的呢？

最近看到了promise库Q的作者的一篇文章，讲述了从0实现Q的大概步骤及原理。



### 原文出处

https://github.com/kriskowal/q/tree/v1/design



### 一些名词

pending：promise起始状态

resolved：异步操作取得了结果（不管成功还是失败）

fulfilled：resolved成功的状态（ES6里面的resolve是进入这种状态）

rejected： resolved失败的状态



### 前言

假设我们写的某个函数并不是马上返回一个值，那如果我们需要对这个值做一些操作，最直接的方式是给函数传入一个回调函数作为参数：

```javascript
var oneOneSecondLater = function (callback) {
  setTimeout(function () {
    //假设value是我们异步操作最终取得的值
    var value = 1;
    callback(value);
  }, 1000);
};
```



通常我们还需要对错误的情况（比如网络通信失败/文件读写失败）也进行处理，所以除了正常的callback，我们往往还需要提供一个errback的回调函数：

```javascript
var maybeOneOneSecondLater = function (callback, errback) {
  setTimeout(function () {
    if (Math.random() < .5) {
      callback(1);
    } else {
      errback(new Error("Can't provide one."));
    }
  }, 1000);
};
```

把error当成一个参数传递给回调函数有不同的方法，比如可以当成位置参数，或者通过一个哨兵值来区分。不过，这些没有一个实际地模型化抛出错误。try/catch以及错误的目的是把错误处理延迟到程序确实想要处理它的地方。如果他们没有被处理，必须有一些机制隐式地传递这些错误。



### Promise

让我们考虑一种更为通用的方式。

原先我们的函数返回一个值或是抛出一个错误，现在我们返回一个对象，这个对象包含了这个函数的最终结果（成功或者失败）。这个对象就是一个promise，它最终一定会定型（也就是resolved）。我们可以在这个对象上调用一个方法来观察到它最终是成功（fulfilled）还是失败（rejected）了。如果promise对象rejected了，衍生的promise对象会因为相同的理由reject。



在上述的设计理念的迭代过程中，我们先把promise模型化成一个拥有then方法的对象，then方法用来注册我们的回调函数（test3.js）：

```javascript
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
//3

setTimeout(function(){
  m.then(()=>console.log(4));
}, 3000);
//不执行
```



如上，这个设计有2个缺点：

* 最后一次的then调用决定了使用的回调函数，而我们希望注册的每个回调函数在收到结果的时候都能被通知到。
* 如果回调函数在promise对象构建后的一秒后注册，就不会被调用了。



我们先看看ES6里面Promise针对上面两种情况的处理结果（test4.js）：

```javascript
var p = new Promise(function(resolve){
  setTimeout(function(){
    resolve()
  }, 1000)
});

//注册了多个回调函数
p
.then(()=>console.log(1))
.then(()=>console.log(2))
.then(()=>console.log(3))
//1
//2
//3

//在Promise对象构建后再注册回调函数
setTimeout(function(){
  p.then(()=>console.log(4))
}, 3000);
//4
```



我们希望promise对象能够注册任意数量的回调函数，并且不管在超时前或者已经超时都能够注册。我们可以通过让promise拥有2个状态来实现上述需求。



promise开始的时候是未定型的（pending），这时候所有的回调函数都添加到一个观察数组里面。当promise定型了（resolved），数组里的所有回调函数都会被调用。在promise定型后，新注册的回调函数会马上执行。我们通过观察数组是否存在来区分promise的状态（pending/resolved）。

修改代码如下（test5.js）：

```javascript
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
//1
//2
//3

//过期注册的函数也被调用了
setTimeout(function(){
  m.then(()=>console.log(4))
}, 3000);
//4
```



我们再把上面的内容整理下，可以分成2个部分：

* 第一个部分用来注册观察者（回调函数），也就是then方法在做的事。
* 另一个部分用来通知观察者（回调函数），也就是resolve方法在做的事。

整理后如下（test6.js）：

```javascript
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
//1
//2
//3

setTimeout(function(){
  o.then(()=>console.log(4));
}, 3000);
//4
```

resolve函数目前还有个缺陷，它可以被多次改变。

> 注：原文这里说resolve可以被多次调用改变value的值，但其实首次调用后，由于pending已经被置成undefined，所以后续调用会报错。但在报错之前，value的值确实是被改变了。



上面的result即是我们的promise对象，我们不希望它被不同的值resolve会发生改变，所以我们加了个限制：只允许被首次调用（test7.js）：

```javascript
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
//0
```

针对resolve的多次调用，我们可以抛出一个错误，也可以忽略掉第一次后的多次调用。

有一种需求是多个异步抢占式调用resolve，后续的全部被忽略掉。

这里，我们用忽略后续调用取代抛出一个错误。



至此，我们实现了注册多个回调函数以及多次定型promise对象。

代码如下（test8.js）：

```javascript
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
```



---



上述设计由于两个考量做出了一些变动。

第一个考量是把promise跟resolver整合或者分离都很有用。

第二个考量是把promise和别的值用某种方法区分开来。

* 把promise和resolver分离开来允许我们遵循“最小权限”编程。给一个人promise应该只给予观察结果的权限（注：也就是说如果去了resolve那么promise只剩下then用来注册回调函数），同理给某人resolver也应该只给予决定最终结果的权限。这两个权限不该隐式互相给予。时间证明额外的权限不可避免会被滥用，并且很难检验。
  分离的缺点在于废弃的promise对象造成的垃圾回收机制的额外压力。
* 同样的，有许多种方法把promise跟别的值区分开来，最直观也是最强大的区分方式是用原型继承。

代码如下（promise.js）：

```javascript
var Promise = function () {
};

var isPromise = function (value) {
  return value instanceof Promise;
};

var defer = function () {
  var pending = [], value;
  var promise = new Promise();
  promise.then = function (callback) {
    if (pending) {
      pending.push(callback);
    } else {
      callback(value);
    }
  };
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

//module.exports = defer;
```

使用原型继承的缺点是在单个程序中，promise库只有一个实例能被使用。



> 这段不太理解。
>
> 首先上面的代码并未用到原型继承，其次按照上面的代码，是可以正常运行的。
>
> 当我们把上述最后一行代码的注释去掉并保存成一个promise.js的时候，假设我们在另一个文件编写如下代码（test9.js）：
>
> ```javascript
> var promise = require('./promise.js');
> 
> var d = new promise();
> var d2 = new promise();
> 
> var p = d.promise;
> var r = d.resolve;
> p.then((val)=>console.log(val));
> p.then((val)=>console.log(++val));
> 
> var p2 = d2.promise;
> var r2 = d2.resolve;
> p2.then((val)=>console.log(val));
> p2.then((val)=>console.log(++val));
> 
> setTimeout(function(){
>   r(1);
>   r2(10);
> }, 1000);
> 
> //1
> //2
> //10
> //11
> ```
>
> 这是正确的。
>
> 因为上述promise.js文件里面的defer返回的对象里面的promise其实就是一个含有then方法的对象。
>
>
> 如果要像文章作者说的那样，promise.js应该修改如下（promise2.js）：
>
> ```javascript
> var Promise = function () {};
> 
> var isPromise = function (value) {
>   return value instanceof Promise;
> };
> 
> var defer = function () {
>   var pending = [],
>     value;
> 
>   Promise.prototype.then = function (callback) {
>     if (pending) {
>       pending.push(callback);
>     } else {
>       callback(value);
>     }
>   };
> 
>   var promise = new Promise();
> 
>   return {
>     resolve: function (_value) {
>       if (pending) {
>         value = _value;
>         for (var i = 0, ii = pending.length; i < ii; i++) {
>           var callback = pending[i];
>           callback(value);
>         }
>         pending = undefined;
>       }
>     },
>     promise: promise
>   };
> };
> 
> module.exports = defer;
> ```
>
> 此时将上述代码保存成promise2.js并继续执行之前的代码（test10.js）：
>
> ```javascript
> var promise = require('./promise2.js');
> 
> var d = new promise();
> var d2 = new promise();
> 
> var p = d.promise;
> var r = d.resolve;
> p.then((val)=>console.log(val));
> p.then((val)=>console.log(++val));
> 
> var p2 = d2.promise;
> var r2 = d2.resolve;
> p2.then((val)=>console.log(val));
> p2.then((val)=>console.log(++val));
> 
> setTimeout(function(){
>   r(1);
>   r2(10);
> }, 1000);
> 
> //10
> //11
> //10
> //11
> ```
>
> 分析下上面的代码，当执行```var d2 = new promise();```的时候，原型继承已经复写了```var d = new promise();```时的then方法，也就是说，后续所有实例的then方法都是在往p2这个promise里面注册回调函数。
>
> 可以试着把setTimeout里面的r(1)注释掉，对打印的结果是没有影响的，因为d这个promise里面没有注册任何回调函数。
>
>
> 上述如有误，恳请斧正。





另一种方法是使用“鸭子类型”，让promise包含一个按惯例命名的then方法，同其他值区分开来。

这个缺点是，无法同其他恰好有then方法的对象区分开来。

实际使用的时候，这个不是问题，在可控范围内。（test11.js）

```javascript
var isPromise = function (value) {
  return value && typeof value.then === "function";
};

var defer = function () {
  var pending = [],
    value;
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
    promise: {
      then: function (callback) {
        if (pending) {
          pending.push(callback);
        } else {
          callback(value);
        }
      }
    }
  };
};
```



下一个重大改变是让组合promise更加简单，允许新的promise从旧的promise里面获取值。

假设你从2个函数调用获取了2个promise来取得2个值，我们想要创建一个新的promise来取得他们的和。考虑下如何用回调函数来实现这个（test12.js）：

```javascript
function oneOneSecondLater(cb) {
  setTimeout(cb, 1000);
  //cb();
}

var twoOneSecondLater = function (callback) {
  var a, b;
  var consider = function () {
    if (a === undefined || b === undefined)
      return;
    callback(a + b);
  };
  oneOneSecondLater(function (_a) {
    a = _a;
    consider();
  });
  oneOneSecondLater(function (_b) {
    b = _b;
    consider();
  });
};

twoOneSecondLater(function (c) {
  // c === 2
});
```

上述方法出于一些原因其实很脆弱，尤其这里需要一个哨兵值来判断是否回调函数被调用了。同时也要小心事件循环结束前回调函数是否被触发，```consider```函数必须在被使用前就定义（如果```oneOneSecondLater```里面的cb没有设置setTimeout，同时```consider```定义在使用后面，那么就会报错）。



通过一些步骤，我们可以借助promise用更少的代码来实现上述功能，并隐式地做错误冒泡处理（test13.js）：

```javascript
var a = oneOneSecondLater();
var b = oneOneSecondLater();

var c = a.then(function(a){
  return b.then(function (b) {
    return a + b;
  });
}).then(function(v){
  console.log(v);
})
```



要让上面的例子可行，有几个任务要按序完成：

* "then"方法必须返回一个promise
* 返回的promise最后必须用回调函数的返回值resolve
* 回调函数的返回值必须是完成的或者promise



> 先看下面的demo：
>
> ```javascript
> promise
> .then(()=>1)
> .then((v)=>console.log(v));
> //1
> ```
>
> 对于上面的例子，第一个then执行后，必须返回一个promise（promise通过then区分于别的值），这样第二个then才不会报错。
>
> 同时，我们希望1能作为参数传到第二个then的回调函数参数里。
>
> 相当于：
>
> ```javascript
> newPromise.then((v)=>console.log(v));
> ```
>
> 这个newPromise就是第一个then的返回值，回想一下之前的内容，当promise已经从pending变成fullfilled（resolved）时，后续注册的回调函数会马上调用，调用的参数就是resolve时候的值。
>
> 所以遇到有返回值的回调函数的时候，我们要想办法把return的value转变成用return的值resolve的已经完成的promise。



将值转化成已经完成的promise很直观，下面就是一个值已经完成并且立刻通知观察者（立即执行回调函数）的promise。

```javascript
//value是我们希望return的值
var ref = function (value) {
  return {
    then: function (callback) {
      callback(value);
    }
  };
};
```

这个方法可以被改成不管value是一个普通的值还是promise都被强制转变成promise：

```javascript
var ref = function (value) {
  if (value && typeof value.then === "function")
    return value;
  return {
    then: function (callback) {
      callback(value);
    }
  };
};
```

现在，我们为了处理回调函数的返回值开始修改我们的"then"方法。上面的"ref"很简单，我们把回调函数的返回值强制转化成promise并且立即返回它。

```javascript
var ref = function (value) {
  if (value && typeof value.then === "function")
    return value;
  return {
    then: function (callback) {
      return ref(callback(value));
    }
  };
};
```



>上面的ref函数已经实现了同步的链式调用（test14.js）。
>
>```javascript
>var ref = function (value) {
>  if (value && typeof value.then === "function")
>    return value;
>  return {
>    then: function (callback) {
>      return ref(callback(value));
>    }
>  };
>};
>
>var resolve = 1;
>
>ref(resolve)
>.then((v)=>(v+2))
>.then((v)=>console.log(v))
>//3
>```
>
>对比之前我们已经实现的promise，上述例子只是将callback包装成一个已经resolved的promise并返回。
>
>注意，ref(resolve)返回的其实就是一个promise（含有then方法的对象），第一个resolve的参数是我们指定的，后续每一次then方法都返回一个promise，而这个返回的promise是用回调函数的返回值resolve的。



上面是立刻执行的情况，但实际情况可能复杂得多，因为回调函数可能是在“将来”被调用的。现在，我们重用之前的“defer”函数并且包装下回调，做成回调函数的返回值会resolve上面then方法返回的promise。



另外，“resolve”方法需要处理结果自己就是一个稍后才resolve的promise的情况。这是通过把结果值转换成一个promise来实现的。即，它实现了一个“then”方法，并且既可以是“defer”返回的promise，也可以是“ref”返回的promise。如果它是一个“ref” promise，那么它的行为与之前的完全一样：回调被“then(callback)”立刻调用。如果它是一个“defer” promise，回调通过调用“then(callback)”被传递到下一个promise。这样，你的回调现在就是在观察一个更详尽resolved值的新promise。回调可以被多次传递，形成朝最终结果前行的“过程”。

> 上面这段话可能有点绕，做下说明：
>
> ```javascript
> var promise1 = new Promise(function (resolve) {
>   setTimeout(function () {
>     resolve(1);
>   }, 3000)
> })
> 
> var promise2 = new Promise(function (resolve) {
>   setTimeout(function () {
>     resolve(promise1)
>   }, 1000)
> })
> 
> promise2
>   .then((v) => console.log(v));
> 
> //1
> ```
>
> 假如我们resolve的是普通的值（数值、字符串等），我们希望回调函数立刻被调用。之前def函数已经实现了resolve普通的值，将其转换成立刻执行并且能链式调用的promise。
>
> 但如果我们resolve的是另一个promise（假设是promise2里面resolve的promise1），我们其实希望的情况是，promise1 resolve的值能作为参数传到promise2的callback里。所以，如果promise2 resolve的值是promise1，那么我们期望发生的其实是promise2在resolve promise1的时候，promise1“接管”了promise2的回调。
>
> 上述例子更换1000ms和3000ms对最终结果其实没有影响，区别在于3000的时候接管了一个已经resolve的promise，在1000的时候接管了要3000ms才能resolve的promise。



（test15.js）:

```javascript
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
```



### 错误传递

为了实现错误传递，我们需要重新介绍下errback。我们用一个promise的新类型，类似于“ref”生成的promise来取代通知promise的回调函数转到fulfillment状态，它会通知errback被调用以及原因。

```javascript
var reject = function (reason) {
  return {
    then: function (callback, errback) {
      return ref(errback(reason));
    }
  };
};
```

查看这个行为最简单的方式是观察它马上reject的结果（test16.js）。

```javascript
reject("Meh.").then(function (value) {
  // we never get here
}, function (reason) {
  // reason === "Meh."
  console.log(reason);
});

//Meh.
```

现在我们可以用promise API来修正我们之前的errback案例。

```javascript
var maybeOneOneSecondLater = function (callback, errback) {
  var result = defer();
  setTimeout(function () {
    if (Math.random() < .5) {
      result.resolve(1);
    } else {
      result.resolve(reject("Can't provide one."));
    }
  }, 1000);
  return result.promise;
};
```

为了让这个例子能够运行，defer需要新的途径能让callback/errback都可以被调用。所以，我们用“then”调用参数数组（[callback, errback]）来取代之前的回调函数（callback）。

```javascript
var defer = function () {
  var pending = [],
    value;
  return {
    resolve: function (_value) {
      if (pending) {
        value = ref(_value);
        for (var i = 0, ii = pending.length; i < ii; i++) {
          // apply the pending arguments to "then"
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
```

> 相应例子详见（test17.js）

不过，这个版本的“defer”还有个小问题，它强制要求你调用所有的“then”必须提供一个errback，否则当你调用一个不存在的函数就会抛出一个错误。最简单的解决办法就是提供一个传递rejection的默认errback。同样，如果我们只想要观察rejection，callback被忽略也是合理的，所以我们提供一个默认的callback来传递fulfilled的值（test18.js）。

```javascript
var defer = function () {
  var pending = [],
    value;
  return {
    resolve: function (_value) {
      if (pending) {
        value = ref(_value);
        for (var i = 0, ii = pending.length; i < ii; i++) {
          value.then.apply(value, pending[i]);
        }
        pending = undefined;
      }
    },
    promise: {
      then: function (_callback, _errback) {
        var result = defer();
        // provide default callbacks and errbacks
        _callback = _callback || function (value) {
          // by default, forward fulfillment
          return value;
        };
        _errback = _errback || function (reason) {
          // by default, forward rejection
          return reject(reason);
        };
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
```

现在，我们可以简单地从其他promise里以并行或者串行的方式创建promise。下面这个例子创建了一个计算异步返回值最终和的promise（test19.js）。

```javascript
promises.reduce(function (accumulating, promise) {
    return accumulating.then(function (accumulated) {
      return promise.then(function (value) {
        return accumulated + value;
      });
    });
  }, ref(0)) // start with a promise for zero, so we can call then on it
  // just like any of the combined promises
  .then(function (sum) {
    // the sum is here
    console.log(sum);
  });
```



---



原文后续还有一点内容，但本文主要介绍promise的实现步骤，以上就是了。

有兴趣的读者可以自行阅读。

