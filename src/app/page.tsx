'use client';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Shield } from 'lucide-react';
import { useAuth } from '@/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useGuardDutyStore } from '@/lib/state';

export default function LoginPage() {
  const auth = useAuth();
  const user = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { users, setCurrentUser } = useGuardDutyStore();


  useEffect(() => {
    // Set a loading state until user status is determined
    if (user.data) {
      router.push('/dashboard');
    }
  }, [user.data, user.loading, router]);

  const handleLogin = async () => {
    setIsLoading(true);
    // Find the admin user from the mock data.
    const adminUser = Object.values(users).find(u => u.isAdmin);
    if (adminUser) {
        setCurrentUser(adminUser);
        router.push('/dashboard');
    } else {
        // Fallback if admin not found for some reason
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: 'Admin user not found. Please sign up first.',
        });
        setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!auth) return;
    setIsSigningUp(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to sign up', error);
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: 'Could not create a new user. The email might be in use.',
      });
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error) {
      console.error('Google sign in failed', error);
    } finally {
      setIsGoogleLoading(false);
    }
  };
  
  const anyLoading = isLoading || isSigningUp || isGoogleLoading || user.loading;

  if (user.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (user.data) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <p>Redirecting to dashboard...</p>
        </div>
      )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-md flex-col items-center">
        <Card className="w-full shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="font-headline text-3xl">GuardDuty</CardTitle>
            <CardDescription>
              Log in to manage your guard schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Personal ID / Email</Label>
                <Input
                  id="username"
                  placeholder="Your army ID or email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={anyLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={anyLoading}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleLogin} className="w-full" disabled={anyLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Log In'}
                </Button>
                <Button onClick={handleSignUp} variant="secondary" className="w-full" disabled={anyLoading}>
                  {isSigningUp ? <Loader2 className="animate-spin" /> : 'Sign Up'}
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={handleGoogleSignIn}
                className="w-full"
                disabled={anyLoading}
              >
                {isGoogleLoading ? <Loader2 className="animate-spin" /> : 'Sign in with Google'}
              </Button>
            </div>
             <div className='mt-4 text-center text-sm text-muted-foreground p-2 border rounded-md'>
                <p><strong>Admin demo:</strong> Use <code>israel@example.com</code> and any password to sign up first, then log in.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
