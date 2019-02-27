var promise = require('./promise2.js');

var d = new promise();
var d2 = new promise();

var p = d.promise;
var r = d.resolve;
p.then((val)=>console.log(val));
p.then((val)=>console.log(++val));

var p2 = d2.promise;
var r2 = d2.resolve;
p2.then((val)=>console.log(val));
p2.then((val)=>console.log(++val));

setTimeout(function(){
  r(1);
  r2(10);
}, 1000);