const express = require('express');
const router = express.Router();
const axios = require('axios');

const API_AUTH_URL = process.env.API_AUTH_URL;

// Landing Page
router.get('/', (req, res) => {
  res.render('pages/landing', { user: req.session.user, title: "Welcome to E-Commerce" });
});

// Register Page
router.get('/register', (req, res) => {
  res.render('pages/register', { error: null, title: "Register - E-Commerce" });
});

// Login Page
router.get('/login', (req, res) => {
  res.render('pages/login', { 
    error: null, 
	API_AUTH_URL: process.env.API_AUTH_URL,
    title: "Login - E-Commerce" 
  });
});

// Profile Page
router.get('/profile', (req, res) => {
  console.log('session pro:',req.session.user);
  if (!req.session.user) return res.redirect('/login');
  res.render('pages/profile', {
    user: req.session.user,
	error: null,
    title: "Profile - E-Commerce"
  });
});



// Edit Profile Page
router.get('/edit', (req, res) => {
  res.render('pages/editProfile', { error: null, title: "Edit Profile - E-Commerce" });
});

// Logout Page
router.get("/logout", (req, res) => {
  console.log('session pro:',req.session.user);
  if (!req.session.user) {
    // If the user is not logged in, redirect them to the login page or home
    return res.redirect('/login');
  }

  res.render("pages/logout", {
    title: "Logout - E-Commerce",
    user: req.session.user,
    message: "Are you sure you want to log out?",
    API_AUTH_URL: process.env.API_AUTH_URL,
  });
});


module.exports = router;
