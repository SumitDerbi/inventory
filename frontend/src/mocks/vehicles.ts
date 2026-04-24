export interface Vehicle {
    id: string;
    registration: string;
    type: 'tata-407' | 'tata-1109' | 'eicher-14ft' | 'tempo' | 'pickup' | 'trailer';
    typeLabel: string;
    capacityKg: number;
    capacityCft: number;
    transporterId: string;
    driverName: string;
    driverPhone: string;
    licenceNumber: string;
    status: 'available' | 'in_transit' | 'maintenance';
    lastTripCity?: string;
}

export const vehicles: Vehicle[] = [
    {
        id: 'veh-1',
        registration: 'GJ-01-AB-4521',
        type: 'tata-407',
        typeLabel: 'Tata 407',
        capacityKg: 2500,
        capacityCft: 250,
        transporterId: 'tr-1',
        driverName: 'Mahesh Solanki',
        driverPhone: '+91 98987 12121',
        licenceNumber: 'GJ0120190012',
        status: 'in_transit',
        lastTripCity: 'Surat',
    },
    {
        id: 'veh-2',
        registration: 'GJ-01-CD-7890',
        type: 'tata-1109',
        typeLabel: 'Tata 1109',
        capacityKg: 5500,
        capacityCft: 480,
        transporterId: 'tr-1',
        driverName: 'Bharat Chauhan',
        driverPhone: '+91 98987 23232',
        licenceNumber: 'GJ0120170045',
        status: 'available',
    },
    {
        id: 'veh-3',
        registration: 'MH-12-EF-1122',
        type: 'eicher-14ft',
        typeLabel: 'Eicher 14ft',
        capacityKg: 6000,
        capacityCft: 560,
        transporterId: 'tr-2',
        driverName: 'Sanjay Pawar',
        driverPhone: '+91 98987 34343',
        licenceNumber: 'MH1220200078',
        status: 'in_transit',
        lastTripCity: 'Pune',
    },
    {
        id: 'veh-4',
        registration: 'MH-04-GH-3344',
        type: 'trailer',
        typeLabel: '32ft Trailer',
        capacityKg: 16000,
        capacityCft: 1700,
        transporterId: 'tr-2',
        driverName: 'Anil Borade',
        driverPhone: '+91 98987 45454',
        licenceNumber: 'MH0420180156',
        status: 'available',
    },
    {
        id: 'veh-5',
        registration: 'DL-01-IJ-5566',
        type: 'tata-1109',
        typeLabel: 'Tata 1109',
        capacityKg: 5500,
        capacityCft: 480,
        transporterId: 'tr-3',
        driverName: 'Karan Yadav',
        driverPhone: '+91 98987 56565',
        licenceNumber: 'DL0120160101',
        status: 'available',
    },
    {
        id: 'veh-6',
        registration: 'KL-07-KL-7788',
        type: 'tata-407',
        typeLabel: 'Tata 407',
        capacityKg: 2500,
        capacityCft: 250,
        transporterId: 'tr-4',
        driverName: 'Faisal Rahman',
        driverPhone: '+91 98987 67676',
        licenceNumber: 'KL0720210234',
        status: 'maintenance',
        lastTripCity: 'Mangalore',
    },
    {
        id: 'veh-7',
        registration: 'WB-02-MN-9900',
        type: 'eicher-14ft',
        typeLabel: 'Eicher 14ft',
        capacityKg: 6000,
        capacityCft: 560,
        transporterId: 'tr-5',
        driverName: 'Subhash Ghosh',
        driverPhone: '+91 98987 78787',
        licenceNumber: 'WB0220170345',
        status: 'available',
    },
    {
        id: 'veh-8',
        registration: 'GJ-03-OP-1212',
        type: 'pickup',
        typeLabel: 'Mahindra Bolero Pickup',
        capacityKg: 1500,
        capacityCft: 130,
        transporterId: 'tr-6',
        driverName: 'Pankaj Vaghela',
        driverPhone: '+91 98987 89898',
        licenceNumber: 'GJ0320220012',
        status: 'available',
    },
    {
        id: 'veh-9',
        registration: 'GJ-03-QR-3434',
        type: 'tempo',
        typeLabel: 'Tata Ace',
        capacityKg: 750,
        capacityCft: 70,
        transporterId: 'tr-6',
        driverName: 'Devang Joshi',
        driverPhone: '+91 98987 90909',
        licenceNumber: 'GJ0320210099',
        status: 'in_transit',
        lastTripCity: 'Ahmedabad',
    },
];

export function vehicleById(id: string): Vehicle | undefined {
    return vehicles.find((v) => v.id === id);
}

export function vehiclesForTransporter(transporterId: string): Vehicle[] {
    return vehicles.filter((v) => v.transporterId === transporterId);
}
