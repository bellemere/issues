var ref = function (value) {
  if (value && typeof value.then === "function")
    return value;
  return {
    then: function (callback) {
      return ref(callback(value));
    }
  };
};

var reject = function (reason) {
  return {
    then: function (callback, errback) {
      return ref(errback(reason));
    }
  };
};

reject("Meh.").then(function (value) {
  // we never get here
}, function (reason) {
  // reason === "Meh."
  console.log(reason);
});

