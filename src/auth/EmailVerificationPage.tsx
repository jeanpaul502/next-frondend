'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { showErrorToast } from '../lib/toast';

const EmailVerificationPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [isTokenChecked, setIsTokenChecked] = useState(false);

  // Vérifier si le paramètre success et le token sont présents
  useEffect(() => {
    const success = searchParams.get('success');
    const token = searchParams.get('token');

    if (!success || success !== 'true' || !token) {
      // Si pas de paramètre success ou token, rediriger vers login
      showErrorToast('Accès refusé', 'Token invalide ou manquant.');
      router.replace('/login');
    } else {
      setIsTokenChecked(true);
    }
  }, [searchParams, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShouldRedirect(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (shouldRedirect) {
      router.push('/login');
    }
  }, [shouldRedirect, router]);

  if (!isTokenChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full">
        <div className="relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md shadow-xl p-8 text-center space-y-6">
          {/* Logo succès */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Fond blanc pour la coche transparente */}
              <div className="absolute inset-0 m-auto w-10 h-10 bg-white rounded-full"></div>
              <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" className="text-green-500 relative z-10"><path fill="currentColor" fillRule="evenodd" d="M9.592 3.2a6 6 0 0 1-.495.399c-.298.2-.633.338-.985.408c-.153.03-.313.043-.632.068c-.801.064-1.202.096-1.536.214a2.71 2.71 0 0 0-1.655 1.655c-.118.334-.15.735-.214 1.536a6 6 0 0 1-.068.632c-.07.352-.208.687-.408.985c-.087.13-.191.252-.399.495c-.521.612-.782.918-.935 1.238c-.353.74-.353 1.6 0 2.34c.153.32.414.626.935 1.238c.208.243.312.365.399.495c.2.298.338.633.408.985c.03.153.043.313.068.632c.064.801.096 1.202.214 1.536a2.71 2.71 0 0 0 1.655 1.655c.334.118.735.15 1.536.214c.319.025.479.038.632.068c.352.07.687.209.985.408c.13.087.252.191.495.399c.612.521.918.782 1.238.935c.74.353 1.6.353 2.34 0c.32-.153.626-.414 1.238-.935c.243-.208.365-.312.495-.399c.298-.2.633-.338.985-.408c.153-.03.313-.043.632-.068c.801-.064 1.202-.096 1.536-.214a2.71 2.71 0 0 0 1.655-1.655c.118-.334.15-.735.214-1.536c.025-.319.038-.479.068-.632c.07-.352.209-.687.408-.985c.087-.13.191-.252.399-.495c.521-.612.782-.918.935-1.238c.353-.74.353-1.6 0-2.34c-.153-.32-.414-.626-.935-1.238a6 6 0 0 1-.399-.495a2.7 2.7 0 0 1-.408-.985a6 6 0 0 1-.068-.632c-.064-.801-.096-1.202-.214-1.536a2.71 2.71 0 0 0-1.655-1.655c-.334-.118-.735-.15-1.536-.214a6 6 0 0 1-.632-.068a2.7 2.7 0 0 1-.985-.408a6 6 0 0 1-.495-.399c-.612-.521-.918-.782-1.238-.935a2.71 2.71 0 0 0-2.34 0c-.32.153-.626.414-1.238.935m6.781 6.663a.814.814 0 0 0-1.15-1.15l-4.85 4.85l-1.596-1.595a.814.814 0 0 0-1.15 1.15l2.17 2.17a.814.814 0 0 0 1.15 0z" clipRule="evenodd" /></svg>
            </div>
          </div>

          {/* Message de succès */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white">
              Email vérifié avec succès !
            </h2>
            <p className="text-sm text-gray-400">
              Votre compte est maintenant activé
            </p>
          </div>

          {/* Message de confirmation */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-6 text-left">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" className="text-green-400"><path fill="currentColor" fillRule="evenodd" d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2s10 4.477 10 10m-5.97-3.03a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 1 1 1.06-1.06l1.47 1.47l2.235-2.235L14.97 8.97a.75.75 0 0 1 1.06 0" clipRule="evenodd" /></svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-white">
                  Vérification réussie
                </h3>
                <div className="mt-2 text-sm text-gray-300">
                  <p>
                    Félicitations ! Votre adresse email a été vérifiée avec succès.
                  </p>
                  <p className="mt-2">
                    Vous pouvez maintenant accéder à votre portefeuille numérique et commencer à gérer vos actifs en toute sécurité.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Redirection automatique */}
          <div className="flex justify-center items-center gap-3">
            <span className="text-sm text-gray-400">Veuillez patienter...</span>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <button
              onClick={() => {
                router.push('/login');
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30 cursor-pointer flex items-center justify-center"
            >
              Se connecter maintenant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;