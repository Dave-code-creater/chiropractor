function lowercaseMiddleware(exceptions = []) {
  const shouldPreserve = (key) => exceptions.includes(key);

  const transform = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        if (!shouldPreserve(key)) {
          obj[key] = value.toLowerCase();
        }
      } else if (Array.isArray(value)) {
        obj[key] = value.map((item) => {
          if (typeof item === 'string') {
            return shouldPreserve(key) ? item : item.toLowerCase();
          }
          if (typeof item === 'object' && item !== null) {
            transform(item);
          }
          return item;
        });
      } else if (typeof value === 'object' && value !== null) {
        transform(value);
      }
    }
    return obj;
  };

  return (req, _res, next) => {
    if (req.body) {
      transform(req.body);
    }
    next();
  };
}

module.exports = lowercaseMiddleware;
