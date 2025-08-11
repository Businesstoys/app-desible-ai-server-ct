const catchAsync = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
}

module.exports = (_obj) => {
  for (const key in _obj) {
    if (typeof _obj[key] === 'function') {
      _obj[key] = catchAsync(_obj[key])
    }
  };
  return _obj
}
