export interface VendorContact {
    id: string;
    name: string;
    designation: string;
    phone: string;
    email: string;
    isPrimary: boolean;
}

export interface VendorBankDetail {
    id: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    branch: string;
    isPrimary: boolean;
}

export type VendorStatus = 'active' | 'on_hold' | 'blocked';
export type VendorTier = 'A' | 'B' | 'C';

export interface VendorPerformance {
    onTimePct: number;
    qualityPct: number;
    avgLeadDays: number;
    rejectionPct: number;
    spendYTD: number; // INR
    poCount: number;
    lastPoAt: string | null;
}

export interface Vendor {
    id: string;
    code: string; // V-001
    name: string;
    legalName: string;
    gstin: string;
    pan: string;
    msmeNumber?: string;
    category: string;
    paymentTermsDays: number;
    creditLimit: number;
    currency: 'INR' | 'USD' | 'EUR';
    placeOfSupply: string; // state
    state: string;
    address: string;
    status: VendorStatus;
    tier: VendorTier;
    contacts: VendorContact[];
    bankDetails: VendorBankDetail[];
    performance: VendorPerformance;
    notes?: string;
    createdAt: string;
}

export const VENDOR_STATUS_LABEL: Record<VendorStatus, string> = {
    active: 'Active',
    on_hold: 'On hold',
    blocked: 'Blocked',
};

export const VENDOR_STATUS_TONE: Record<VendorStatus, 'emerald' | 'amber' | 'red'> = {
    active: 'emerald',
    on_hold: 'amber',
    blocked: 'red',
};

export const VENDOR_TIER_TONE: Record<VendorTier, 'emerald' | 'sky' | 'neutral'> = {
    A: 'emerald',
    B: 'sky',
    C: 'neutral',
};

const TODAY = Date.now();
const iso = (offsetDays: number) =>
    new Date(TODAY + offsetDays * 86_400_000).toISOString();

