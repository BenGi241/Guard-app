'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Repeat, Download, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSyncUser } from '@/lib/state';

const baseNavItems = [
  { href: '/dashboard', label: 'לוח שמירות', icon: Calendar },
  { href: '/dashboard/swap', label: 'החלפת שמירה', icon: Repeat },
  { href: '/dashboard/export', label: 'ייצוא', icon: Download },
];

const adminNavItem = {
  href: '/dashboard/admin',
  label: 'אדמין',
  icon: UserCheck,
};

export default function BottomNav() {
  const pathname = usePathname();
  const { currentUser } = useSyncUser();

  if (!currentUser) {
    return null;
  }

  const navItems = currentUser.isAdmin
    ? [...baseNavItems, adminNavItem]
    : baseNavItems;
  const gridColsClass = currentUser.isAdmin ? 'grid-cols-4' : 'grid-cols-3';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card shadow-t-lg">
      <div className={cn('mx-auto grid h-16 max-w-lg', gridColsClass)}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'inline-flex flex-col items-center justify-center px-5 font-medium hover:bg-muted',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="mb-1 h-6 w-6" />
              <span className="text-xs">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
