/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    primary:   'var(--brand-primary)',
                    accent:    'var(--brand-accent)',
                    orange:    'var(--brand-orange)',
                    bg:        'var(--brand-bg)',
                    surface:   'var(--brand-surface)',
                    'surface-2': 'var(--brand-surface-2)',
                    'surface-3': 'var(--brand-surface-3)',
                    text:      'var(--brand-text)',
                    'text-muted': 'var(--brand-text-muted)',
                    'text-dim':  'var(--brand-text-dim)',
                    muted:     'var(--brand-text-muted)',
                    border:    'var(--brand-border)',
                    'border-2':'var(--brand-border-2)',
                },
            },
            fontSize: {
                'brand-xs': 'var(--font-size-xs)',
                'brand-sm': 'var(--font-size-sm)',
                'brand-md': 'var(--font-size-md)',
                'brand-lg': 'var(--font-size-lg)',
                'brand-xl': 'var(--font-size-xl)',
                'brand-2xl': 'var(--font-size-2xl)',
            },
            boxShadow: {
                'glow-primary': 'var(--glow-primary)',
                'glow-accent':  'var(--glow-accent)',
                'card':         '0 4px 32px rgba(0,0,0,0.4)',
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'sans-serif'],
            },
            animation: {
                'pulse-ring': 'pulse-ring 2s ease-out infinite',
                'scan':       'scan 3s ease-in-out infinite',
                'breathe':    'breathe 3s ease-in-out infinite',
                'float':      'float 3s ease-in-out infinite',
                'shimmer':    'shimmer 1.5s infinite',
                'spin-slow':  'spin 3s linear infinite',
            },
        },
    },
    plugins: [],
}
