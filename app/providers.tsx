'use client';

import { HeroUIProvider } from '@heroui/react';
import { ToastProvider } from '../src/components/Toast/ToastContext';
import ToastContainer from '../src/components/Toast/ToastContainer';
import { useEffect } from 'react';
import { initToast } from '../src/lib/toast';
import { useToast } from '../src/components/Toast/ToastContext';
import ActivityTracker from '../src/components/ActivityTracker';

function ToastInitializer() {
    const { addToast } = useToast();

    useEffect(() => {
        initToast(addToast);
    }, [addToast]);

    return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <HeroUIProvider>
            <ToastProvider>
                <ToastInitializer />
                <ActivityTracker />
                <ToastContainer />
                {children}
            </ToastProvider>
        </HeroUIProvider>
    );
}
