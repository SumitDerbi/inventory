export interface Warehouse {
    id: string;
    code: string;
    name: string;
    city: string;
    address: string;
    contactPerson: string;
    phone: string;
    zones: WarehouseZone[];
}

export interface WarehouseZone {
    code: string;
    label: string;
    racks: string[];
}

export const warehouses: Warehouse[] = [
    {
        id: 'wh-ho',
        code: 'WH-HO',
        name: 'Head Office Warehouse',
        city: 'Ahmedabad',
        address: 'Plot 14, GIDC Phase 2, Vatva, Ahmedabad — 382445',
        contactPerson: 'Ramesh Solanki',
        phone: '+91 98250 11111',
        zones: [
            { code: 'A', label: 'Pumps & Motors', racks: ['A1', 'A2', 'A3', 'A4'] },
            { code: 'B', label: 'Valves & Fittings', racks: ['B1', 'B2', 'B3'] },
            { code: 'C', label: 'Piping', racks: ['C1', 'C2'] },
            { code: 'D', label: 'Controls', racks: ['D1', 'D2'] },
        ],
    },
    {
        id: 'wh-br',
        code: 'WH-BR',
        name: 'Surat Branch',
        city: 'Surat',
        address: 'Shop 7, Udhna Industrial Estate, Surat — 394210',
        contactPerson: 'Jigar Patel',
        phone: '+91 98250 22222',
        zones: [
            { code: 'A', label: 'Fast moving', racks: ['A1', 'A2'] },
            { code: 'B', label: 'Fire fighting', racks: ['B1'] },
            { code: 'C', label: 'Spares', racks: ['C1', 'C2'] },
        ],
    },
    {
        id: 'wh-site',
        code: 'WH-SITE',
        name: 'Rajkot Site Store',
        city: 'Rajkot',
        address: 'Project site, Aji GIDC, Rajkot — 360003',
        contactPerson: 'Dipak Vaghela',
        phone: '+91 98250 33333',
        zones: [{ code: 'A', label: 'Project items', racks: ['A1'] }],
    },
];

export function warehouseById(id: string): Warehouse | undefined {
    return warehouses.find((w) => w.id === id);
}
