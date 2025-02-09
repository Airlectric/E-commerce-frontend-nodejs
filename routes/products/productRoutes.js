const { ensureAuthenticated } = require("../../middleware/ensureAuthentication");
const express = require("express");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");

const router = express.Router();
const API_PRODUCT_URL = process.env.API_PRODUCT_URL;
const API_CATEGORY_URL = process.env.API_CATEGORY_URL;
const API_ORDER_URL = process.env.API_ORDER_URL;
const API_AUTH_URL = process.env.API_AUTH_URL;

const storage = multer.memoryStorage();
const upload = multer({ storage });


// Display products for the logged-in seller (using user ID)
router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const { user, accessToken } = req.session;

    // Fetch the products for the seller
    const sellerProductUrl = `${API_PRODUCT_URL}/seller/${user.id}`;
    const productResponse = await axios.get(sellerProductUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const products = productResponse.data;

    const success = req.query.success || null; // Ensure success is always defined
    const error = req.query.error || null; // Ensure error is always defined

    res.render("pages/products/index", { products, success, error });
  } catch (error) {
    console.error("Error fetching seller's products:", error.message);
    res.render("pages/products/index", { products: [], success: null, error: error.message });
  }
});


// Product Details Page
router.get("/product/:id", ensureAuthenticated, async (req, res) => {  // Ensure authentication here
  try {
    const { accessToken } = req.session;
    console.log(`Fetching details for product ID: ${req.params.id} with access token:`, accessToken);

    const response = await axios.get(`${API_PRODUCT_URL}/${req.params.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    res.render("pages/products/productDetails", { product: response.data });
  } catch (error) {
    console.error("Error fetching product details:", error.message);
	if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status); 
      console.error("Error response headers:", error.response.headers); 
    }
    res.status(500).send("Product not found");
  }
});



// Add a product page
router.get("/add", ensureAuthenticated, async (req, res) => {
  try {
    const { accessToken } = req.session;

    // Fetch categories
    const response = await axios.get(`${API_CATEGORY_URL}/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    res.render("pages/products/add", { categories: response.data.data });
  } catch (error) {
    console.error("Error fetching categories for product:", error.message);
    res.render("pages/products/add", { categories: [], error: error.message });
  }
});


// Add a new product
router.post("/add", upload.single("imageFile"), async (req, res) => {
  try {
    const { title, description, category_id, price, quantity, image } = req.body;
    const { accessToken } = req.session;

    // Create FormData instance to send to microservice
    const formData = new FormData();

    // Append regular product fields
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category_id", category_id);
    formData.append("price", price);
    formData.append("quantity", quantity);

    // Handling the image logic based on file or URL input
    if (req.file) {
      // If a file was uploaded, append it to FormData
      formData.append("imageFile", req.file.buffer, req.file.originalname);
      console.log('Image file uploaded:', req.file.originalname); // Debugging statement
    } else if (image) {
      // If a URL is provided, just append the URL string as is
      formData.append("imageUrl", image);
      console.log('Image URL provided:', image); // Debugging statement
    }

    console.log('Form data being sent:', formData); // Debugging statement

    // Send FormData to backend microservice
    const response = await axios.post(`${API_PRODUCT_URL}/`, formData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...formData.getHeaders(),  // Set proper headers for multipart/form-data
      },
    });

    console.log('Response from server:', response.data); // Debugging statement

    // After successful upload, redirect to products page
    res.redirect("/products");
  } catch (error) {
    console.error("Error adding product:", error.message);
   
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status); 
      console.error("Error response headers:", error.response.headers); 
    }

    res.render("pages/products/add", { error: error.message, categories: [] });
  }
});



// Edit product page
router.get("/:id/edit", ensureAuthenticated, async (req, res) => {
  try {
    const { accessToken } = req.session;
    const { id } = req.params;

    // Fetch product details
    const productResponse = await axios.get(`${API_PRODUCT_URL}/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Fetch categories
    const categoriesResponse = await axios.get(`${API_CATEGORY_URL}/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    res.render("pages/products/edit", {
      product: productResponse.data,
      categories: categoriesResponse.data.data,
    });
  } catch (error) {
    console.error("Error fetching product or categories:", error.message);
    res.redirect("/products");
  }
});

// Update product
router.post("/:id/edit", ensureAuthenticated, upload.single("imageFile"), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category_id, price, quantity, image } = req.body;
    const { accessToken } = req.session;

    // Create a FormData instance to send to the microservice
    const formData = new FormData();

    // Append regular product fields
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category_id", category_id);
    formData.append("price", price);
    formData.append("quantity", quantity);

    // Handling the image logic
    if (req.file) {
      // If a new image file is uploaded, append it to FormData
      formData.append("imageFile", req.file.buffer, req.file.originalname);
    } else if (image) {
      // If an image URL is provided, append it as imageUrl
      formData.append("imageUrl", image);
    }

    console.log('formData in editProduct:', formData);

    // Send FormData to backend microservice to update the product
    await axios.put(`${API_PRODUCT_URL}/${id}`, formData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...formData.getHeaders(),  // Set proper headers for multipart/form-data
      },
    });

    // After successful update, redirect to the products page
    res.redirect("/products");
  } catch (error) {
    console.error("Error updating product:", error.message);
    res.redirect("/products");
  }
});



