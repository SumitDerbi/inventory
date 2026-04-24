export interface MockUser {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'sales_manager' | 'sales_executive' | 'inventory' | 'dispatch';
}

export const users: MockUser[] = [
    { id: 'u-1', name: 'Aarav Mehta', email: 'aarav@firm.in', role: 'sales_executive' },
    { id: 'u-2', name: 'Diya Kapoor', email: 'diya@firm.in', role: 'sales_executive' },
    { id: 'u-3', name: 'Rohan Iyer', email: 'rohan@firm.in', role: 'sales_manager' },
    { id: 'u-4', name: 'Saanvi Rao', email: 'saanvi@firm.in', role: 'sales_executive' },
    { id: 'u-5', name: 'Vihaan Shah', email: 'vihaan@firm.in', role: 'admin' },
    { id: 'u-6', name: 'Priya Nair', email: 'priya@firm.in', role: 'inventory' },
    { id: 'u-7', name: 'Kabir Desai', email: 'kabir@firm.in', role: 'dispatch' },
];

export function userById(id: string | null | undefined): MockUser | undefined {
    if (!id) return undefined;
    return users.find((u) => u.id === id);
}
