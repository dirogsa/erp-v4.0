import React from 'react';

/**
 * StatusIndicator - Resuable Design System Component for DIROGSA Tech Industrial
 * Used for alerts, warnings, system status, and feedback.
 * 
 * @param {string} type - 'loading' | 'warning' | 'error' | 'success' | 'info'
 * @param {string} label - Primary tech text
 * @param {string} description - Secondary sub-text
 * @param {boolean} showScanline - Whether to show the terminal scanline effect
 */
const StatusIndicator = ({ 
    type = 'info', 
    label, 
    description, 
    showScanline = true,
    className = "" 
}) => {
    const config = {
        loading: {
            bg: 'bg-brand-primary/10',
            border: 'border-brand-primary/30',
            text: 'text-brand-primary',
            glow: 'glow-emerald',
            badge: 'bg-brand-primary',
            badgeText: 'Syncing',
            icon: (
                <svg className="h-5 w-5 animate-spin text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )
        },
        warning: {
            bg: 'bg-brand-warning/10',
            border: 'border-brand-warning/30',
            text: 'text-brand-warning',
            glow: 'glow-amber',
            badge: 'bg-brand-warning',
            badgeText: 'Alert',
            icon: (
                <svg className="h-5 w-5 text-brand-warning" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
            )
        },
        error: {
            bg: 'bg-brand-danger/10',
            border: 'border-brand-danger/30',
            text: 'text-brand-danger',
            glow: 'glow-red',
            badge: 'bg-brand-danger',
            badgeText: 'Critical',
            icon: (
                <svg className="h-5 w-5 text-brand-danger" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
            )
        },
        success: {
            bg: 'bg-brand-primary/10',
            border: 'border-brand-primary/30',
            text: 'text-brand-primary',
            glow: 'glow-emerald',
            badge: 'bg-brand-primary',
            badgeText: 'Verified',
            icon: (
                <svg className="h-5 w-5 text-brand-primary" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        info: {
            bg: 'bg-brand-accent/5',
            border: 'border-brand-accent/20',
            text: 'text-brand-accent',
            glow: 'glow-accent',
            badge: 'bg-brand-accent',
            badgeText: 'System',
            icon: (
                <svg className="h-5 w-5 text-brand-accent" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
            )
        }
    };

    const current = config[type] || config.info;

    return (
        <div className={`relative overflow-hidden ${current.bg} backdrop-blur-md border ${current.border} rounded-2xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500 ring-1 ring-white/5 ${current.glow} ${className}`}>
            {/* Pulsing Icon Backdrop */}
            <div className="relative flex h-10 w-10 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-xl ${current.badge} opacity-20`}></span>
                <div className={`relative h-10 w-10 bg-brand-bg/60 rounded-xl flex items-center justify-center border ${current.border}`}>
                    {current.icon}
                </div>
            </div>
            
            <div className="flex-1">
                <div className="flex items-center gap-3">
                    <p className={`text-brand-sm font-black uppercase tracking-wider ${current.text} drop-shadow-md`}>
                        {label}
                    </p>
                    <span className={`px-2 py-0.5 ${current.badge} text-brand-bg text-brand-xs font-black rounded-md animate-pulse uppercase tracking-tighter`}>
                        {current.badgeText}
                    </span>
                </div>
                {description && (
                    <p className="text-brand-xs uppercase font-bold text-brand-text-muted leading-tight tracking-widest mt-1.5">
                        {description}
                    </p>
                )}
            </div>

            {/* Scanline Effect Overlay */}
            {showScanline && <div className="tech-scanline" />}
        </div>
    );
};

export default StatusIndicator;
