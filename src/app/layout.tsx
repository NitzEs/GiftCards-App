import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ToastProvider } from '@/components/ui/Toast';

const heebo = Heebo({
  subsets: ['latin', 'hebrew'],
  variable: '--font-heebo',
});

export const metadata: Metadata = {
  title: 'Gift Cards | כרטיסי מתנה',
  description: 'ניהול יתרות כרטיסי מתנה',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#0f0f11]">
        {/* Clears stale Firebase redirect state BEFORE any module runs.
            Without this, the Firebase SDK auto-processes old
            signInWithRedirect state from localStorage on every page load. */}
        <Script id="clear-firebase-redirect" strategy="beforeInteractive">{`
          (function(){
            try {
              var stores = [localStorage, sessionStorage];
              for (var s = 0; s < stores.length; s++) {
                var store = stores[s];
                var rem = [];
                for (var i = 0; i < store.length; i++) {
                  var k = store.key(i) || '';
                  if (k.indexOf('firebase') === 0 &&
                     (k.indexOf('pendingRedirect') > -1 ||
                      k.indexOf('redirectUser')   > -1)) {
                    rem.push(k);
                  }
                }
                rem.forEach(function(k){ store.removeItem(k); });
              }
            } catch(e) {}
          })();
        `}</Script>
        <AuthProvider>
          <LanguageProvider>
            <ToastProvider>{children}</ToastProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
