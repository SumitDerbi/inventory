export type UserRole =
    | 'admin'
    | 'sales_manager'
    | 'sales_executive'
    | 'inventory'
    | 'dispatch'
    | 'engineer'
    | 'accounts';

export interface MockUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    mobile?: string;
    employeeCode?: string;
    department?: string;
    designation?: string;
    active?: boolean;
    lastLoginAt?: string;
    notes?: string;
    avatarColor?: string;
}

export const ROLE_LABEL: Record<UserRole, string> = {
    admin: 'Administrator',
    sales_manager: 'Sales Manager',
    sales_executive: 'Sales Executive',
    inventory: 'Inventory',
    dispatch: 'Dispatch',
    engineer: 'Engineer',
    accounts: 'Accounts',
};

export const ROLE_TONE: Record<UserRole, 'red' | 'violet' | 'blue' | 'amber' | 'emerald' | 'sky' | 'indigo'> = {
    admin: 'red',
    sales_manager: 'violet',
    sales_executive: 'blue',
    inventory: 'amber',
    dispatch: 'emerald',
    engineer: 'sky',
    accounts: 'indigo',
};

export const DEPARTMENTS = [
    'Sales',
    'Inventory',
    'Dispatch',
    'Service',
    'Accounts',
    'Operations',
] as const;

export const users: MockUser[] = [
    {
        id: 'u-1',
        name: 'Aarav Mehta',
        email: 'aarav@firm.in',
        role: 'sales_executive',
        mobile: '+91 98200 11201',
        employeeCode: 'EMP-1001',
        department: 'Sales',
        designation: 'Sr. Sales Executive',
        active: true,
        lastLoginAt: '2026-04-24T10:14:00Z',
    },
    {
        id: 'u-2',
        name: 'Diya Kapoor',
        email: 'diya@firm.in',
        role: 'sales_executive',
        mobile: '+91 98200 11202',
        employeeCode: 'EMP-1002',
        department: 'Sales',
        designation: 'Sales Executive',
        active: true,
        lastLoginAt: '2026-04-25T08:02:00Z',
    },
    {
        id: 'u-3',
        name: 'Rohan Iyer',
        email: 'rohan@firm.in',
        role: 'sales_manager',
        mobile: '+91 98200 11203',
        employeeCode: 'EMP-1003',
        department: 'Sales',
        designation: 'Sales Manager — West',
        active: true,
        lastLoginAt: '2026-04-25T09:33:00Z',
    },
    {
        id: 'u-4',
        name: 'Saanvi Rao',
        email: 'saanvi@firm.in',
        role: 'sales_executive',
        mobile: '+91 98200 11204',
        employeeCode: 'EMP-1004',
        department: 'Sales',
        designation: 'Sales Executive',
        active: false,
        lastLoginAt: '2026-03-30T11:18:00Z',
        notes: 'On long leave — disabled until June.',
    },
    {
        id: 'u-5',
        name: 'Vihaan Shah',
        email: 'vihaan@firm.in',
        role: 'admin',
        mobile: '+91 98200 11205',
        employeeCode: 'EMP-1005',
        department: 'Operations',
        designation: 'Operations Head',
        active: true,
        lastLoginAt: '2026-04-25T08:48:00Z',
    },
    {
        id: 'u-6',
        name: 'Priya Nair',
        email: 'priya@firm.in',
        role: 'inventory',
        mobile: '+91 98200 11206',
        employeeCode: 'EMP-1006',
        department: 'Inventory',
        designation: 'Inventory Lead',
        active: true,
        lastLoginAt: '2026-04-25T07:12:00Z',
    },
    {
        id: 'u-7',
        name: 'Kabir Desai',
        email: 'kabir@firm.in',
        role: 'dispatch',
        mobile: '+91 98200 11207',
        employeeCode: 'EMP-1007',
        department: 'Dispatch',
        designation: 'Dispatch Supervisor',
        active: true,
        lastLoginAt: '2026-04-24T17:45:00Z',
    },
    {
        id: 'u-8',
        name: 'Manish Patel',
        email: 'manish@firm.in',
        role: 'engineer',
        mobile: '+91 98200 11208',
        employeeCode: 'EMP-1008',
        department: 'Service',
        designation: 'Field Engineer',
        active: true,
        lastLoginAt: '2026-04-25T06:30:00Z',
    },
    {
        id: 'u-9',
        name: 'Ritika Sharma',
        email: 'ritika@firm.in',
        role: 'engineer',
        mobile: '+91 98200 11209',
        employeeCode: 'EMP-1009',
        department: 'Service',
        designation: 'Sr. Field Engineer',
        active: true,
        lastLoginAt: '2026-04-24T19:21:00Z',
    },
    {
        id: 'u-10',
        name: 'Arjun Joshi',
        email: 'arjun@firm.in',
        role: 'engineer',
        mobile: '+91 98200 11210',
        employeeCode: 'EMP-1010',
        department: 'Service',
        designation: 'Field Engineer',
        active: false,
        lastLoginAt: '2026-04-12T14:08:00Z',
    },
    {
        id: 'u-11',
        name: 'Neha Gupta',
        email: 'neha@firm.in',
        role: 'accounts',
        mobile: '+91 98200 11211',
        employeeCode: 'EMP-1011',
        department: 'Accounts',
        designation: 'Accounts Manager',
        active: true,
        lastLoginAt: '2026-04-25T09:01:00Z',
    },
];

export const CURRENT_USER_ID = 'u-5';


export function userById(id: string | null | undefined): MockUser | undefined {
    if (!id) return undefined;
    return users.find((u) => u.id === id);
}
