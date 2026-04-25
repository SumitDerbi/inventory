export interface ActiveSession {
    id: string;
    device: string;
    browser: string;
    os: string;
    ip: string;
    location: string;
    lastSeenAt: string;
    current: boolean;
}

export const activeSessions: ActiveSession[] = [
    {
        id: 'sess-1',
        device: 'Windows PC',
        browser: 'Chrome 131',
        os: 'Windows 11',
        ip: '203.0.113.42',
        location: 'Surat, IN',
        lastSeenAt: new Date().toISOString(),
        current: true,
    },
    {
        id: 'sess-2',
        device: 'iPhone 15',
        browser: 'Safari 17',
        os: 'iOS 18',
        ip: '198.51.100.18',
        location: 'Ahmedabad, IN',
        lastSeenAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        current: false,
    },
    {
        id: 'sess-3',
        device: 'MacBook Pro',
        browser: 'Firefox 132',
        os: 'macOS 15',
        ip: '192.0.2.91',
        location: 'Mumbai, IN',
        lastSeenAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        current: false,
    },
    {
        id: 'sess-4',
        device: 'Android Tablet',
        browser: 'Chrome 130',
        os: 'Android 14',
        ip: '203.0.113.77',
        location: 'Pune, IN',
        lastSeenAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
        current: false,
    },
    {
        id: 'sess-5',
        device: 'Windows PC',
        browser: 'Edge 129',
        os: 'Windows 10',
        ip: '198.51.100.203',
        location: 'Vadodara, IN',
        lastSeenAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        current: false,
    },
];
