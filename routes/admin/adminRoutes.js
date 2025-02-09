const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../../middleware/ensureAuthentication");
const API_PRODUCT_URL = process.env.API_PRODUCT_URL;
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");

const API_AUTH_URL = process.env.API_AUTH_URL;
const API_ORDER_URL = process.env.API_ORDER_URL;



// Admin Dashboard Route
router.get("/dashboard", ensureAuthenticated, async (req, res) => {
  try {
    // Ensure the user has admin privileges
    const { user } = req.session;
    if (user.role !== "ADMIN") {
      return res.status(403).send("Access Denied: Admins only.");
    }

    // Render the dashboard view
    res.render("pages/admin/dashboard", {
      user, 
    });
  } catch (error) {
    console.error("Error rendering admin dashboard:", error.message);
    res.status(500).send("Internal Server Error");
  }
});


// Display products for the logged-in seller (using user ID)
router.get("/products", ensureAuthenticated, async (req, res) => {
  try {
    const { user, accessToken } = req.session;

    // Fetch the products for the seller
    const adminProductUrl = `${API_PRODUCT_URL}/`;
    const productResponse = await axios.get(adminProductUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const products = productResponse.data;

    const success = req.query.success || null; 
    const error = req.query.error || null; 

    res.render("pages/admin/products", { products, success, error });
  } catch (error) {
    console.error("Error fetching products for admin:", error.message);
    res.render("pages/admin/products", { products: [], success: null, error: error.message });
  }
});


// Route: All Shop Owners
router.get("/shop-owners", ensureAuthenticated, async (req, res) => {
  try {
    const { accessToken } = req.session; // Use session token like in '/products'
    
    const shopOwnersUrl = `${API_AUTH_URL}/profile/shop-owners`;
    const shopOwnersResponse = await axios.get(shopOwnersUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const shopOwners = shopOwnersResponse.data;

    const success = req.query.success || null;
    const error = req.query.error || null;
    
    res.render("pages/admin/shopOwners", { shopOwners, success, error });
  } catch (error) {
    console.error("Error fetching shop owners:", error.message);
	if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status); 
      console.error("Error response headers:", error.response.headers); 
    }
    res.render("error", { error: error.message || "Failed to fetch shop owners." });
  }
});


