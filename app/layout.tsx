import React from 'react';
import './globals.css';
import Script from 'next/script';


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script 
          src="https://checkout.razorpay.com/v1/checkout.js" 
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}