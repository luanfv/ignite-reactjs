import { useCallback } from 'react';
import { useSession, signIn } from 'next-auth/client';

import styles from './styles.module.scss'
import { api } from '../../services/api';
import { getStripeJs } from '../../services/stripe-js';

interface ISubscribeButtonProps {
  priceId: String;
}

export function SubscribeButton({ priceId }: ISubscribeButtonProps) {
  const [session] = useSession();

  const handleSubscribe = useCallback(async () => {
    if (!session) {
      signIn('github');

      return;
    }

    try {
      const response = await api.post('/subscribe');
      const { sessionId } = response.data;
      const stripe = await getStripeJs();

      await stripe.redirectToCheckout({
        sessionId,
      });
    } catch (err) {
      alert(err.message);
    }
  }, [session]);

  return (
    <button
      type="button"
      className={styles.subscribeButton}
      onClick={handleSubscribe}
    >
      Subscribe now
    </button>
  );
}