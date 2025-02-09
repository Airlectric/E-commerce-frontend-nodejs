const axios = require('axios');
require('dotenv').config();

const _paymentBaseUrl = process.env.API_PAYMENT_URL || '';

/**
 * Initiates a payment request.
 * Returns JSON response on success (expecting status 201).
 */
async function initiatePayment({ orderId, amount, paymentMethod, customerEmail }) {
  const uri = `${_paymentBaseUrl}/payments/initiate`;
  console.log('Initiating payment with URI:', uri);

  const requestBody = {
    orderId,
    amount,
    paymentMethod,
    customerEmail,
  };

  try {
    const response = await axios.post(uri, requestBody, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('Payment initiation response:', response.status);
    console.log('Response body:', response.data);

    if (response.status === 201) {
      return response.data;
    } else {
      throw new Error(`Failed to initiate payment: ${response.status} - ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error('Error initiating payment:', error.message);
    throw error;
  }
}

/**
 * Verifies a payment.
 */
async function verifyPayment({ paymentId, status }) {
  const uri = `${_paymentBaseUrl}/payments/verify`;
  console.log('Verifying payment with URI:', uri);

  const requestBody = { paymentId, status };

  try {
    const response = await axios.post(uri, requestBody, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('Payment verification response:', response.status);
    console.log('Response body:', response.data);

    if (response.status !== 200) {
      throw new Error(`Failed to verify payment: ${response.status} - ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error('Error verifying payment:', error.message);
    throw error;
  }
}

module.exports = {
  initiatePayment,
  verifyPayment,
};
