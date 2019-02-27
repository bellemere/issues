var {defer, ref, reject} = require('./promise3.js');

var d1 = defer();
var d2 = defer();
var d3 = defer();

var p1 = d1.promise;
var p2 = d2.promise;
var p3 = d3.promise;

promises = [p1, p2, p3];

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

setTimeout(function () {
  d1.resolve(1);
  d2.resolve(2);
  d3.resolve(3);
}, 1000);