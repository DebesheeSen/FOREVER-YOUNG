// app/api/razorpay/create-order/route.ts
/*eslint-disable*/
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Initialize Razorpay with proper error handling
let razorpay: Razorpay;

try {
  // Get environment variables with proper fallbacks
  const key_id = process.env.RAZORPAY_LIVE_KEY_ID || 
                process.env.RAZORPAY_TEST_KEY_ID;
  
  const key_secret = process.env.RAZORPAY_LIVE_KEY_SECRET || 
                    process.env.RAZORPAY_TEST_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error(`
      Razorpay keys are missing!
      Test Key ID: ${!!process.env.RAZORPAY_TEST_KEY_ID}
      Test Key Secret: ${!!process.env.RAZORPAY_TEST_KEY_SECRET}
      Live Key ID: ${!!process.env.RAZORPAY_LIVE_KEY_ID}
      Live Key Secret: ${!!process.env.RAZORPAY_LIVE_KEY_SECRET}
      NODE_ENV: ${process.env.NODE_ENV}
    `);
  }

  razorpay = new Razorpay({
    key_id,
    key_secret
  });

  console.log('Razorpay initialized in', process.env.NODE_ENV, 'mode');

} catch (error: any) {
  console.error('❌ Razorpay initialization failed:', error.message);
  throw new Error('Failed to initialize Razorpay. Check server logs.');
}

export async function POST(request: Request) {
  try {
    // Validate Razorpay instance
    if (!razorpay) {
      throw new Error('Razorpay client not initialized');
    }

    const { amount, currency = 'INR' } = await request.json();

    // Validate amount
    if (!amount || isNaN(amount)) {
      return NextResponse.json(
        { error: 'Invalid amount' }, 
        { status: 400 }
      );
    }

    // Create order options
    const options = {
      amount: Math.round(Number(amount) * 100), // Convert to paise
      currency,
      receipt: `order_${Date.now()}`,
      payment_capture: 1, // Auto-capture payments
      notes: {
        environment: process.env.NODE_ENV || 'development',
      },
    };

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create(options);
    console.log('Order created:', razorpayOrder.id);

    // Save to Firestore
    await setDoc(doc(db, 'orders', razorpayOrder.id), {
      orderId: razorpayOrder.id,
      amount: Number(amount),
      currency,
      status: 'created',
      environment: process.env.NODE_ENV || 'development',
      createdAt: serverTimestamp(),
      razorpayOrder: {
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt
      }
    });

    return NextResponse.json({
      success: true,
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt
    });

  } catch (error: any) {
    console.error('Order creation failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create order',
        message: error.message,
        details: process.env.NODE_ENV !== 'production' ? {
          stack: error.stack,
          keysConfigured: {
            testKeyId: !!process.env.RAZORPAY_TEST_KEY_ID,
            testKeySecret: !!process.env.RAZORPAY_TEST_KEY_SECRET,
            liveKeyId: !!process.env.RAZORPAY_LIVE_KEY_ID,
            liveKeySecret: !!process.env.RAZORPAY_LIVE_KEY_SECRET
          }
        } : undefined
      },
      { status: 500 }
    );
  }
}