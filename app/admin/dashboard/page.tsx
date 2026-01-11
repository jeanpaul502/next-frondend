import AdminDashboard from '@/src/admin/AdminDashboard';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
    title: 'Dashboard Admin | Netfix',
    description: 'Panneau de gestion administrateur',
    robots: {
        index: false,
        follow: false,
    },
};

export const dynamic = 'force-dynamic';

export default function AdminDashboardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Chargement...</div>}>
            <AdminDashboard />
        </Suspense>
    );
}
