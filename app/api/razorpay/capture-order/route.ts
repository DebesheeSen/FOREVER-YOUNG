/*eslint-disable*/
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Initialize Razorpay with proper error handling
let razorpay: Razorpay;

try {
  // Get keys based on environment with proper fallbacks
  const key_id = process.env.RAZORPAY_KEY_ID || 
                process.env.RAZORPAY_TEST_KEY_ID || 
                process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID; // Last resort
  
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 
                    process.env.RAZORPAY_TEST_KEY_SECRET || 
                    process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET; // Last resort

  if (!key_id || !key_secret) {
    throw new Error('Razorpay keys are not configured in environment variables');
  }

  razorpay = new Razorpay({
    key_id,
    key_secret
  });

} catch (error) {
  console.error('Razorpay initialization failed:', error);
  throw new Error('Failed to initialize Razorpay. Check server logs.');
}

export async function POST(request: Request) {
  try {
    // Validate Razorpay instance
    if (!razorpay) {
      throw new Error('Razorpay client not initialized');
    }

    // Parse and validate request body
    const { orderId, paymentId } = await request.json();
    
    if (!orderId || !paymentId) {
      return NextResponse.json(
        { error: 'Missing orderId or paymentId in request body' },
        { status: 400 }
      );
    }

    // Test mode handling
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Test mode - Simulating payment capture for order ${orderId}`);
      
      await updateDoc(doc(db, "orders", orderId), {
        status: 'completed',
        razorpayPaymentId: `test_${paymentId}`,
        updatedAt: serverTimestamp(),
        testPayment: true,
        environment: 'test'
      });
      
      return NextResponse.json({ 
        status: 'success',
        testMode: true,
        orderId,
        paymentId
      });
    }

    // Production mode - real verification
    console.log(`Processing live payment for order ${orderId}`);
    const payment = await razorpay.payments.fetch(paymentId);
    
    // Validate payment matches order
    if (payment.order_id !== orderId) {
      throw new Error('Payment does not match order ID');
    }

    // Update Firestore
    await updateDoc(doc(db, "orders", orderId), {
      status: 'completed',
      razorpayPaymentId: paymentId,
      updatedAt: serverTimestamp(),
      paymentDetails: {
        amount: payment.amount ? Number(payment.amount) / 100 : 0,
        currency: payment.currency || 'INR',
        method: payment.method || 'unknown',
        timestamp: payment.created_at || Date.now(),
        status: payment.status
      },
      environment: 'production'
    });

    return NextResponse.json({ 
      status: 'success',
      orderId,
      paymentId,
      amount: payment.amount ? Number(payment.amount) / 100 : 0,
      currency: payment.currency
    });

  } catch (error: any) {
    console.error('Payment capture error:', error);
    
    // Enhanced error response
    return NextResponse.json(
      { 
        error: 'Payment verification failed',
        message: error.message,
        details: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        mode: process.env.NODE_ENV
      },
      { status: 500 }
    );
  }
}