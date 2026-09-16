import Link from 'next/link';
import { Flame, Instagram, Twitter, Facebook } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-app-surface border-t border-electric-pink/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="col-span-1 sm:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Flame className="h-6 w-6 sm:h-8 sm:w-8 text-electric-pink" />
              <span className="text-lg sm:text-xl font-bold bg-neon-gradient bg-clip-text text-transparent">
                NightVibe
              </span>
            </Link>
            <p className="text-app-text/70 max-w-md text-sm sm:text-base">
              Connect with the best DJs, discover amazing clubs, and share your epic nightlife moments. 
              The ultimate social platform for night owls.
            </p>
            <div className="flex space-x-4 mt-4 sm:mt-6">
              <a href="#" className="text-app-text/60 hover:text-electric-pink transition-colors">
                <Instagram className="h-5 w-5 sm:h-6 sm:w-6" />
              </a>
              <a href="#" className="text-app-text/60 hover:text-electric-pink transition-colors">
                <Twitter className="h-5 w-5 sm:h-6 sm:w-6" />
              </a>
              <a href="#" className="text-app-text/60 hover:text-electric-pink transition-colors">
                <Facebook className="h-5 w-5 sm:h-6 sm:w-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-electric-pink">Explore</h3>
            <ul className="space-y-1 sm:space-y-2">
              <li><Link href="/djs" className="text-sm sm:text-base text-app-text/70 hover:text-electric-pink transition-colors">Top DJs</Link></li>
              <li><Link href="/clubs" className="text-sm sm:text-base text-app-text/70 hover:text-electric-pink transition-colors">Best Clubs</Link></li>
              <li><Link href="/leaderboard" className="text-sm sm:text-base text-app-text/70 hover:text-electric-pink transition-colors">Leaderboard</Link></li>
              <li><Link href="/moments" className="text-sm sm:text-base text-app-text/70 hover:text-electric-pink transition-colors">Moments</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-neon-cyan">Support</h3>
            <ul className="space-y-1 sm:space-y-2">
              <li><Link href="/help/account" className="text-sm sm:text-base text-app-text/70 hover:text-neon-cyan transition-colors">Help Center</Link></li>
              <li><Link href="/privacy" className="text-sm sm:text-base text-app-text/70 hover:text-neon-cyan transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm sm:text-base text-app-text/70 hover:text-neon-cyan transition-colors">Terms of Service</Link></li>
              <li><Link href="/contact" className="text-sm sm:text-base text-app-text/70 hover:text-neon-cyan transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-electric-pink/20 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center">
          <p className="text-xs sm:text-sm text-app-text/60">
            © 2025 NightVibe. All rights reserved. Made with ❤️ for the nightlife community.
          </p>
        </div>
      </div>
    </footer>
  );
}
