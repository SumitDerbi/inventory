/**
 * Portal mock — client (external customer) users.
 *
 * Three demo organisations bound to existing customer rows by the
 * `companyName` string used across orders / quotations / dispatches.
 * Phase 3 will replace `currentClientUser()` with the portal-JWT
 * subject claim.
 */

export type ClientUserRole = 'primary' | 'viewer' | 'accounts';
export type ClientUserStatus = 'active' | 'invited' | 'disabled';

export interface ClientUser {
    id: string;
    organizationId: string;
    customerId: string;
    /** companyName used to filter portal-side data (matches `companyName` on orders / quotes / dispatches / jobs). */
    companyName: string;
    name: string;
    designation: string;
    email: string;
    mobile: string;
    role: ClientUserRole;
    status: ClientUserStatus;
    lastLogin: string; // ISO
}

export interface ClientOrganization {
    id: string;
    name: string;
    legalName: string;
    customerId: string;
    companyName: string;
    gstNumber?: string;
    address: string;
    primaryContact: string;
}

const today = Date.now();
const iso = (offsetDays: number, hour = 10): string => {
    const d = new Date(today + offsetDays * 86_400_000);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
};

export const clientOrganizations: ClientOrganization[] = [
    {
        id: 'org-001',
        name: 'Patel Engineering',
        legalName: 'Patel Engineering Ltd.',
        customerId: 'cust-001',
        companyName: 'Patel Engineering Ltd.',
        gstNumber: '24AAACP1234A1Z5',
        address: 'Plot 12, Industrial Area, Ahmedabad, Gujarat',
        primaryContact: 'Rajesh Patel',
    },
    {
        id: 'org-002',
        name: 'GreenLeaf Pharma',
        legalName: 'GreenLeaf Pharmaceuticals Pvt Ltd',
        customerId: 'cust-006',
        companyName: 'GreenLeaf Pharma',
        gstNumber: '24AABCG5678B1Z9',
        address: 'GIDC Phase II, Ankleshwar, Gujarat',
        primaryContact: 'Neha Verma',
    },
    {
        id: 'org-003',
        name: 'Surat Textile Mills',
        legalName: 'Surat Textile Mills Pvt Ltd',
        customerId: 'cust-008',
        companyName: 'Surat Textile Mills',
        gstNumber: '24AABCS9012C1Z2',
        address: 'Pandesara GIDC, Surat, Gujarat',
        primaryContact: 'Anil Joshi',
    },
];

export const clientUsers: ClientUser[] = [
    {
        id: 'cu-001',
        organizationId: 'org-001',
        customerId: 'cust-001',
        companyName: 'Patel Engineering Ltd.',
        name: 'Rajesh Patel',
        designation: 'Procurement Head',
        email: 'rajesh@patel-eng.com',
        mobile: '+91-9824012345',
        role: 'primary',
        status: 'active',
        lastLogin: iso(-1),
    },
    {
        id: 'cu-002',
        organizationId: 'org-001',
        customerId: 'cust-001',
        companyName: 'Patel Engineering Ltd.',
        name: 'Sandeep Mehta',
        designation: 'Accounts Manager',
        email: 'accounts@patel-eng.com',
        mobile: '+91-9824099911',
        role: 'accounts',
        status: 'active',
        lastLogin: iso(-3),
    },
    {
        id: 'cu-003',
        organizationId: 'org-002',
        customerId: 'cust-006',
        companyName: 'GreenLeaf Pharma',
        name: 'Neha Verma',
        designation: 'Project Lead',
        email: 'neha@greenleaf.in',
        mobile: '+91-9712334455',
        role: 'primary',
        status: 'active',
        lastLogin: iso(0, 9),
    },
    {
        id: 'cu-004',
        organizationId: 'org-002',
        customerId: 'cust-006',
        companyName: 'GreenLeaf Pharma',
        name: 'Site Engineer',
        designation: 'Project Engineer',
        email: 'site@greenleaf.in',
        mobile: '+91-9712334466',
        role: 'viewer',
        status: 'invited',
        lastLogin: iso(-30),
    },
    {
        id: 'cu-005',
        organizationId: 'org-003',
        customerId: 'cust-008',
        companyName: 'Surat Textile Mills',
        name: 'Anil Joshi',
        designation: 'Plant Head',
        email: 'anil@surat-textiles.com',
        mobile: '+91-9825001234',
        role: 'primary',
        status: 'active',
        lastLogin: iso(-2),
    },
    {
        id: 'cu-006',
        organizationId: 'org-003',
        customerId: 'cust-008',
        companyName: 'Surat Textile Mills',
        name: 'Priya Sharma',
        designation: 'Procurement',
        email: 'priya@surat-textiles.com',
        mobile: '+91-9825005678',
        role: 'viewer',
        status: 'active',
        lastLogin: iso(-7),
    },
];

export function clientUserById(id: string): ClientUser | undefined {
    return clientUsers.find((u) => u.id === id);
}

export function organizationById(id: string): ClientOrganization | undefined {
    return clientOrganizations.find((o) => o.id === id);
}

/** Default mock current portal user (org-001). Demo-only — Phase 3 swaps for the JWT subject. */
export const DEFAULT_PORTAL_USER_ID = 'cu-001';

let _currentClientUserId: string = DEFAULT_PORTAL_USER_ID;

export function currentClientUser(): ClientUser {
    return clientUserById(_currentClientUserId) ?? clientUsers[0];
}

export function setCurrentClientUserId(id: string): void {
    _currentClientUserId = id;
}

export function currentOrganization(): ClientOrganization {
    const user = currentClientUser();
    return organizationById(user.organizationId) ?? clientOrganizations[0];
}
