import type { Metadata } from "next";
import "./globals.css";
// import Providers from "./providers";
import { Toaster } from "@/components/ui/sonner";
import Providers from "./providers";
import SessionProviders from "./SessionProviders";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import ConsoleFilter from "@/components/ConsoleFilter";

export const metadata: Metadata = {
  title: "Plentiful Knowledge",
  description: "Make Better Decisions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                
                // Capture console methods immediately - must be first thing
                var originalWarn = console.warn;
                var originalError = console.error;
                var originalLog = console.log;
                var originalInfo = console.info;
                
                function shouldSuppress(message) {
                  if (!message) return false;
                  var msg = String(message);
                  
                  // Suppress Facebook XSS security warnings
                  if (
                    msg.includes("This is a browser feature intended for developers") ||
                    msg.includes("facebook.com/selfxss") ||
                    msg.includes("Stop!") ||
                    (msg.includes("browser feature") && msg.includes("developers"))
                  ) {
                    return true;
                  }
                  
                  // Suppress Permissions Policy violations for unload (catch all variations)
                  if (
                    msg.includes("Permissions policy violation") ||
                    msg.includes("Permissions-Policy") ||
                    (msg.includes("violation") && msg.includes("unload")) ||
                    msg.includes("unload is not allowed") ||
                    (msg.includes("unload") && msg.includes("not allowed"))
                  ) {
                    return true;
                  }
                  
                  return false;
                }
                
                // Override console methods - intercept all console output
                console.warn = function() {
                  var msg = arguments[0];
                  if (!shouldSuppress(msg)) {
                    originalWarn.apply(console, arguments);
                  }
                };
                
                console.error = function() {
                  var msg = arguments[0];
                  if (!shouldSuppress(msg)) {
                    originalError.apply(console, arguments);
                  }
                };
                
                console.log = function() {
                  var msg = arguments[0];
                  if (!shouldSuppress(msg)) {
                    originalLog.apply(console, arguments);
                  }
                };
                
                console.info = function() {
                  var msg = arguments[0];
                  if (!shouldSuppress(msg)) {
                    originalInfo.apply(console, arguments);
                  }
                };
                
                // Also intercept browser's native violation reporting
                if (window.ReportingObserver) {
                  try {
                    var observer = new ReportingObserver(function(reports) {
                      // Suppress unload violation reports
                      reports.forEach(function(report) {
                        if (report.body && typeof report.body === 'object') {
                          var bodyMsg = String(report.body.message || '');
                          if (shouldSuppress(bodyMsg)) {
                            return; // Suppress this report
                          }
                        }
                      });
                    }, {types: ['violation'], buffered: true});
                    observer.observe();
                  } catch(e) {
                    // ReportingObserver not supported, ignore
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body className={` antialiased`} suppressHydrationWarning>
        <ConsoleFilter />
        <GoogleAnalytics />
        <SessionProviders>
          <Providers>{children}</Providers>
        </SessionProviders>
        <Toaster closeButton />
      </body>
    </html>
  );
}
