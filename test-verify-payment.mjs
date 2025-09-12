import fetch from 'node-fetch';

async function testVerifyPayment() {
  const response = await fetch('http://localhost:3000/api/orders/verify-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id: 'test_order_id',
      razorpay_payment_id: 'test_payment_id',
      razorpay_signature: 'test_signature',
      orderId: 1 // Use a real orderId from your DB for a user with no referral code
    })
  });
  const data = await response.json();
  console.log('API Response:', data);
}

testVerifyPayment();
