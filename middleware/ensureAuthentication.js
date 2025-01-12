// Middleware to ensure user authentication using session
const ensureAuthenticated = (req, res, next) => {
  const { user, accessToken } = req.session;
  if (user && accessToken) {
    console.log("User is authenticated:", user);
    next();
  } else {
    console.log("User not authenticated, redirecting to login.");
    res.redirect("/login");
  }
};


module.exports = { ensureAuthenticated };

