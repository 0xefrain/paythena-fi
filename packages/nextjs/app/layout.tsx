import "@rainbow-me/rainbowkit/styles.css";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { Footer } from "~~/components/Footer";
import { Header } from "~~/components/Header";
import { ThemeProvider } from "~~/components/ThemeProvider";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = {
  title: 'Paythena - Web3 Payroll Solutions',
  description: 'Decentralized payroll system built on Ethena Protocol',
  icons: {
    icon: '/favicon.ico',
  },
};

const PaythenaApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider enableSystem>
          <ScaffoldEthAppWithProviders>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="relative flex flex-col flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </ScaffoldEthAppWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default PaythenaApp;
