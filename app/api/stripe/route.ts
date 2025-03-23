import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);



export async function POST(request: NextRequest) {
  try {

    // you can implement some basic check here like, is user valid or not
    const data = await request.json();
    const {imageUrl} = data;
    const session= await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: process.env.PRICE_ID,
            quantity: 1
          }
        ],
        mode: 'payment',
        success_url: `https://imagenary-eight.vercel.app/success`,
        cancel_url: `https://imagenary-eight.vercel.app/cancel`,
        metadata: {
          imageUrl: imageUrl
        }
      });
    return NextResponse.json({ result: session, ok: true });
  } catch (error) {
    console.log(error);
    return new NextResponse('Internal Server', { status: 500 });
  }
}