// Delete product
router.post("/:id/delete", ensureAuthenticated, async (req, res) => {
  try {
    const { accessToken } = req.session;
    const { id } = req.params;

    console.log(`Attempting to delete product with ID: ${id}`); // Debugging statement

    // Fetch all orders
    const response = await axios.get(`${API_ORDER_URL}/orders/all`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const orders = response.data;
    console.log(`Fetched orders:`, orders); // Debugging statement

    // Check if the product is associated with any order
    const associatedOrders = orders.filter(order =>
      order.products.some(product => product.productId === id)
    );

    console.log(`Associated orders for product ID ${id}:`, associatedOrders); // Debugging statement

    // Check the status of associated orders
    const hasPendingOrder = associatedOrders.some(order => order.status === "Pending");

    if (hasPendingOrder) {
      console.warn(`Cannot delete product ID ${id} as it is associated with a 'Pending' order.`); // Warning log
      return res.redirect(`/products?error=Cannot delete the product as it is associated with a 'Pending' order.`);
    }

    // If no associated orders with "Pending" status, proceed to delete the product
    await axios.delete(`${API_PRODUCT_URL}/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log(`Product ID ${id} deleted successfully.`); // Debugging statement
    res.redirect(`/products?success=Product deleted successfully.`);
  } catch (error) {
    console.error("Error deleting product:", error.message);
    
    // Log detailed error response if available
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
    }

    res.redirect(`/products?error=Failed to delete the product.`);
  }
});


/**
 * GET /products/shop-orders
 * Fetches shop orders from the backend, stores them in session,
 * and then renders the shop orders page.
 */
router.get('/shop-orders', ensureAuthenticated, async (req, res) => {
  try {
    const { user, accessToken } = req.session;
    const ordersBaseUrl = process.env.API_ORDER_URL; 
    const url = `${ordersBaseUrl}/orders/seller/${user.id}`;

    console.log('Access Token:', accessToken);
    console.log('User ID:', user.id);
    console.log('Making GET request to:', url);

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      let orders = response.data;
      
      // Retrieve filter values from query parameters (or use defaults)
      const selectedTimeFilter = req.query.sortFilter || "Recent First";
      const selectedStatusFilter = req.query.statusFilter || "All";
      const selectedPaymentFilter = req.query.paymentFilter || "All";

      // Helper function to determine overall order status
      function getOrderStatus(order) {
        const products = order.products || [];
        const deliveredCount = products.filter(p => (p.status || "").toLowerCase() === "delivered").length;
        if (products.length > 0 && deliveredCount === products.length) {
          return "Completed";
        } else if (deliveredCount === 0) {
          return "Not Completed";
        } else {
          return "Partially Completed";
        }
      }

      // Filter orders based on status and payment filters
      orders = orders.filter(order => {
        const overallStatus = getOrderStatus(order);
        const paymentStatus = order.paymentStatus || "Unknown";
        
        if (selectedStatusFilter !== "All" && overallStatus !== selectedStatusFilter) {
          return false;
        }
        if (selectedPaymentFilter !== "All" && paymentStatus !== selectedPaymentFilter) {
          return false;
        }
        return true;
      });

      // Sort orders by creation date based on the time filter
      orders.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return selectedTimeFilter === "Recent First" ? dateB - dateA : dateA - dateB;
      });

      // Store the filtered orders in the session for later use (e.g., in the order details page)
      req.session.orders = orders;

      // Render the shop orders page with the filtered and sorted orders, plus the filter selections.
      res.render("pages/products/shopOrders", {
        orders,
        selectedTimeFilter,
        selectedStatusFilter,
        selectedPaymentFilter
      });
    } else {
      res.status(response.status).json({
        message: `Failed to load shop orders, status code: ${response.status}`
      });
    }
  } catch (error) {
    console.error("Error fetching shop orders:", error.message || error);
    res.status(500).json({ message: "Error fetching shop orders", error: error.message });
  }
});




/**
 * GET /shop-order-details/:orderId
 * Retrieves an order’s details from session storage (instead of calling the backend)
 * and renders the order details page.
 */
router.get('/shop-order-details/:orderId', ensureAuthenticated, async (req, res) => {
  try {
    const orders = req.session.orders;
    const orderId = req.params.orderId;
	const accessToken = req.session.accessToken;

    if (!orders) {
      return res.status(404).send("Orders not found in session. Please reload the shop orders page.");
    }

    // Find the order (using either _id or orderId property)
    const order = orders.find(o => o._id == orderId || o.orderId == orderId);
    if (!order) {
      return res.status(404).send("Order not found");
    }

  const { data }  = await axios.get(`${API_AUTH_URL}/profile/${order.user.id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
	
	userDetails = data;

    res.render("pages/products/shopOrderDetails", { order, userDetails });
  } catch (error) {
    console.error("Error rendering order details:", error.message || error);
    res.status(500).send("Error rendering order details");
  }
});

/**
 * PATCH /orders/:orderId/product/:productId/status
 * Updates the status of a product within an order.
 */
router.patch('/orders/:orderId/product/:productId/status', ensureAuthenticated, async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { status: newStatus } = req.body;
    const { accessToken } = req.session;
    const ordersBaseUrl = process.env.API_ORDER_URL;
    const url = `${ordersBaseUrl}/orders/${orderId}/product/${productId}/status`;

    console.log("Updating product status:", { orderId, productId, newStatus });
    const response = await axios.patch(url, { status: newStatus }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log("Response status code:", response.status);
    if (response.status === 200) {
      console.log("Product status updated successfully.");
      res.status(200).json({ message: 'Product status updated successfully' });
    } else {
      res.status(response.status).json({
        message: `Failed to update product status, status code: ${response.status}`
      });
    }
  } catch (error) {
    console.error("Error updating product status:", error.message || error);
    res.status(500).json({ message: "Error updating product status", error: error.message });
  }
});




module.exports = router;
