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

//在Promise对象构建后再注册回调函数
setTimeout(function(){
  p.then(()=>console.log(4))
}, 3000);