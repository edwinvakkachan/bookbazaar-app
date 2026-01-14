module.exports = (req, res, next) => {
  res.locals.user = req.user || req.session.user || null;
  res.locals.cartCount = req.session.cartCount || 0;
  res.locals.active = '';
  next();
};
