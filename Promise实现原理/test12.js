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