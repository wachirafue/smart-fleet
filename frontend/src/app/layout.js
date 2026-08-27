/**
 * src/app/layout.js - Root layout for Next.js app
 */
import "./globals.css";

export const metadata = {
  title: "Smart Fleet Management",
  description: "Real-time IoT Fleet Management Dashboard",
  manifest: "/manifest.json",
  themeColor: "#0f172a",

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SmartFleet",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-slate-900 text-slate-100">
        {/* Navigation Header */}
        <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-wide leading-none">
                    SmartFleet
                  </h1>
                  <p className="text-sm text-slate-400 mt-0.5 leading-none">Management System</p>
                </div>
              </a>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-slate-400 hidden sm:inline">Live</span>
                </div>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800 py-4 mt-8">
          <p className="text-center text-xs text-slate-600">
            Smart Fleet Management System &copy; {new Date().getFullYear()}
          </p>
        </footer>
      </body>
    </html>
  );
}
