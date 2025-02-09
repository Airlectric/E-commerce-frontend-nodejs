// routes/checkout.js
const express = require('express');
const router = express.Router();
const PaymentService = require('../services/PaymentService');
const axios = require('axios');
const { ensureAuthenticated } = require('../../middleware/ensureAuthentication');



// GET /checkout - Render the checkout page with order details.
router.get('/', ensureAuthenticated, (req, res) => {
  const { orderId, amount } = req.session.paymentInfo || {};
  if (!orderId || !amount) {
    return res.redirect('/order/cart'); 
  }
  const paymentMethods = ['Paystack', 'PayPal', 'Flutterwave', 'Stripe'];
  res.render('pages/orders/checkout', { orderId, amount, paymentMethods });
});


router.get('/webview', ensureAuthenticated, (req, res) => {
  const { url, paymentId } = req.query;
  if (!url || !paymentId) {
    return res.status(400).send("Missing payment information.");
  }
  // Render a simple page that loads the payment gateway in an iframe or via redirection.
  res.render('pages/orders/paymentWebview', { url, paymentId });
});




// POST /checkout/payment - Process the payment.
router.post('/payment', ensureAuthenticated, async (req, res) => {
  try {
    const { orderId, amount, paymentMethod } = req.body;
    // Retrieve customer email from session (adjust if needed)
    const customerEmail = req.session.user.email;
    console.log(`Processing payment for order ${orderId} with amount ${amount} using ${paymentMethod}`);

    // Initiate payment by calling PaymentService
    const responseData = await PaymentService.initiatePayment({
      orderId,
      amount: parseFloat(amount),
      paymentMethod,
      customerEmail,
    });
    console.log("Payment initiation response:", responseData);

    if (paymentMethod === 'Paystack') {
      // For Paystack, redirect to a payment webview page with the authorization URL.
      const authorizationUrl = responseData.details.authorization_url;
      const paymentId = responseData.paymentId;
      // Redirect to your payment webview page (create an appropriate route/view)
      res.redirect(`/checkout/webview?url=${encodeURIComponent(authorizationUrl)}&paymentId=${paymentId}`);
    } else {
      // For other gateways, display a success message (using flash messages, for example) and redirect to orders.
      req.flash('success', `Payment successful: ${responseData.message}`);
      res.redirect('/order/orders');
    }
  } catch (error) {
    console.error("Payment failed:", error.message);
    req.flash('error', `Payment failed: ${error.message}`);
    res.redirect('/checkout/');
  }
});

module.exports = router;
