var ref = function (value) {
  if (value && typeof value.then === "function")
    return value;
  return {
    then: function (callback) {
      return ref(callback(value));
    }
  };
};

var resolve = 1;

ref(resolve)
.then((v)=>(v+2))
.then((v)=>console.log(v))