export const vendors: Vendor[] = [
    {
        id: 'v-001',
        code: 'V-001',
        name: 'Kirloskar Pumps Pvt Ltd',
        legalName: 'Kirloskar Pumps Private Limited',
        gstin: '27AAACK1234B1Z5',
        pan: 'AAACK1234B',
        msmeNumber: 'UDYAM-MH-12-0012345',
        category: 'Pumps',
        paymentTermsDays: 45,
        creditLimit: 5000000,
        currency: 'INR',
        placeOfSupply: 'Maharashtra',
        state: 'Maharashtra',
        address: 'Plot 27, MIDC Industrial Area, Pune — 411019',
        status: 'active',
        tier: 'A',
        contacts: [
            { id: 'vc-001-1', name: 'Sanjay Patil', designation: 'Sales Manager', phone: '+91 98220 11111', email: 'sanjay.patil@kirloskar.com', isPrimary: true },
            { id: 'vc-001-2', name: 'Priya Joshi', designation: 'Account Manager', phone: '+91 98220 11112', email: 'priya.joshi@kirloskar.com', isPrimary: false },
        ],
        bankDetails: [
            { id: 'vb-001-1', bankName: 'HDFC Bank', accountNumber: 'XXXXXXXX1234', ifsc: 'HDFC0000123', branch: 'Pune Main', isPrimary: true },
        ],
        performance: { onTimePct: 94, qualityPct: 98, avgLeadDays: 12, rejectionPct: 1.2, spendYTD: 8420000, poCount: 22, lastPoAt: iso(-4) },
        notes: 'Preferred for centrifugal & submersible pumps. Tier-A approved.',
        createdAt: iso(-720),
    },
    {
        id: 'v-002',
        code: 'V-002',
        name: 'Crompton Greaves Motors',
        legalName: 'Crompton Greaves Consumer Electricals Ltd.',
        gstin: '27AAACC9876D1Z9',
        pan: 'AAACC9876D',
        category: 'Motors',
        paymentTermsDays: 30,
        creditLimit: 3000000,
        currency: 'INR',
        placeOfSupply: 'Maharashtra',
        state: 'Maharashtra',
        address: '5th Floor, Tower B, BKC, Mumbai — 400051',
        status: 'active',
        tier: 'A',
        contacts: [
            { id: 'vc-002-1', name: 'Rajesh Verma', designation: 'Regional Manager', phone: '+91 98220 22221', email: 'rajesh.verma@crompton.in', isPrimary: true },
        ],
        bankDetails: [
            { id: 'vb-002-1', bankName: 'ICICI Bank', accountNumber: 'XXXXXXXX5678', ifsc: 'ICIC0000456', branch: 'Mumbai BKC', isPrimary: true },
        ],
        performance: { onTimePct: 91, qualityPct: 96, avgLeadDays: 14, rejectionPct: 1.8, spendYTD: 4250000, poCount: 14, lastPoAt: iso(-7) },
        createdAt: iso(-610),
    },
    {
        id: 'v-003',
        code: 'V-003',
        name: 'Audco Valves',
        legalName: 'Audco India Limited',
        gstin: '33AAACA5512F1Z7',
        pan: 'AAACA5512F',
        category: 'Valves',
        paymentTermsDays: 60,
        creditLimit: 2500000,
        currency: 'INR',
        placeOfSupply: 'Tamil Nadu',
        state: 'Tamil Nadu',
        address: 'GST Road, Maraimalai Nagar, Chennai — 603209',
        status: 'active',
        tier: 'B',
        contacts: [
            { id: 'vc-003-1', name: 'Hari Krishnan', designation: 'Sales Engineer', phone: '+91 98220 33331', email: 'hari@audco.in', isPrimary: true },
        ],
        bankDetails: [
            { id: 'vb-003-1', bankName: 'SBI', accountNumber: 'XXXXXXXX9012', ifsc: 'SBIN0001234', branch: 'Chennai Industrial', isPrimary: true },
        ],
        performance: { onTimePct: 86, qualityPct: 94, avgLeadDays: 18, rejectionPct: 2.4, spendYTD: 1820000, poCount: 9, lastPoAt: iso(-12) },
        createdAt: iso(-540),
    },
    {
        id: 'v-004',
        code: 'V-004',
        name: 'Jindal Pipes Ltd',
        legalName: 'Jindal SAW Limited',
        gstin: '07AAACJ3456G1Z2',
        pan: 'AAACJ3456G',
        category: 'Piping',
        paymentTermsDays: 30,
        creditLimit: 4000000,
        currency: 'INR',
        placeOfSupply: 'Delhi',
        state: 'Delhi',
        address: 'Jindal Centre, Bhikaji Cama Place, New Delhi — 110066',
        status: 'active',
        tier: 'A',
        contacts: [
            { id: 'vc-004-1', name: 'Amit Goyal', designation: 'Key Account Manager', phone: '+91 98220 44441', email: 'amit.goyal@jindalsaw.com', isPrimary: true },
        ],
        bankDetails: [
            { id: 'vb-004-1', bankName: 'Axis Bank', accountNumber: 'XXXXXXXX3456', ifsc: 'UTIB0000789', branch: 'New Delhi Connaught', isPrimary: true },
        ],
        performance: { onTimePct: 92, qualityPct: 97, avgLeadDays: 10, rejectionPct: 1.5, spendYTD: 6120000, poCount: 18, lastPoAt: iso(-2) },
        createdAt: iso(-820),
    },
    {
        id: 'v-005',
        code: 'V-005',
        name: 'Schneider Electric India',
        legalName: 'Schneider Electric India Pvt Ltd',
        gstin: '29AAACS1199E1Z3',
        pan: 'AAACS1199E',
        category: 'Controls',
        paymentTermsDays: 45,
        creditLimit: 3500000,
        currency: 'INR',
        placeOfSupply: 'Karnataka',
        state: 'Karnataka',
        address: 'IT Park, Whitefield, Bengaluru — 560066',
        status: 'active',
        tier: 'A',
        contacts: [
            { id: 'vc-005-1', name: 'Vidya Bhat', designation: 'Distribution Lead', phone: '+91 98220 55551', email: 'vidya.bhat@se.com', isPrimary: true },
        ],
        bankDetails: [
            { id: 'vb-005-1', bankName: 'Citibank', accountNumber: 'XXXXXXXX7890', ifsc: 'CITI0000010', branch: 'Bengaluru Whitefield', isPrimary: true },
        ],
        performance: { onTimePct: 89, qualityPct: 99, avgLeadDays: 21, rejectionPct: 0.6, spendYTD: 3210000, poCount: 11, lastPoAt: iso(-9) },
        createdAt: iso(-470),
    },
    {
        id: 'v-006',
        code: 'V-006',
        name: 'Sintex Tanks',
        legalName: 'Sintex Plastics Technology Ltd.',
        gstin: '24AAACS6612C1Z1',
        pan: 'AAACS6612C',
        category: 'Tanks',
        paymentTermsDays: 30,
        creditLimit: 1500000,
        currency: 'INR',
        placeOfSupply: 'Gujarat',
        state: 'Gujarat',
        address: 'Kalol-Mehsana Highway, Kalol — 382721',
        status: 'active',
        tier: 'B',
        contacts: [
            { id: 'vc-006-1', name: 'Manish Shah', designation: 'Channel Sales', phone: '+91 98220 66661', email: 'manish.shah@sintex.in', isPrimary: true },
        ],
        bankDetails: [
            { id: 'vb-006-1', bankName: 'HDFC Bank', accountNumber: 'XXXXXXXX2345', ifsc: 'HDFC0000234', branch: 'Kalol', isPrimary: true },
        ],
        performance: { onTimePct: 95, qualityPct: 97, avgLeadDays: 7, rejectionPct: 0.9, spendYTD: 920000, poCount: 6, lastPoAt: iso(-5) },
        createdAt: iso(-380),
    },
    {
        id: 'v-007',
        code: 'V-007',
        name: 'Pentair Filtration',
        legalName: 'Pentair Water India Pvt Ltd.',
        gstin: '24AAACP7723D1Z6',
        pan: 'AAACP7723D',
        category: 'Filtration',
        paymentTermsDays: 60,
        creditLimit: 2200000,
        currency: 'USD',
        placeOfSupply: 'Gujarat',
        state: 'Gujarat',
        address: 'Sarkhej-Sanand Road, Ahmedabad — 382210',
        status: 'active',
        tier: 'B',
        contacts: [
            { id: 'vc-007-1', name: 'Karthik Subramaniam', designation: 'Technical Sales', phone: '+91 98220 77771', email: 'karthik.s@pentair.com', isPrimary: true },
        ],
        bankDetails: [
            { id: 'vb-007-1', bankName: 'Standard Chartered', accountNumber: 'XXXXXXXX6789', ifsc: 'SCBL0036006', branch: 'Ahmedabad', isPrimary: true },
        ],
        performance: { onTimePct: 82, qualityPct: 96, avgLeadDays: 28, rejectionPct: 1.1, spendYTD: 1640000, poCount: 5, lastPoAt: iso(-18) },
        notes: 'Imports — confirm USD exchange rate on each PO.',
        createdAt: iso(-300),
    },
    {
        id: 'v-008',
        code: 'V-008',
        name: 'Aqua Chem Industries',
        legalName: 'Aqua Chem Industries',
        gstin: '24BBACA5677M1Z2',
        pan: 'BBACA5677M',
        msmeNumber: 'UDYAM-GJ-08-0234561',
        category: 'Chemicals',
        paymentTermsDays: 15,
        creditLimit: 600000,
        currency: 'INR',
        placeOfSupply: 'Gujarat',
        state: 'Gujarat',
        address: 'Plot 88, Naroda GIDC, Ahmedabad — 382330',
        status: 'active',
        tier: 'C',
        contacts: [
            { id: 'vc-008-1', name: 'Bhavesh Patel', designation: 'Proprietor', phone: '+91 98220 88881', email: 'bhavesh@aquachem.in', isPrimary: true },
        ],
        bankDetails: [
            { id: 'vb-008-1', bankName: 'Bank of Baroda', accountNumber: 'XXXXXXXX4567', ifsc: 'BARB0NARODA', branch: 'Naroda', isPrimary: true },
        ],
        performance: { onTimePct: 78, qualityPct: 92, avgLeadDays: 4, rejectionPct: 3.1, spendYTD: 380000, poCount: 12, lastPoAt: iso(-3) },
        notes: 'Local MSME — fast delivery, occasional quality variance.',
        createdAt: iso(-240),
    },
    {
        id: 'v-009',
        code: 'V-009',
        name: 'Grundfos India',
        legalName: 'Grundfos Pumps India Pvt Ltd.',
        gstin: '33AAACG4456H1Z9',
        pan: 'AAACG4456H',
        category: 'Pumps',
        paymentTermsDays: 60,
        creditLimit: 4500000,
        currency: 'INR',
        placeOfSupply: 'Tamil Nadu',
        state: 'Tamil Nadu',
        address: 'Oragadam Industrial Park, Chennai — 602105',
        status: 'active',
        tier: 'A',
        contacts: [
            { id: 'vc-009-1', name: 'Lakshmi Narayanan', designation: 'Strategic Sales', phone: '+91 98220 99991', email: 'lakshmi.n@grundfos.com', isPrimary: true },
        ],
        bankDetails: [
            { id: 'vb-009-1', bankName: 'HSBC', accountNumber: 'XXXXXXXX7788', ifsc: 'HSBC0560002', branch: 'Chennai', isPrimary: true },
        ],
        performance: { onTimePct: 96, qualityPct: 99, avgLeadDays: 16, rejectionPct: 0.4, spendYTD: 5680000, poCount: 13, lastPoAt: iso(-6) },
        createdAt: iso(-560),
    },
    {
        id: 'v-010',
        code: 'V-010',
        name: 'Honeywell Automation',
        legalName: 'Honeywell Automation India Ltd.',
        gstin: '27AAACH6612N1Z4',
        pan: 'AAACH6612N',
        category: 'Controls',
        paymentTermsDays: 45,
        creditLimit: 2800000,
        currency: 'INR',
        placeOfSupply: 'Maharashtra',
        state: 'Maharashtra',
        address: 'Survey 43, Hadapsar, Pune — 411013',
        status: 'on_hold',
        tier: 'B',
        contacts: [
            { id: 'vc-010-1', name: 'Neeta Iyer', designation: 'Inside Sales', phone: '+91 98221 00001', email: 'neeta.iyer@honeywell.com', isPrimary: true },
        ],
        bankDetails: [
            { id: 'vb-010-1', bankName: 'DBS Bank', accountNumber: 'XXXXXXXX9988', ifsc: 'DBSS0IN0811', branch: 'Pune', isPrimary: true },
        ],
        performance: { onTimePct: 73, qualityPct: 90, avgLeadDays: 32, rejectionPct: 4.8, spendYTD: 1240000, poCount: 4, lastPoAt: iso(-32) },
        notes: 'On hold — awaiting compliance docs renewal.',
        createdAt: iso(-410),
    },
    {
        id: 'v-011',
        code: 'V-011',
        name: 'Local Hardware Traders',
        legalName: 'Local Hardware Traders',
        gstin: '24CCACL3344Q1Z8',
        pan: 'CCACL3344Q',
        category: 'Misc',
        paymentTermsDays: 7,
        creditLimit: 200000,
        currency: 'INR',
        placeOfSupply: 'Gujarat',
        state: 'Gujarat',
        address: 'Shop 14, Relief Road, Ahmedabad — 380001',
        status: 'active',
        tier: 'C',
        contacts: [
            { id: 'vc-011-1', name: 'Mukesh Modi', designation: 'Owner', phone: '+91 98221 11112', email: 'mukesh@localhardware.in', isPrimary: true },
        ],
        bankDetails: [
            { id: 'vb-011-1', bankName: 'Bank of Baroda', accountNumber: 'XXXXXXXX1122', ifsc: 'BARB0RELIEF', branch: 'Relief Road', isPrimary: true },
        ],
        performance: { onTimePct: 88, qualityPct: 89, avgLeadDays: 2, rejectionPct: 2.0, spendYTD: 145000, poCount: 18, lastPoAt: iso(-1) },
        createdAt: iso(-180),
    },
    {
        id: 'v-012',
        code: 'V-012',
        name: 'Defunct Suppliers Co',
        legalName: 'Defunct Suppliers Co',
        gstin: '24DDACD9988R1Z1',
        pan: 'DDACD9988R',
        category: 'Misc',
        paymentTermsDays: 15,
        creditLimit: 0,
        currency: 'INR',
        placeOfSupply: 'Gujarat',
        state: 'Gujarat',
        address: 'Old address (closed)',
        status: 'blocked',
        tier: 'C',
        contacts: [],
        bankDetails: [],
        performance: { onTimePct: 0, qualityPct: 0, avgLeadDays: 0, rejectionPct: 0, spendYTD: 0, poCount: 0, lastPoAt: null },
        notes: 'Blocked — multiple quality failures, business closed.',
        createdAt: iso(-900),
    },
];

export function vendorById(id: string): Vendor | undefined {
    return vendors.find((v) => v.id === id);
}

export function vendorPerformanceTone(value: number, type: 'higher' | 'lower' = 'higher'): 'emerald' | 'amber' | 'red' {
    if (type === 'higher') {
        if (value >= 90) return 'emerald';
        if (value >= 80) return 'amber';
        return 'red';
    }
    if (value <= 1.5) return 'emerald';
    if (value <= 3) return 'amber';
    return 'red';
}

export const VENDOR_CATEGORIES = Array.from(
    new Set(vendors.map((v) => v.category)),
).sort();
