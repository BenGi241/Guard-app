
'use client';
import Header from '@/components/header';
import BottomNav from '@/components/bottom-nav';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Header />
        <main className="flex-grow overflow-y-auto pb-20">{children}</main>
        <BottomNav />
      </div>
    </FirebaseClientProvider>
  );
}
