import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const razorpay = new Razorpay({
  key_id: process.env.NODE_ENV === 'production'
    ? process.env.RAZORPAY_LIVE_KEY_ID!
    : process.env.RAZORPAY_TEST_KEY_ID!,
  key_secret: process.env.NODE_ENV === 'production'
    ? process.env.RAZORPAY_LIVE_KEY_SECRET!
    : process.env.RAZORPAY_TEST_KEY_SECRET!
});

export async function POST(request: Request) {
  try {
    const { orderId, paymentId } = await request.json();

    // In test mode, skip actual verification
    if (process.env.NODE_ENV !== 'production') {
      await updateDoc(doc(db, "orders", orderId), {
        status: 'completed',
        razorpayPaymentId: 'test_' + paymentId,
        updatedAt: serverTimestamp(),
        testPayment: true
      });
      
      return NextResponse.json({ 
        status: 'success',
        testMode: true,
        orderId
      });
    }

    // Live mode - real verification
    const payment = await razorpay.payments.fetch(paymentId);
    
    await updateDoc(doc(db, "orders", orderId), {
      status: 'completed',
      razorpayPaymentId: paymentId,
      updatedAt: serverTimestamp(),
      paymentDetails: {
        amount: Number(payment.amount) / 100, // ✅ Fix: Ensure number type
        currency: payment.currency,
        method: payment.method,
        timestamp: payment.created_at
      }
    });

    return NextResponse.json({ 
      status: 'success',
      orderId,
      paymentId 
    });

  } catch (error) {
    console.error('Payment capture error:', error);
    return NextResponse.json(
      { 
        error: 'Payment verification failed',
        mode: process.env.NODE_ENV
      },
      { status: 500 }
    );
  }
}
