import type { Metadata } from 'next';
import {
  Cinzel_Decorative,
  Lora,
  Orbitron,
  Exo_2,
  Caveat,
  Playfair_Display,
  Crimson_Pro,
} from 'next/font/google';
import './globals.css';

const cinzelDecorative = Cinzel_Decorative({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-cinzel',
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
});

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
});

const exo2 = Exo_2({
  subsets: ['latin'],
  variable: '--font-exo2',
});

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  variable: '--font-crimson',
  weight: ['400', '600'],
});

export const metadata: Metadata = {
  title: 'The Magical World',
  description: 'A magical place where your voice creates wonders',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={[
        cinzelDecorative.variable,
        lora.variable,
        orbitron.variable,
        exo2.variable,
        caveat.variable,
        playfairDisplay.variable,
        crimsonPro.variable,
        'h-full antialiased',
      ].join(' ')}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
