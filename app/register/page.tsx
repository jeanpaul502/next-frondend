import type { Metadata } from 'next';
import { RegisterForm } from "../../src/auth";

export const metadata: Metadata = {
  title: 'Inscription',
};

export default function RegisterPage() {
  return <RegisterForm />;
}