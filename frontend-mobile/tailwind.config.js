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
                    text:      'var(--brand-text)',
                    'text-2':  'var(--brand-text-2)',
                    muted:     'var(--brand-muted)',
                    border:    'var(--brand-border)',
                    'border-2':'var(--brand-border-2)',
                },
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
            },
        },
    },
    plugins: [],
}
