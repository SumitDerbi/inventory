export interface Transporter {
    id: string;
    code: string;
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
    serviceCities: string[];
    rating: 1 | 2 | 3 | 4 | 5;
    onTimePct: number;
    activeShipments: number;
    notes?: string;
}

export const transporters: Transporter[] = [
    {
        id: 'tr-1',
        code: 'TR-001',
        name: 'Gujarat Goods Carriers',
        contactPerson: 'Hardik Shah',
        phone: '+91 98250 44444',
        email: 'ops@gujaratgoods.co.in',
        serviceCities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhuj'],
        rating: 4,
        onTimePct: 92,
        activeShipments: 6,
        notes: 'Preferred partner for Gujarat lanes; offers 24h transit Ahmedabad → Rajkot.',
    },
    {
        id: 'tr-2',
        code: 'TR-002',
        name: 'BlueDart Surface Express',
        contactPerson: 'Reema Khanna',
        phone: '+91 98250 55555',
        email: 'reema.khanna@bluedart.com',
        serviceCities: ['Mumbai', 'Pune', 'Nashik', 'Aurangabad', 'Goa', 'Indore'],
        rating: 5,
        onTimePct: 96,
        activeShipments: 4,
    },
    {
        id: 'tr-3',
        code: 'TR-003',
        name: 'V-Trans India',
        contactPerson: 'Sandeep Kulkarni',
        phone: '+91 98250 66666',
        email: 'sandeep@vtrans.co.in',
        serviceCities: ['Delhi', 'Gurugram', 'Jaipur', 'Lucknow', 'Kanpur'],
        rating: 4,
        onTimePct: 88,
        activeShipments: 3,
    },
    {
        id: 'tr-4',
        code: 'TR-004',
        name: 'Coastal Freight Lines',
        contactPerson: 'Mohan Pillai',
        phone: '+91 98250 77777',
        email: 'mohan@coastalfreight.in',
        serviceCities: ['Kochi', 'Mangalore', 'Chennai', 'Vizag'],
        rating: 3,
        onTimePct: 81,
        activeShipments: 2,
        notes: 'Specialises in coastal corridor; covers Kochi & Mangalore.',
    },
    {
        id: 'tr-5',
        code: 'TR-005',
        name: 'East-West Logistics',
        contactPerson: 'Suman Ghosh',
        phone: '+91 98250 88888',
        email: 'suman@ewlogistics.in',
        serviceCities: ['Kolkata', 'Bhubaneswar', 'Ranchi', 'Patna'],
        rating: 4,
        onTimePct: 90,
        activeShipments: 1,
    },
    {
        id: 'tr-6',
        code: 'TR-006',
        name: 'Own Fleet (In-house)',
        contactPerson: 'Mukesh Rana',
        phone: '+91 98250 99999',
        email: 'fleet@inventoryco.in',
        serviceCities: ['Ahmedabad', 'Vatva', 'Vadodara', 'Surat'],
        rating: 5,
        onTimePct: 98,
        activeShipments: 2,
        notes: 'Used for local deliveries within 200 km.',
    },
];

export function transporterById(id: string): Transporter | undefined {
    return transporters.find((t) => t.id === id);
}
