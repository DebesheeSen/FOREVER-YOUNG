// app/api/paypal/create-order/route.ts
import { NextResponse } from 'next/server';
import paypal from '@paypal/checkout-server-sdk';

const clientId = process.env.PAYPAL_CLIENT_ID!;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;

const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
const client = new paypal.core.PayPalHttpClient(environment);

export async function POST(request: Request) {
  const { amount } = await request.json();

  const requestPaypal = new paypal.orders.OrdersCreateRequest();
  requestPaypal.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'INR',
        value: amount.toString()
      }
    }],
    // Remove payment_source if not needed by your SDK version
    application_context: {  // ← Proper alternative for most use cases
      brand_name: 'FOREVER YOUNG',
      locale: 'en-US',
      landing_page: 'LOGIN',
      user_action: 'PAY_NOW',
      return_url: 'https://forever-young-lake.vercel.app/success',
      cancel_url: 'https://forever-young-lake.vercel.app/payment/cancel'
    }
  });

  try {
    const response = await client.execute(requestPaypal);
    return NextResponse.json({ id: response.result.id });
  } catch (err) {
    console.error('PayPal API error:', err);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}