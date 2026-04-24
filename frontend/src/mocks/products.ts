export interface MockProduct {
    id: string;
    sku: string;
    name: string;
    category: string;
    uom: string;
    listPrice: number; // INR
    taxRate: number; // GST %
    stockQty: number;
    description: string;
}

export const products: MockProduct[] = [
    { id: 'p-1', sku: 'PMP-CF-5HP', name: 'Centrifugal Pump 5 HP', category: 'Pumps', uom: 'pcs', listPrice: 48500, taxRate: 18, stockQty: 24, description: 'Cast-iron body, 415 V three-phase.' },
    { id: 'p-2', sku: 'PMP-CF-7HP', name: 'Centrifugal Pump 7.5 HP', category: 'Pumps', uom: 'pcs', listPrice: 62800, taxRate: 18, stockQty: 11, description: 'Cast-iron body, 415 V three-phase.' },
    { id: 'p-3', sku: 'PMP-SUB-5HP', name: 'Submersible Pump 5 HP', category: 'Pumps', uom: 'pcs', listPrice: 71200, taxRate: 18, stockQty: 6, description: 'SS 304 body for borewell.' },
    { id: 'p-4', sku: 'MTR-3P-10HP', name: 'Induction Motor 10 HP', category: 'Motors', uom: 'pcs', listPrice: 58600, taxRate: 18, stockQty: 18, description: '1440 RPM, foot-mounted.' },
    { id: 'p-5', sku: 'MTR-3P-15HP', name: 'Induction Motor 15 HP', category: 'Motors', uom: 'pcs', listPrice: 84200, taxRate: 18, stockQty: 9, description: '1440 RPM, IE3 efficiency.' },
    { id: 'p-6', sku: 'VLV-BTF-100', name: 'Butterfly Valve 100 mm', category: 'Valves', uom: 'pcs', listPrice: 8400, taxRate: 18, stockQty: 42, description: 'Ductile iron body, lever operated.' },
    { id: 'p-7', sku: 'VLV-BTF-150', name: 'Butterfly Valve 150 mm', category: 'Valves', uom: 'pcs', listPrice: 12200, taxRate: 18, stockQty: 28, description: 'Ductile iron body, gear operated.' },
    { id: 'p-8', sku: 'VLV-GT-50', name: 'Gate Valve 50 mm', category: 'Valves', uom: 'pcs', listPrice: 3850, taxRate: 18, stockQty: 60, description: 'Cast iron, flanged end.' },
    { id: 'p-9', sku: 'PIPE-MS-100-6M', name: 'MS Pipe 100 mm × 6 m', category: 'Piping', uom: 'nos', listPrice: 5400, taxRate: 18, stockQty: 150, description: 'ERW mild steel, BS 1387.' },
    { id: 'p-10', sku: 'PIPE-GI-50-6M', name: 'GI Pipe 50 mm × 6 m', category: 'Piping', uom: 'nos', listPrice: 3100, taxRate: 18, stockQty: 210, description: 'Galvanised, Class B.' },
    { id: 'p-11', sku: 'TNK-HDPE-5KL', name: 'HDPE Storage Tank 5 KL', category: 'Tanks', uom: 'pcs', listPrice: 68000, taxRate: 12, stockQty: 5, description: '3-layer, food-grade.' },
    { id: 'p-12', sku: 'TNK-FRP-10KL', name: 'FRP Chemical Tank 10 KL', category: 'Tanks', uom: 'pcs', listPrice: 142000, taxRate: 18, stockQty: 2, description: 'Acid-resistant lining.' },
    { id: 'p-13', sku: 'CTRL-VFD-15HP', name: 'VFD Drive 15 HP', category: 'Controls', uom: 'pcs', listPrice: 46500, taxRate: 18, stockQty: 14, description: 'Variable frequency drive.' },
    { id: 'p-14', sku: 'CTRL-PANEL-50A', name: 'Starter Panel 50 A', category: 'Controls', uom: 'pcs', listPrice: 28800, taxRate: 18, stockQty: 12, description: 'DOL starter with overload.' },
    { id: 'p-15', sku: 'FLT-SAND-24', name: 'Sand Filter 24" Dia', category: 'Filtration', uom: 'pcs', listPrice: 54200, taxRate: 18, stockQty: 8, description: 'FRP vessel with multi-port valve.' },
    { id: 'p-16', sku: 'FLT-CARB-24', name: 'Carbon Filter 24" Dia', category: 'Filtration', uom: 'pcs', listPrice: 58900, taxRate: 18, stockQty: 6, description: 'FRP vessel, activated carbon media.' },
    { id: 'p-17', sku: 'FLT-RO-MEM-4040', name: 'RO Membrane 4040', category: 'Filtration', uom: 'pcs', listPrice: 14200, taxRate: 18, stockQty: 32, description: 'TFC membrane, 2500 GPD.' },
    { id: 'p-18', sku: 'CHEM-ALUM-50KG', name: 'Alum (50 kg bag)', category: 'Chemicals', uom: 'bags', listPrice: 1200, taxRate: 5, stockQty: 180, description: 'Water treatment coagulant.' },
    { id: 'p-19', sku: 'INST-LABOR-DAY', name: 'Installation Labour (Day)', category: 'Services', uom: 'day', listPrice: 4200, taxRate: 18, stockQty: 999, description: 'Skilled technician per man-day.' },
    { id: 'p-20', sku: 'INST-COMM-LOT', name: 'Commissioning & Training', category: 'Services', uom: 'lot', listPrice: 25000, taxRate: 18, stockQty: 999, description: 'Lump-sum commissioning.' },
];

export function productById(id: string): MockProduct | undefined {
    return products.find((p) => p.id === id);
}
