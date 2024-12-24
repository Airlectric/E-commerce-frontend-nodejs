const express = require('express');
const axios = require('axios');
const router = express.Router();

const API_AUTH_URL = process.env.API_AUTH_URL;

// Register Handler
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    await axios.post(`${API_AUTH_URL}/register`, { username, email, password, role });
    res.redirect('/login');
  } catch (error) {
    res.render('pages/register', { error: error.response?.data?.message || 'Registration failed.' });
  }
});

// Login Handler
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Received login request:", { username, password });

    // Send a login request to the authentication service
    const response = await axios.post(`${API_AUTH_URL}/login`, { username, password });

    console.log("Authentication service response:", response.data);

    // Extract tokens and user details from the response
    const { accessToken, refreshToken, user } = response.data;

    // Store tokens and user details in the session
    req.session.accessToken = accessToken;
    req.session.refreshToken = refreshToken;
    req.session.user = user;

    console.log("Tokens and user details stored successfully in session.");

    // Redirect to the profile page
    res.redirect("/profile");
  } catch (error) {
    console.error("Login Error:", error.response?.data || error.message);
    const errorMessage = error.response?.data?.error || "Login failed. Please try again.";
    res.render("pages/login", { error: errorMessage });
  }
});




// Edit Profile
router.post('/edit', async (req, res) => {
  try {
    if (!req.session.user) return res.redirect('/login');
    
    const { profileImage, shopName, shopDescription, shopAddress } = req.body;
    const accessToken = req.session.user.accessToken;
    
    const response = await axios.put(
      `${API_AUTH_URL}/profile/edit`,
      { profileImage, shopName, shopDescription, shopAddress },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    
    req.session.user = { ...req.session.user, ...response.data.user };
    res.redirect('/profile');
  } catch (error) {
    console.error("Profile Edit Error:", error.response?.data || error.message);
    res.status(500).send('Error editing profile');
  }
});

// Logout Handler
router.post("/logout", async (req, res) => {
  try {
    // Retrieve the user's ID and refresh token from session
    const refreshToken = req.session.refreshToken;
    const user = req.session.user;

    if (!user || !refreshToken) {
      console.warn("Logout attempt by unauthenticated user.");
      return res.status(401).json({ error: "User not logged in." });
    }

    console.log("Logging out user:", user.id);

    // Step 1: Send request to revoke the refresh token
    const { data } = await axios.post(`${process.env.API_AUTH_URL}/logout`, { userId: user.id });

    if (data.error) {
      console.error("Failed to revoke refresh token:", data.error);
      return res.status(500).json({ error: "Failed to revoke token." });
    }

    console.log("Refresh token revoked successfully.");

    // Step 2: Destroy the session and clear tokens and user data
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ error: "Failed to log out. Please try again." });
      }

      console.log("Session destroyed successfully.");
      res.clearCookie("connect.sid"); // Clear session cookie

      // Redirect to login or home page after logout
      res.redirect("/login");
    });
  } catch (error) {
    console.error("Logout Error:", error.message || error);
    res.status(500).json({ error: "Internal server error" });
  }
});



module.exports = router;
