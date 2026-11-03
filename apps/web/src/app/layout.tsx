import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Barbearia Prime',
    description: 'Gestão e atendimento da Barbearia Prime.',
    icons: { icon: '/logo2.png' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
    return <html lang="pt-BR"><body>{children}</body></html>;
}
