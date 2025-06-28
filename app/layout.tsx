import { Inter } from "next/font/google";
import AlertNotifier from "../components/AlertNotifier";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-gray-100 text-gray-800 min-h-screen">
        <AlertNotifier />
        {children}
      </body>
    </html>
  );
}
