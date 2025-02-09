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
 * Verifies a payment by calling the external payment verification API.
 *
 * @param {String} reference - The orderId (used as the reference) to verify payment.
 * @returns {Promise<Object>} - An object with { success, data, message }.
 */
async function verifyPayment(reference) {
  try {
    console.log(`Verifying payment with reference: ${reference}`);
    const uri = `${_paymentBaseUrl}/payments/verifyPayment`;
    console.log(`Verifying payment with URI: ${uri}`);

    const requestBody = { reference };

    const response = await axios.post(uri, requestBody, {
      headers: { 'Content-Type': 'application/json' },
    });

    console.log(`Payment verification response: ${response.status}`);
    console.log(`Response data: ${JSON.stringify(response.data)}`);

    if (response.status !== 200) {
      console.error(
        `Payment verification failed: ${response.status} - ${JSON.stringify(response.data)}`
      );
      throw new Error(
        `Payment verification failed: ${response.status} - ${JSON.stringify(response.data)}`
      );
    }

    return {
      success: true,
      data: response.data,
      message: 'Payment verification successful',
    };
  } catch (error) {
    console.error("Error in verifyPayment:", error);
    throw new Error(`Error verifying payment: ${error.message || error}`);
  }
}


module.exports = {
  initiatePayment,
  verifyPayment,
};
