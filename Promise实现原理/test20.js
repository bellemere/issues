var {defer, ref, reject} = require('./promise3.js');

var d = defer();
var p = d.promise;

setTimeout(function () {
  d.resolve(1);
}, 1);

function foob() {
  return ref(0);
}

/*
var blah = function () {
  var result = foob().then(function () {
      return barf();
  });
  var barf = function () {
      return 10;
  };
  return result;
};
blah();
*/

/*
var blah2 = function () {
  var result = p.then(function () {
      return barf();
  });
  var barf = function () {
      return 10;
  };
  return result;
};
blah2();
*/