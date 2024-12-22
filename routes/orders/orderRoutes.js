const express = require("express");
const axios = require("axios");

const router = express.Router();
const API_ORDER_URL = process.env.API_ORDER_URL;

// Middleware to ensure user authentication using cookies
const ensureAuthenticated = (req, res, next) => {
  if (req.cookies.access_token) {
    next();
  } else {
    res.redirect("/login");
  }
};

// Home Page - List all products
router.get("/", async (req, res) => {
  try {
    const response = await axios.get(`${API_ORDER_URL}/products/`, {
      withCredentials: true, // Include cookies in the request
    });
    res.render("pages/orders/index", { products: response.data });
  } catch (error) {
    res.render("pages/orders/index", { products: [], error: error.message });
  }
});

// Product Details Page
router.get("/product/:id", async (req, res) => {
  try {
    const response = await axios.get(`${API_ORDER_URL}/product/${req.params.id}`, {
      withCredentials: true,
    });
    res.render("pages/orders/productDetails", { product: response.data });
  } catch (error) {
    res.status(500).send("Product not found");
  }
});

// Cart Page
router.get("/cart", (req, res) => {
  const cart = req.cookies.cart ? JSON.parse(req.cookies.cart) : [];
  res.render("pages/orders/cart", { cart });
});

// Add to Cart
router.post("/cart", (req, res) => {
  const { productId, title, quantity, price } = req.body;
  const cart = req.cookies.cart ? JSON.parse(req.cookies.cart) : [];
  cart.push({ productId, title, quantity, price });
  res.cookie("cart", JSON.stringify(cart), { httpOnly: true });
  res.redirect("/");
});

// Remove from Cart
router.post("/cart/remove", (req, res) => {
  const { productId } = req.body;
  const cart = req.cookies.cart ? JSON.parse(req.cookies.cart) : [];
  const updatedCart = cart.filter((item) => item.productId !== productId);
  res.cookie("cart", JSON.stringify(updatedCart), { httpOnly: true });
  res.redirect("/cart");
});

// Checkout
router.post("/checkout", async (req, res) => {
  try {
    const cart = req.cookies.cart ? JSON.parse(req.cookies.cart) : [];
    const response = await axios.post(
      `${API_ORDER_URL}/orders`,
      { products: cart },
      { withCredentials: true }
    );
    res.clearCookie("cart"); // Clear cart after successful order
    res.redirect("/orders");
  } catch (error) {
    res.status(500).send("Checkout failed");
  }
});

// Orders Page
router.get("/orders", async (req, res) => {
  try {
    const response = await axios.get(`${API_ORDER_URL}/orders`, {
      withCredentials: true,
    });
    res.render("pages/orders/orders", { orders: response.data });
  } catch (error) {
    res.status(500).send("Failed to fetch orders");
  }
});

module.exports = router;
