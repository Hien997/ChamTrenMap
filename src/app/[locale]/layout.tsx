import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckInQueueSync } from "@/components/checkin/CheckInQueueSync";
import { SiteAnalytics } from "@/components/layout/SiteAnalytics";
import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/i18n/routing";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "vietnamese"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "vietnamese"],
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export const generateStaticParams = () => {
  return routing.locales.map((locale) => ({ locale }));
};

/**
 * PWA chrome: the address-bar colour on Android/Chrome and the install prompt
 * swatch. Kept neutral so it follows `bg-background` in both themes rather than
 * announcing a colour the dark theme then contradicts.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const generateMetadata = async ({
  params,
}: Omit<Props, "children">): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
};

const LocaleLayout = async ({ children, params }: Props) => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Inside the provider: this component renders toasts in the active locale. */}
        <NextIntlClientProvider>
          {children}
          <CheckInQueueSync />
        </NextIntlClientProvider>
        <Toaster position="top-center" />
        {/* Only on Vercel: elsewhere the insights script route is a 404. */}
        {process.env.VERCEL ? <SiteAnalytics /> : null}
      </body>
    </html>
  );
};

export default LocaleLayout;
