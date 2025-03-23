'use client';
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';

type Props = {
  imageUrl: string;
  price: string;
  
};

const SubscribeComponent = ({ imageUrl}: Props) => {
  const handleSubmit = async () => {
    const stripe = await loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string
    );
    if (!stripe) return;

    try {
      const response = await axios.post('/api/stripe', {
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
        imageUrl: imageUrl
      });
      
      const data = response.data;
      if (!data.ok) throw new Error('Something went wrong');
      
      await stripe.redirectToCheckout({
        sessionId: data.result.id
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <button 
        onClick={handleSubmit}
        className="bg-white text-black hover:bg-white/90 px-4 py-2 rounded-md"
      >
        Download
      </button>
    </div>
  );
};

export default SubscribeComponent;