'use client';

import { useEffect, useCallback, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '../utils/config';

function ActivityTrackerContent() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const lastUpdate = useRef<number>(0);
    const THROTTLE_MS = 60000; // 1 minute throttle for events
    const NAVIGATION_THROTTLE_MS = 5000; // 5 seconds throttle for navigation

    const updateActivity = useCallback(async (isNavigation = false) => {
        const now = Date.now();
        const throttle = isNavigation ? NAVIGATION_THROTTLE_MS : THROTTLE_MS;

        // Don't track activity on public pages to avoid 401 errors
        const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
        if (publicPaths.some(path => pathname === path || pathname?.startsWith(path + '?'))) {
            return;
        }

        if (now - lastUpdate.current < throttle) {
            return;
        }

        lastUpdate.current = now;

        try {
            // Fire and forget activity update
            // We use 'credentials: include' to ensure cookies are sent
            await fetch(`${API_BASE_URL}/auth/me`, {
                method: 'GET',
                credentials: 'include'
            });
        } catch (err) {
            // Ignore errors silently
        }
    }, []);

    // Update on navigation
    useEffect(() => {
        updateActivity(true);
    }, [pathname, searchParams, updateActivity]);

    // Update on user interaction (throttled)
    useEffect(() => {
        const handleActivity = () => updateActivity(false);

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('scroll', handleActivity);

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('scroll', handleActivity);
        };
    }, [updateActivity]);

    return null;
}

export default function ActivityTracker() {
    return (
        <Suspense fallback={null}>
            <ActivityTrackerContent />
        </Suspense>
    );
}
