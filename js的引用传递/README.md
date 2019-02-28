# JS的引用传递


说到js函数参数传递的时候，我们经常会说普通类型（int，string等）是复制传递，复杂类型（array，object等）是引用传递。



看下js里面的引用传递：

```js
var obj1 = {
  name: 'Alice'
}

function test(obj) {
  obj.name = 'Helen';
  console.log(obj1);
  obj = {
    name: 'Gray'
  }
  return obj;
}

obj2 = test(obj1);

console.log(obj1);
console.log(obj2);
//?
//?
```



不运行上述代码，想下结果是什么。

如果运行的结果跟预想的不一样，接着往下看。



```js
/*
  obj1是一个对象，有一个地址addr1指向这个对象
  我们进行obj1.name = 'xxxx'时，其实是通过这个addr1在操作这个对象
*/
var obj1 = {
  name: 'Alice'
}

function test(obj) {
  /*
    其实这里的obj相当于“复制”了obj1的地址，
    由于obj跟obj1都指向addr1，
    所以能把Alice修改成Helen
  */
  obj.name = 'Helen';
  console.log(obj1);

  /*
    obj现在指向addr2，跟obj1没有关系了
    addr2找到的对象，name属性的值是Gray
  */
  obj = {
    name: 'Gray'
  }
  return obj;
}

//obj2也是指向addr2
obj2 = test(obj1);

console.log(obj1);
console.log(obj2);

//{ name: 'Helen' }
//{ name: 'Helen' }
//{ name: 'Gray' }
```



所谓的引用传递，其实是“复杂类型内存地址的复制传递”。