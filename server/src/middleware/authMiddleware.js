const jwt = require('jsonwebtoken');

function extractTokenFromHeader(authorizationHeader = '') {
  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

function authenticateToken(request, response, next) {
  const token = extractTokenFromHeader(request.headers.authorization);

  if (!token) {
    return response.status(401).json({
      message: 'Token JWT nao informado.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development-secret');
    request.user = decoded;
    return next();
  } catch (error) {
    return response.status(401).json({
      message: 'Token JWT invalido ou expirado.',
    });
  }
}

module.exports = {
  authenticateToken,
};
