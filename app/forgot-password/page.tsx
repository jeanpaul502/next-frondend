import type { Metadata } from 'next';
import { ForgotPasswordForm } from "../../src/auth";

export const metadata: Metadata = {
  title: 'Mot de passe oublié',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}