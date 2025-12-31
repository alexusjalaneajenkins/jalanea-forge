'use client';

import { useSearchParams } from 'next/navigation';
import { PasswordGate, EasterEgg } from '@/components';

export default function Home() {
  const searchParams = useSearchParams();
  const showEasterEgg = searchParams.get('easter') === 'true';

  if (showEasterEgg) {
    return <EasterEgg />;
  }

  return <PasswordGate />;
}
