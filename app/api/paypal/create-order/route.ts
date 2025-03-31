import { NextResponse } from 'next/server';
import paypal from '@paypal/checkout-server-sdk';

const clientId = process.env.PAYPAL_CLIENT_ID!;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;

const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
const client = new paypal.core.PayPalHttpClient(environment);

export async function POST(request: Request) {
  const { amount, currency, description } = await request.json();

  const requestPaypal = new paypal.orders.OrdersCreateRequest();
  requestPaypal.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: currency,
        value: amount.toString()
      },
      description: description
    }]
  });

  try {
    const response = await client.execute(requestPaypal);
    return NextResponse.json({ id: response.result.id });
  } catch (err) {
    return NextResponse.json({ error: err }, { status: 500 });
  }
}