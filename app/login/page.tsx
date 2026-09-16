'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const auth = useAuth();
  const { login, isLoading, signInWithGoogle } = auth;
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Handle successful authentication
  useEffect(() => {
    if (auth.status === 'authenticated' && auth.session?.user) {
      // Get callback URL from query parameters or use default
      let redirectUrl = '/dashboard';
      const params = new URLSearchParams(window.location.search);
      const callbackUrl = params.get('callbackUrl');
      
      // Determine redirect URL based on role and callback
      const userRole = auth.session.user.role;
      if (callbackUrl) {
        redirectUrl = decodeURIComponent(callbackUrl);
      } else if (userRole === "DJ") {
        redirectUrl = "/dj/dashboard";
      }
      
      // Use replace instead of push to prevent back navigation to login
      router.replace(redirectUrl);
    }
  }, [auth.status, auth.session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await login(formData.email, formData.password);
    
    if (result) {
      // The useEffect above will handle the redirect
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // The useEffect above will handle the redirect
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-electric-pink/5"></div>
      
      <Card className="w-full max-w-md glass-card relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Flame className="h-12 w-12 text-neon-cyan" />
          </div>
          <CardTitle className="text-2xl font-bold bg-neon-gradient bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-app-text/70">
            Sign in to your NightVibe account
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="bg-app-surface border-neon-cyan/30 focus:border-neon-cyan"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-neon-cyan hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="bg-app-surface border-neon-cyan/30 focus:border-neon-cyan pr-10"
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-app-text/60" />
                  ) : (
                    <Eye className="h-4 w-4 text-app-text/60" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-neon-cyan hover:bg-neon-cyan/90 text-app-bg font-semibold"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </CardFooter>
        </form>

        <div className="px-6 pb-4">
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-app-surface px-2 text-app-text/70">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-neon-cyan/30 hover:bg-neon-cyan/10"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </Button>
        </div>

        <CardFooter className="flex flex-col space-y-4 pt-0">
          <div className="text-center text-sm text-app-text/70">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-neon-cyan hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
