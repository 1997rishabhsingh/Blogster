const { clearHash } = require("../services/cache");

module.exports = async (req, res, next) => {
  // Let the request handler run and complete first
  await next();

  // then clear the hash if there wasn't any error in request handler
  clearHash(req.user.id);
};
