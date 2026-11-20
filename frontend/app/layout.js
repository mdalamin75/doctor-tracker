import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource-variable/fraunces";
import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: { default: "Doctor Tracker", template: "%s · Doctor Tracker" },
  description: "Secure admin portal for managing doctors, their patients and clinical analytics.",
  robots: { index: false, follow: false },
};

export const viewport = { themeColor: "#1f3a3f", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
