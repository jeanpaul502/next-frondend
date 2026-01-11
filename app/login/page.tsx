import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginForm } from "../../src/auth";

export const metadata: Metadata = {
  title: 'Connexion',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="text-white">Chargement...</div></div>}>
      <LoginForm />
    </Suspense>
  );
}