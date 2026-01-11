'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '../utils/config';
import AdminSidebar from './components/AdminSidebar';
import AdminNavbar from './components/AdminNavbar';
import { Icon } from '@iconify/react';

import Overview from './overview/Overview';
import Analytics from './analytics/Analytics';
import Transactions from './transactions/Transactions';
import Users from './users/Users';
import Content from './content/Content';
import Channels from './channels/Channels';
import Requests from './requests/Requests';
import Announcements from './announcements/Announcements';
import Feedbacks from './feedbacks/Feedbacks';
import Notifications from './notifications/Notifications';
import Security from './security/Security';

const AdminDashboardContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

    // Sync activeTab with URL parameters
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    // Fetch stats (pending requests)
    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;
            try {
                const res = await fetch(`${API_BASE_URL}/requests/pending-count`, {
                    credentials: 'include'
                });
                if (res.ok) {
                    const count = await res.json();
                    setPendingRequestsCount(count);
                }
            } catch (error) {
                console.error('Failed to fetch stats', error);
            }
        };
        fetchStats();
    }, [user]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        router.push(`/admin/dashboard?tab=${tab}`, { scroll: false });
    };

    useEffect(() => {
        const fetchUser = async (retry = true) => {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/me?t=${Date.now()}`, {
                    credentials: 'include',
                    cache: 'no-store'
                });

                if (!response.ok) {
                    if (response.status === 401 && retry) {
                        try {
                            // Tentative de rafraîchissement du token
                            const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
                                method: 'POST',
                                credentials: 'include',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            });

                            if (refreshResponse.ok) {
                                // Réessai de la requête initiale
                                return fetchUser(false);
                            }
                        } catch (refreshError) {
                            console.error('Erreur lors du rafraîchissement du token', refreshError);
                        }
                    }
                    throw new Error('Not authenticated');
                }

                const data = await response.json();
                const userData = data.user || data;

                if (!userData || userData.role !== 'ADMIN') {
                    console.warn('Access denied: User is not ADMIN. Role identified:', userData?.role, 'User data:', userData);
                    // Force la redirection explicite vers Dashboard
                    window.location.href = '/dashboard';
                    return;
                }

                setUser(userData);
            } catch (error) {
                console.error('Auth error:', error);
                router.push('/login');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Dynamic Title based on Active Tab
    const getPageTitle = () => {
        switch (activeTab) {
            case 'users': return 'Gestion des Utilisateurs';
            case 'analytics': return 'Analyses & Statistiques';
            case 'transactions': return 'Transactions Financières';
            case 'content': return 'Films & Séries';
            case 'channels': return 'Chaînes TV';
            case 'requests': return 'Demandes';
            case 'announcements': return 'Annonces & Communications';
            case 'notifications': return 'Notifications';
            case 'feedbacks': return 'Feedbacks';
            case 'security': return 'Sécurité & Accès';
            default: return "Vue d'ensemble";
        }
    };

    const getPageDescription = () => {
        switch (activeTab) {
            case 'users': return 'Gérez les comptes utilisateurs et les abonnements';
            case 'analytics': return 'Suivez les performances et la croissance de la plateforme';
            case 'transactions': return 'Consultez l\'historique des paiements et transactions';
            case 'content': return 'Ajoutez ou modifiez le catalogue';
            case 'channels': return 'Gérez les chaînes de télévision et le guide des programmes';
            case 'requests': return 'Gérez les demandes de contenu des utilisateurs';
            case 'announcements': return 'Publiez des annonces importantes pour vos utilisateurs';
            case 'notifications': return 'Envoyez des notifications aux utilisateurs';
            case 'feedbacks': return 'Consultez les retours et avis des utilisateurs';
            case 'security': return 'Gérez la sécurité et les journaux d\'accès';
            default: return "Bienvenue dans votre panneau d'administration";
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <Overview />;
            case 'analytics': return <Analytics />;
            case 'transactions': return <Transactions />;
            case 'users': return <Users />;
            case 'content': return <Content />;
            case 'channels': return <Channels />;
            case 'requests': return <Requests />;
            case 'announcements': return <Announcements />;
            case 'feedbacks': return <Feedbacks />;
            case 'notifications': return <Notifications />;
            case 'security': return <Security />;
            default: return <Overview />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100">
            {/* Sidebar (Fixed Left) */}
            <AdminSidebar
                user={user}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                pendingRequestsCount={pendingRequestsCount}
            />

            {/* Right Side Wrapper */}
            <div className="ml-64 min-h-screen flex flex-col">
                {/* Navbar (Sticky Top) */}
                <AdminNavbar
                    title={getPageTitle()}
                    description={getPageDescription()}
                    user={user}
                />

                {/* Main Content Area */}
                <main className="flex-1 p-8">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        }>
            <AdminDashboardContent />
        </Suspense>
    );
};

export default AdminDashboard;
