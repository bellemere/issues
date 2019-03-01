### 自己实现一个call



call/apply是用来修改函数调用时this的指向。



```js
function a(n){
  console.log(this.m, n);
}

var k = {
  m: 2
}

a(1);
//undefined 1

//想想为什么
var m = 2;
a(1);
//2 1

//通过call将this指向k
a.call(k, 1);
//2 1

//如何自己实现一个call
Function.prototype.call2 = function() {
  //obj即相当于上面的k
  var obj = arguments[0];
  
  //this相当于上面的a
  obj[Symbol.for('fn')] = this;

  //获取call第二个开始的参数
  var args = [];
  for (var i = 1; i < arguments.length; i++) {
    args.push(arguments[i]);
  };
  
  //相当于k.a, 即将a的this指向k
  obj[Symbol.for('fn')](...args);

  delete obj[Symbol.for('fn')];
}

a.call2(k, 1);
//2 1
```

