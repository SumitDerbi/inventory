export type TwoFactorMethod = 'totp';

export interface TwoFactorState {
    enabled: boolean;
    method: TwoFactorMethod | null;
    enrolledAt: string | null;
}

export const twoFactor: TwoFactorState = {
    enabled: false,
    method: null,
    enrolledAt: null,
};

export interface Enable2FAResult {
    secret: string;
    otpauth: string;
    recoveryCodes: string[];
}

const SAMPLE_SECRET = 'JBSWY3DPEHPK3PXP';

function genRecoveryCodes(): string[] {
    const codes: string[] = [];
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let i = 0; i < 8; i++) {
        let part1 = '';
        let part2 = '';
        for (let j = 0; j < 4; j++) {
            part1 += chars[Math.floor(Math.random() * chars.length)];
            part2 += chars[Math.floor(Math.random() * chars.length)];
        }
        codes.push(`${part1}-${part2}`);
    }
    return codes;
}

let pendingRecovery: string[] = [];

export function enable2FA(): Enable2FAResult {
    pendingRecovery = genRecoveryCodes();
    return {
        secret: SAMPLE_SECRET,
        otpauth:
            'otpauth://totp/Inventory:demo@example.com?secret=' +
            SAMPLE_SECRET +
            '&issuer=Inventory',
        recoveryCodes: pendingRecovery,
    };
}

export function confirm2FA(code: string): { ok: boolean; error?: string } {
    if (!/^\d{6}$/.test(code)) {
        return { ok: false, error: 'Enter a 6-digit code.' };
    }
    if (code !== '123456') {
        return { ok: false, error: 'Code is incorrect. Try 123456 in this demo.' };
    }
    twoFactor.enabled = true;
    twoFactor.method = 'totp';
    twoFactor.enrolledAt = new Date().toISOString();
    return { ok: true };
}

export function disable2FA(password: string): { ok: boolean; error?: string } {
    if (password !== 'password123') {
        return { ok: false, error: 'Password is incorrect.' };
    }
    twoFactor.enabled = false;
    twoFactor.method = null;
    twoFactor.enrolledAt = null;
    pendingRecovery = [];
    return { ok: true };
}

export function regenerateRecoveryCodes(): string[] {
    pendingRecovery = genRecoveryCodes();
    return pendingRecovery;
}

export function getRecoveryCodes(): string[] {
    return pendingRecovery;
}
