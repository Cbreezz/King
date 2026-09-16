import NextAuth from "next-auth/next";
import { authOptions } from "./auth-options";

// This is needed to prevent caching of the authentication routes
export const dynamic = 'force-dynamic';

/**
 * Create the authentication handler
 * @see https://next-auth.js.org/configuration/initialization#route-handlers-app
 */
const handler = NextAuth(authOptions);

// Export the handler for both GET and POST requests
export { handler as GET, handler as POST };
