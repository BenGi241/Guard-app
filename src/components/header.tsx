'use client';
import Link from 'next/link';
import { Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useSyncUser } from '@/lib/state';

export default function Header() {
  const auth = useAuth();
  const router = useRouter();
  const { currentUser } = useSyncUser();

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  const getInitials = (name?: string, lastName?: string) => {
    if (!name) return 'U';
    const firstInitial = name[0];
    const lastInitial = lastName ? lastName[0] : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-card px-4 shadow-sm md:px-6">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 font-headline font-semibold"
      >
        <Shield className="h-6 w-6 text-primary" />
        <span className="text-xl">GuardDuty</span>
      </Link>
      <div className="ml-auto flex items-center gap-4">
        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  {currentUser.photoURL && (
                    <AvatarImage
                      src={currentUser.photoURL}
                      alt={`${currentUser.name} ${currentUser.lastName}`}
                    />
                  )}
                  <AvatarFallback>
                    {getInitials(currentUser.name, currentUser.lastName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
