import { Suspense } from 'react';
import type { Metadata } from 'next';
import { VerifyPinForm } from "../../src/auth";

export const metadata: Metadata = {
    title: 'Vérification PIN',
};

export default function VerifyPinPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="text-white">Chargement...</div></div>}>
            <VerifyPinForm />
        </Suspense>
    );
}
