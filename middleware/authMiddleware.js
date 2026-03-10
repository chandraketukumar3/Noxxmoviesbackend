const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    // Supabase JWTs are signed with the project's JWT secret.
    // We should ideally have SUPABASE_JWT_SECRET in .env
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET);

    // With Supabase, we might not have a local User model in MongoDB anymore, 
    // or we link it via the 'sub' (subject) field which is the Supabase UID.
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error(error);
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'service_role') { // Supabase specific
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as an admin');
  }
};

module.exports = { protect, admin };
