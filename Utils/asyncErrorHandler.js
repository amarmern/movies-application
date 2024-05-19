module.exports = (func) => {
  //return a new function
  return (req, res, next) => {
    //logic
    func(req, res, next).catch((err) => next(err));
  };
};
