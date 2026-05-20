import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';
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
      {/* Runs before any JS module loads — clears stale Firebase redirect state
          so the SDK cannot auto-process old signInWithRedirect attempts. */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var stores = [localStorage, sessionStorage];
              for (var s = 0; s < stores.length; s++) {
                var store = stores[s];
                var rem = [];
                for (var i = 0; i < store.length; i++) {
                  var k = store.key(i) || '';
                  if (k.indexOf('firebase') === 0 &&
                      (k.indexOf('pendingRedirect') > -1 || k.indexOf('redirectUser') > -1)) {
                    rem.push(k);
                  }
                }
                rem.forEach(function(k){ store.removeItem(k); });
              }
            } catch(e) {}
          })();
        ` }} />
      </head>
      <body className="min-h-full bg-[#0f0f11]">
        <AuthProvider>
          <LanguageProvider>
            <ToastProvider>{children}</ToastProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