// Route: All Users
router.get("/users", ensureAuthenticated, async (req, res) => {
  try {
    const { accessToken } = req.session; // Use session token like in '/products'

    const usersUrl = `${API_AUTH_URL}/profile`;
    const usersResponse = await axios.get(usersUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const users = usersResponse.data;

    const success = req.query.success || null;
    const error = req.query.error || null;
    
    res.render("pages/admin/users", { users, success, error });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.render("error", { error: error.message || "Failed to fetch shop owners." });
  }
});


// Route: Profile Details
router.get("/profile/:id", ensureAuthenticated, async (req, res) => {
  try {
    const { accessToken } = req.session; 

    const profileUrl = `${API_AUTH_URL}/profile/${req.params.id}`;
    const profileResponse = await axios.get(profileUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = profileResponse.data;

    res.render("pages/admin/profileDetails", { profile });
  } catch (error) {
    console.error("Error fetching profile:", error.message);
    res.render("error", { error: error.response?.data?.error || "Failed to fetch profile." });
  }
});

// Display products for the seller (using user ID)
router.get("/products/:id", ensureAuthenticated, async (req, res) => {
  try {
    const { user, accessToken } = req.session;

    // Fetch the products for the seller
    const sellerProductUrl = `${API_PRODUCT_URL}/seller/${req.params.id}`;
    const productResponse = await axios.get(sellerProductUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const products = productResponse.data;

    const success = req.query.success || null; 
    const error = req.query.error || null; 

    res.render("pages/admin/products", { products, success, error });
  } catch (error) {
    console.error("Error fetching seller's products:", error.message);
    res.render("pages/admin/products", { products: [], success: null, error: error.message });
  }
});


// Orders By User
router.get("/orders/:id", ensureAuthenticated, async (req, res) => {
  try {
    const { accessToken } = req.session;

    console.log("Fetching orders with access token:", accessToken);

    // Fetch orders
    const response = await axios.get(`${API_ORDER_URL}/orders/user/${req.params.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const orders = response.data;

    // Fetch product titles for each order
    for (const order of orders) {
      const productNames = [];

      // Fetch details for each product in the order
      for (const product of order.products) {
        try {
          const productResponse = await axios.get(`${API_ORDER_URL}/products/${product.productId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          productNames.push(productResponse.data.title);
        } catch (productError) {
          console.error(`Failed to fetch product ${product.productId}:`, productError.message);
          // Log additional details for debugging
          console.error("Product fetch error details:", {
            status: productError.response?.status,
            data: productError.response?.data,
            config: productError.config,
          });
          productNames.push("Unknown Product"); // Handle missing product gracefully
        }
      }

      // Add product names to the order
      order.productNames = productNames;
    }

    res.render("pages/admin/orders", { orders });
  } catch (error) {
    console.error("Failed to fetch orders:", error.message);
    
    // Log additional details for debugging
    console.error("Order fetch error details:", {
      status: error.response?.status,
      data: error.response?.data,
      config: error.config,
    });

    // Send a detailed error response instead of just a status code
	res.render("error", { error: error.message || "Failed to fetch orders"  });
  }
});


//All orders
router.get("/orders/", ensureAuthenticated, async (req, res) => {
  try {
    const { accessToken } = req.session;
    console.log("Fetching orders with access token:", accessToken);

    // Fetch orders from the orders API
    const ordersResponse = await axios.get(`${API_ORDER_URL}/orders/all`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const orders = ordersResponse.data;

    // Fetch all products in bulk
    const productsResponse = await axios.get(`${API_ORDER_URL}/products/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const allProducts = productsResponse.data;

    // Create a map of productId to product details for quick lookup
    const productMap = allProducts.reduce((map, product) => {
      map[product.id] = product;
      return map;
    }, {});

    // Attach product details to each order
    for (const order of orders) {
      order.productNames = order.products.map(product => {
        const productDetails = productMap[product.productId] || { title: "Unknown Product" };
        return {
          title: productDetails.title,
          status: product.status,
        };
      });
    }

    // Render the orders page and pass the orders to the view.
    res.render("pages/admin/orders", { orders });
  } catch (error) {
    console.error("Failed to fetch orders:", error.message);
    console.error("Order fetch error details:", {
      status: error.response?.status,
      data: error.response?.data,
      config: error.config,
    });
    res.render("error", { error: error.message || "Failed to fetch orders" });
  }
});



// Order Details Page
router.get("/order/:id", ensureAuthenticated, async (req, res) => {
  try {
    const { accessToken } = req.session;
    const orderId = req.params.id; // Capture the order ID from the URL
    console.log(`Fetching details for order ID: ${orderId} with access token:`, accessToken);

    // Fetch the order details from the API
    const orderResponse = await axios.get(`${API_ORDER_URL}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const order = orderResponse.data;

    // Fetch details for each product in the order
    // Each product in order.products should have productId, quantity, and status
    const productPromises = order.products.map(async (product) => {
      const productResponse = await axios.get(`${API_ORDER_URL}/products/${product.productId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return {
        ...productResponse.data,         // Product details from the API
        quantity: product.quantity,        // Ordered quantity from the order object
        status: product.status             // Product status from the order object
      };
    });
    const productsWithDetails = await Promise.all(productPromises);
    order.products = productsWithDetails;

    // Render the order details page with the complete order info
    res.render("pages/admin/orderDetails", { 
      order,
      success: null, 
      error: null 
    });
  } catch (error) {
    console.error("Error fetching order details:", error.message);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status); 
      console.error("Error response headers:", error.response.headers); 
    }
    res.status(500).send("Order not found");
  }
});


// Update order status (Admin only)
router.post("/order/:id/status", ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params; 
    const { status } = req.body; 
    const { accessToken } = req.session; 


    // Update the order status via the API
    await axios.patch(`${API_ORDER_URL}/orders/${id}`, { status }, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Fetch the updated order details from the API
    const orderResponse = await axios.get(`${API_ORDER_URL}/orders/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const order = orderResponse.data;

    // Fetch details for each product in the updated order
    const productPromises = order.products.map(async (product) => {
      try {
        const productResponse = await axios.get(`${API_ORDER_URL}/products/${product.productId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        return {
          ...productResponse.data, // Product details
          quantity: product.quantity, // Ordered quantity
        };
      } catch (err) {
        console.error(`Failed to fetch product details for productId: ${product.productId}`, err.message);
        return { title: "Unknown Product", price: 0, quantity: product.quantity, description: "Details unavailable" };
      }
    });

    // Wait for all product details to be fetched
    const productsWithDetails = await Promise.all(productPromises);

    // Update the order object with the full product details
    order.products = productsWithDetails;

    // Render the order details page with the updated data
    res.render("pages/admin/orderDetails", {
      order,
      success: "Order status updated successfully.",
      error: null,
    });
  } catch (error) {
    console.error("Error updating order status:", error.message);

    // Log additional details for debugging
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
    }

    // Render the page with an error message
    res.render("pages/admin/orderDetails", {
      order: {}, // Optionally fetch and populate the order object here if necessary
      success: null,
      error: error.response?.data?.message || "Failed to update order status.",
    });
  }
});





// Route: View Orders and Products (Dashboard)
router.get("/dashboardOP", ensureAuthenticated, async (req, res) => {
  try {
    const { user, accessToken } = req.session; // Get user and access token from session

    if (user.role === "SHOP_OWNER") {
      // Fetch products and orders for shop owner
      const productsUrl = `${API_PRODUCT_URL}/`; // Replace with actual URL for products
      const productsResponse = await axios.get(productsUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const products = productsResponse.data;

      const ordersUrl = `${API_ORDER_URL}/orders`; // Replace with actual URL for orders
      const ordersResponse = await axios.get(ordersUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const orders = ordersResponse.data;

      return res.render("pages/admin/shopDashboard", { products, orders });
    } else if (user.role === "USER") {
      // Fetch orders for user
      const ordersUrl = `${API_ORDER_URL}/orders`; // Replace with actual URL for orders
      const ordersResponse = await axios.get(ordersUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const orders = ordersResponse.data;

      return res.render("pages/user/userDashboard", { orders });
    } else {
      return res.status(403).render("error", { error: "Access denied." });
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error.message);
    res.render("error", { error: error.message || "Failed to fetch shop owners." });
  }
});


module.exports = router;
