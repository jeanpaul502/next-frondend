import { Suspense } from 'react';
import type { Metadata } from 'next';
import { EmailVerificationPage } from '@/src/auth';

export const metadata: Metadata = {
  title: 'Vérification Email',
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="text-white">Chargement...</div></div>}>
      <EmailVerificationPage />
    </Suspense>
  );
}