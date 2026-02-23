'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Moon, Sun, Menu, X, Flame, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InstallAppButton } from '@/components/install-app-button';

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  // Handle scroll event to add shadow/background to navbar when scrolled
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/djs', label: 'DJs' },
    { href: '/clubs', label: 'Clubs' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/moments', label: 'Moments' },
    { href: '/events', label: 'Events' },
  ];

  const authLinks = [
    { href: '/profile', label: 'Profile' },
    ...(user?.role === 'DJ' ? [{ href: '/dj/dashboard', label: 'DJ Dashboard' }] : [{ href: '/dashboard', label: 'Dashboard' }]),
    { href: '/settings', label: 'Settings' },
  ];

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <nav className={`sticky top-0 z-50 w-full border-b border-border/40 backdrop-blur ${
      scrolled ? 'bg-background/95 supports-[backdrop-filter]:bg-background/60 shadow-sm' : 'bg-background/80'
    }`}>
      <div className="container px-4 sm:px-6 flex h-14 sm:h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-electric-pink" />
            <span className="hidden font-bold sm:inline-block">
              NightVibe
            </span>
          </Link>
          <nav className="flex items-center space-x-4 sm:space-x-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors hover:text-foreground/80 ${
                  pathname === link.href ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                href="/moments/upload"
                className="text-foreground/60 transition-colors hover:text-foreground/80"
              >
                Upload
              </Link>
            )}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Mobile logo */}
            <Link href="/" className="flex items-center space-x-2 md:hidden">
              <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-electric-pink" />
              <span className="font-bold text-sm sm:text-base">NightVibe</span>
            </Link>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Install App Button */}
            <InstallAppButton />
            
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="hover:bg-electric-pink/10 h-8 w-8 p-0"
            >
              <Sun className="h-[1.1rem] w-[1.1rem] sm:h-[1.2rem] sm:w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.1rem] w-[1.1rem] sm:h-[1.2rem] sm:w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Auth buttons */}
            <div className="hidden md:flex items-center space-x-2">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
                        <AvatarFallback>{userInitials}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {authLinks.map((link) => (
                      <DropdownMenuItem key={link.href} asChild>
                        <Link href={link.href}>{link.label}</Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => logout()}
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="hover:bg-electric-pink/10">
                      Login
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="glow-button text-xs sm:text-sm py-1 px-3 h-auto sm:h-9">
                      Join the Nightlife
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden hover:bg-electric-pink/10 h-8 w-8 p-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 top-14 sm:top-16 z-50 grid h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto p-4 sm:p-6 pb-24 shadow-md animate-in slide-in-from-bottom-80 md:hidden">
            <div className="relative z-20 grid gap-4 sm:gap-6 rounded-md bg-popover p-4 text-popover-foreground shadow-md">
              <nav className="grid grid-flow-row auto-rows-max text-sm">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex w-full items-center rounded-md p-2 text-sm font-medium hover:underline ${
                      pathname === link.href ? 'text-foreground' : 'text-foreground/60'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/moments/upload"
                      className="flex w-full items-center rounded-md p-2 text-sm font-medium text-foreground/60 hover:underline"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Upload
                    </Link>
                    {authLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex w-full items-center rounded-md p-2 text-sm font-medium text-foreground/60 hover:underline"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                    <button
                      className="flex w-full items-center rounded-md p-2 text-sm font-medium text-foreground/60 hover:underline"
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="flex w-full items-center rounded-md p-2 text-sm font-medium text-foreground/60 hover:underline"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="flex w-full items-center rounded-md p-2 text-sm font-medium text-foreground/60 hover:underline"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Join the Nightlife
                    </Link>

                    {/* Install App Option in Mobile Menu */}
                    <button
                      className="flex w-full items-center rounded-md p-2 text-sm font-medium text-foreground/60 hover:underline"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        // We'll trigger the install dialog after a short delay to allow the mobile menu to close
                        setTimeout(() => {
                          document.dispatchEvent(new CustomEvent('openPwaInstallPrompt'));
                        }, 300);
                      }}
                    >
                      Install App
                    </button>
                  </>
                )}
              </nav>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
