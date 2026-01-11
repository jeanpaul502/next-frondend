import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ResetPasswordForm } from "../../src/auth";

export const metadata: Metadata = {
  title: 'Réinitialisation mot de passe',
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="text-white">Chargement...</div></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}