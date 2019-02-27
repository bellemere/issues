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
//...