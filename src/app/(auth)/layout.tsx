import Link from "next/link";

export const metadata = {
  title: 'Authentication - Nakshatra',
  description: 'Login or sign up to access Nakshatra platform',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Auth pages header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-gray-700">
                Nakshatra
              </Link>
            </div>
            <div className="text-sm text-gray-600">
              <Link href="/" className="hover:text-gray-900 transition-colors">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main auth content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Auth pages footer */}
      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-600">
            <p>© 2024 Nakshatra. All rights reserved.</p>
            <div className="mt-2 space-x-4">
              <a href="/privacy" className="hover:text-gray-900">Privacy Policy</a>
              <a href="/terms" className="hover:text-gray-900">Terms of Service</a>
              <a href="/support" className="hover:text-gray-900">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}