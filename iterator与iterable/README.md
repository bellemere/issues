### iterator/iterable和generator



##### iterator

一个包含next方法的对象，返回一个包含value和done的对象。

```js
function makeIterator(array) {
  var nextIndex = 0;
  return {
    next: function () {
      return nextIndex < array.length ? {
        value: array[nextIndex++],
        done: false
      } : {
        done: true
      };
    }
  };
}

var it = makeIterator(['yo', 'ya']);
console.log(it.next().value); // 'yo'
console.log(it.next().value); // 'ya'
console.log(it.next().done);  // true
```



##### iterable

一个实现了Symbol.iterator属性的对象，称为可迭代对象。

```js
var myIterable = {};
myIterable[Symbol.iterator] = function* () {
  yield 1;
  yield 2;
  yield 3;
};

for (let value of myIterable) {
  console.log(value);
}
// 1
// 2
// 3

//or

console.log([...myIterable]); // [1, 2, 3]
```



##### generator

一个可以维护自己状态的迭代器工厂函数。

```js
function* idMaker() {
  var index = 0;
  while(true)
    yield index++;
}

var gen = idMaker();

console.log(gen.next().value); // 0
console.log(gen.next().value); // 1
console.log(gen.next().value); // 2
```



看下面这个例子：

```js
let arr = [1, 2, 3];

/*
  generator函数用来简化以前自己写next方法
  它可以自己维护自己的状态
*/
function* gen(arr) {
  for (let x of arr) {
    yield x;
  }
}

function makeIterator(arr) {
  let nextIndex = 0;
  return {
    [Symbol.iterator]: function() {
      return this;
    },
    next: function() {
      return nextIndex < array.length ?
        {value: array[nextIndex++], done: false} :
        {value: undefined, done: true};
    }
  }
}

/*
  一个对象包含Symbol.iterator，表示它iterable
  iterable用来区分普通对象及包含ymbol.iterator的对象
*/
let iterable = gen(arr);
console.log(iterable[Symbol.iterator]);
/*
  迭代器用来遍历所有属性
*/
let iterator = iterable[Symbol.iterator]();
console.log(iterator === iterable);

let iterable2 = makeIterator(arr);
console.log(iterable2[Symbol.iterator]);
let iterator2 = iterable2[Symbol.iterator]();
console.log(iterator2 === iterable2);

/*
[Function: [Symbol.iterator]]
true
[Function: [Symbol.iterator]]
true
*/
```

也就是说:

gen生成的generator对象，既是一个iterable的对象，又是一个iterator。