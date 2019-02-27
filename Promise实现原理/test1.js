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