import "./globals.css";

export const metadata = {
  title: "Sewa HT Ku - Rental HT",
  description: "Solusi komunikasi terbaik untuk segala jenis acara Anda. Sewa HT berkualitas, sinyal jernih, dan harga terjangkau.",
};

import { Toaster } from 'sonner';

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/assets/logo.png" />
      </head>
      <body>
        <Toaster position="top-center" richColors />
        {children}
      </body>
    </html>
  );
}
