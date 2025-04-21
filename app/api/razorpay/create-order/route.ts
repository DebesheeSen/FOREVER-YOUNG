// app/api/razorpay/create-order/route.ts
/*eslint-disable*/
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// ✅ Initialize Razorpay with server-side environment variables
const razorpay = new Razorpay({
  key_id:
    process.env.NODE_ENV === 'production'
      ? process.env.RAZORPAY_LIVE_KEY_ID!
      : process.env.RAZORPAY_TEST_KEY_ID!,
  key_secret:
    process.env.NODE_ENV === 'production'
      ? process.env.RAZORPAY_LIVE_KEY_SECRET!
      : process.env.RAZORPAY_TEST_KEY_SECRET!,
});

export async function POST(request: Request) {
  try {
    const { amount, currency = 'INR' } = await request.json();

    if (!amount || isNaN(amount)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // ✅ Create a Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: `order_${Date.now()}`,
      payment_capture: 1, // Auto-capture payments
      notes: {
        environment: process.env.NODE_ENV,
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // ✅ Save order to Firestore
    await setDoc(doc(db, 'orders', razorpayOrder.id), {
      orderId: razorpayOrder.id,
      amount: amount,
      currency,
      status: 'created',
      environment: process.env.NODE_ENV,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error: any) {
    console.error('Razorpay order error:', error);

    return NextResponse.json(
      {
        error: 'Failed to create order',
        message: error?.message || 'Unknown error',
        mode: process.env.NODE_ENV,
        testMode: process.env.NODE_ENV !== 'production',
      },
      { status: 500 }
    );
  }
}
