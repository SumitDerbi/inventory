import { products as baseProducts, type MockProduct } from './products';

/* ---------------------------------------------------------------------- */
/* Types                                                                  */
/* ---------------------------------------------------------------------- */

export interface InventoryProduct extends MockProduct {
    brand: string;
    reorderPoint: number;
    reservedQty: number;
    specifications: Array<{ key: string; value: string }>;
    stockByWarehouse: Record<string, number>;
    attachments: Array<{ id: string; name: string; size: string }>;
}

export type StockStatus = 'in' | 'low' | 'out';

export type MovementType =
    | 'purchase'
    | 'sale'
    | 'transfer_in'
    | 'transfer_out'
    | 'adjustment'
    | 'reservation'
    | 'release';

export interface StockMovement {
    id: string;
    at: string;
    productId: string;
    warehouseId: string;
    type: MovementType;
    qty: number; // signed
    balance: number;
    docType: 'GRN' | 'DN' | 'TRF' | 'ADJ' | 'SO' | 'PO';
    docRef: string;
    note?: string;
    actorId: string;
}

export interface Reservation {
    id: string;
    productId: string;
    warehouseId: string;
    orderId: string;
    orderNumber: string;
    qty: number;
    status: 'active' | 'partial' | 'released' | 'shipped';
    reservedAt: string;
    expectedDispatch: string;
    customerName: string;
}

export interface StockAdjustment {
    id: string;
    at: string;
    productId: string;
    warehouseId: string;
    qty: number;
    reasonCode:
    | 'damaged'
    | 'recount'
    | 'theft'
    | 'correction'
    | 'returned'
    | 'expired';
    remark: string;
    authorisedBy: string;
    actorId: string;
}

/* ---------------------------------------------------------------------- */
/* Extended product catalogue (≥ 40 products)                             */
/* ---------------------------------------------------------------------- */

const BRAND_BY_CATEGORY: Record<string, string[]> = {
    Pumps: ['Kirloskar', 'Grundfos', 'CRI'],
    Motors: ['Siemens', 'ABB', 'Crompton'],
    Valves: ['Audco', 'L&T', 'Zoloto'],
    Piping: ['Jindal', 'Tata', 'APL Apollo'],
    Tanks: ['Sintex', 'Plasto'],
    Controls: ['Schneider', 'ABB', 'L&T'],
    Filtration: ['Pentair', 'Ion Exchange'],
    Chemicals: ['Thermax', 'Ion Exchange'],
    Services: ['In-house'],
    'Fire Fighting': ['Ceasefire', 'Kanex', 'Minimax'],
    Spares: ['OEM', 'Aftermarket'],
};

const EXTRA_PRODUCTS: MockProduct[] = [
    // Fire fighting
    { id: 'p-21', sku: 'FF-HYD-LANDING', name: 'Landing Valve 63 mm SS', category: 'Fire Fighting', uom: 'pcs', listPrice: 4800, taxRate: 18, stockQty: 24, description: 'Oblique-type, SS 304.' },
    { id: 'p-22', sku: 'FF-HOSE-63-15M', name: 'Fire Hose 63 mm × 15 m', category: 'Fire Fighting', uom: 'pcs', listPrice: 6800, taxRate: 18, stockQty: 30, description: 'RRL type-A, ISI.' },
    { id: 'p-23', sku: 'FF-BRANCH-PIPE', name: 'Branch Pipe with Nozzle', category: 'Fire Fighting', uom: 'pcs', listPrice: 2100, taxRate: 18, stockQty: 40, description: 'Gun-metal, short branch.' },
    { id: 'p-24', sku: 'FF-HOSE-REEL-30', name: 'Hose Reel Drum 30 m', category: 'Fire Fighting', uom: 'pcs', listPrice: 12400, taxRate: 18, stockQty: 14, description: 'MS with 20 mm hose.' },
    { id: 'p-25', sku: 'FF-EXT-ABC-9KG', name: 'Fire Extinguisher ABC 9 kg', category: 'Fire Fighting', uom: 'pcs', listPrice: 3800, taxRate: 18, stockQty: 48, description: 'Stored-pressure, ISI marked.' },
    { id: 'p-26', sku: 'FF-EXT-CO2-4.5', name: 'Fire Extinguisher CO₂ 4.5 kg', category: 'Fire Fighting', uom: 'pcs', listPrice: 6200, taxRate: 18, stockQty: 18, description: 'High-pressure CO₂.' },
    { id: 'p-27', sku: 'FF-SPRK-68C', name: 'Sprinkler Head 68 °C', category: 'Fire Fighting', uom: 'pcs', listPrice: 180, taxRate: 18, stockQty: 420, description: 'Pendant type, quartzoid bulb.' },
    { id: 'p-28', sku: 'FF-PANEL-CONV', name: 'Fire Alarm Panel 4-zone', category: 'Fire Fighting', uom: 'pcs', listPrice: 14500, taxRate: 18, stockQty: 6, description: 'Conventional, with battery backup.' },

    // Spares
    { id: 'p-29', sku: 'SPR-MECH-SEAL-32', name: 'Mechanical Seal 32 mm', category: 'Spares', uom: 'pcs', listPrice: 2400, taxRate: 18, stockQty: 32, description: 'Carbon vs ceramic, Viton.' },
    { id: 'p-30', sku: 'SPR-IMP-CF5', name: 'Impeller CF-5HP', category: 'Spares', uom: 'pcs', listPrice: 3600, taxRate: 18, stockQty: 12, description: 'Bronze, for 5 HP centrifugal.' },
    { id: 'p-31', sku: 'SPR-BEARING-6205', name: 'Ball Bearing 6205', category: 'Spares', uom: 'pcs', listPrice: 280, taxRate: 18, stockQty: 180, description: 'Deep-groove, 25 × 52 × 15.' },
    { id: 'p-32', sku: 'SPR-COUPLING-32', name: 'Flexible Coupling 32 mm', category: 'Spares', uom: 'pcs', listPrice: 1600, taxRate: 18, stockQty: 24, description: 'Rubber-element, pin-bush.' },
    { id: 'p-33', sku: 'SPR-GASKET-100', name: 'CAF Gasket 100 mm', category: 'Spares', uom: 'pcs', listPrice: 180, taxRate: 18, stockQty: 260, description: '3 mm, non-asbestos.' },
    { id: 'p-34', sku: 'SPR-BOLT-M16-65', name: 'Hex Bolt M16 × 65', category: 'Spares', uom: 'pcs', listPrice: 22, taxRate: 18, stockQty: 850, description: 'HT 8.8, zinc plated.' },
    { id: 'p-35', sku: 'SPR-CONTACTOR-25A', name: 'Contactor 25 A 3-pole', category: 'Spares', uom: 'pcs', listPrice: 950, taxRate: 18, stockQty: 46, description: 'AC-3 duty, 415 V coil.' },
    { id: 'p-36', sku: 'SPR-RELAY-OVERLD', name: 'Overload Relay 4-10 A', category: 'Spares', uom: 'pcs', listPrice: 1100, taxRate: 18, stockQty: 28, description: 'Thermal, adjustable.' },

    // Accessories / consumables
    { id: 'p-37', sku: 'ACC-PG-100MM', name: 'Pressure Gauge 100 mm', category: 'Controls', uom: 'pcs', listPrice: 840, taxRate: 18, stockQty: 64, description: '0–10 kg/cm², glycerine filled.' },
    { id: 'p-38', sku: 'ACC-FLOW-SW', name: 'Flow Switch 1 inch', category: 'Controls', uom: 'pcs', listPrice: 2200, taxRate: 18, stockQty: 20, description: 'Paddle-type, SPDT.' },
    { id: 'p-39', sku: 'PIPE-PVC-63-6M', name: 'PVC Pipe 63 mm × 6 m', category: 'Piping', uom: 'nos', listPrice: 680, taxRate: 18, stockQty: 320, description: 'Schedule 80, pressure rated.' },
    { id: 'p-40', sku: 'CHEM-NAOCL-25L', name: 'Sodium Hypochlorite 25 L', category: 'Chemicals', uom: 'can', listPrice: 1800, taxRate: 18, stockQty: 50, description: '10% available chlorine.' },
    { id: 'p-41', sku: 'VLV-BALL-25', name: 'Ball Valve 25 mm', category: 'Valves', uom: 'pcs', listPrice: 520, taxRate: 18, stockQty: 140, description: 'Brass, full bore.' },
    { id: 'p-42', sku: 'MTR-3P-20HP', name: 'Induction Motor 20 HP', category: 'Motors', uom: 'pcs', listPrice: 108000, taxRate: 18, stockQty: 3, description: '1440 RPM, IE3.' },
];

const SPEC_MAP: Record<string, Array<{ key: string; value: string }>> = {
    Pumps: [
        { key: 'Material', value: 'Cast iron body, SS 304 shaft' },
        { key: 'Head', value: '20–60 m' },
        { key: 'Discharge', value: '12–30 m³/h' },
        { key: 'Power supply', value: '415 V / 3Φ / 50 Hz' },
        { key: 'IP rating', value: 'IP55' },
    ],
    Motors: [
        { key: 'Frame', value: '132 M' },
        { key: 'RPM', value: '1440' },
        { key: 'Efficiency', value: 'IE3' },
        { key: 'Insulation', value: 'Class F' },
        { key: 'Duty', value: 'S1' },
    ],
    Valves: [
        { key: 'Body material', value: 'Ductile iron / Brass' },
        { key: 'End connection', value: 'Flanged / Threaded' },
        { key: 'Pressure rating', value: 'PN 10' },
        { key: 'Operation', value: 'Lever / Gear' },
    ],
    Piping: [
        { key: 'Material grade', value: 'IS 1239 / IS 3589' },
        { key: 'Finish', value: 'Galvanised / Epoxy coated' },
        { key: 'Length', value: '6 m standard' },
    ],
    Tanks: [
        { key: 'Material', value: 'HDPE / FRP' },
        { key: 'Capacity', value: '5 000–10 000 L' },
        { key: 'Layers', value: '3 layer' },
    ],
    Controls: [
        { key: 'Voltage', value: '415 V AC' },
        { key: 'Protection', value: 'IP 54' },
        { key: 'Certifications', value: 'CE, ISI' },
    ],
    Filtration: [
        { key: 'Vessel material', value: 'FRP' },
        { key: 'Media', value: 'Graded silica / Carbon' },
        { key: 'Flow rate', value: '10–15 m³/h' },
    ],
    Chemicals: [
        { key: 'Form', value: 'Powder / Liquid' },
        { key: 'Shelf life', value: '12 months' },
    ],
    Services: [{ key: 'Scope', value: 'Installation & commissioning' }],
    'Fire Fighting': [
        { key: 'Compliance', value: 'IS / NBC 2016' },
        { key: 'Pressure rating', value: 'PN 16' },
        { key: 'Certifications', value: 'ISI, CE' },
    ],
    Spares: [
        { key: 'Quality', value: 'OEM-equivalent' },
        { key: 'Warranty', value: '6 months' },
    ],
};

const ALL_PRODUCTS: MockProduct[] = [...baseProducts, ...EXTRA_PRODUCTS];

function pseudoRand(seed: number): () => number {
    let s = seed;
    return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
}

function splitStockAcrossWarehouses(
    total: number,
    rand: () => number,
): Record<string, number> {
    const w1 = Math.round(total * (0.45 + rand() * 0.15));
    const w2 = Math.round(total * (0.25 + rand() * 0.15));
    const w3 = Math.max(0, total - w1 - w2);
    return {
        'wh-ho': w1,
        'wh-br': w2,
        'wh-site': w3,
    };
}

const rand = pseudoRand(42);

export const inventoryProducts: InventoryProduct[] = ALL_PRODUCTS.map((p, idx) => {
    const brands = BRAND_BY_CATEGORY[p.category] ?? ['Generic'];
    const brand = brands[idx % brands.length];
    const reorderPoint = Math.max(
        1,
        Math.round(p.stockQty * (0.18 + rand() * 0.12)),
    );
    const reservedQty =
        p.category === 'Services'
            ? 0
            : Math.min(p.stockQty, Math.round(p.stockQty * rand() * 0.25));
    const specs = SPEC_MAP[p.category] ?? [{ key: 'Category', value: p.category }];
    const stockByWarehouse =
        p.category === 'Services'
            ? { 'wh-ho': p.stockQty, 'wh-br': 0, 'wh-site': 0 }
            : splitStockAcrossWarehouses(p.stockQty, rand);
    return {
        ...p,
        brand,
        reorderPoint,
        reservedQty,
        specifications: specs,
        stockByWarehouse,
        attachments:
            idx % 4 === 0
                ? [
                    { id: `${p.id}-ds`, name: `${p.sku}-datasheet.pdf`, size: '412 KB' },
                    { id: `${p.id}-cc`, name: `${p.sku}-test-certificate.pdf`, size: '189 KB' },
                ]
                : [],
    };
});

/* Force a handful into low-stock / out-of-stock so the UI highlights are obvious. */
(() => {
    const lowIds = ['p-3', 'p-5', 'p-11', 'p-15', 'p-42'];
    const outIds = ['p-12', 'p-28'];
    for (const id of lowIds) {
        const p = inventoryProducts.find((x) => x.id === id);
        if (p) {
            p.stockQty = Math.max(1, Math.floor(p.reorderPoint * 0.8));
            const total = p.stockQty;
            p.stockByWarehouse = {
                'wh-ho': Math.ceil(total / 2),
                'wh-br': Math.floor(total / 2),
                'wh-site': 0,
            };
        }
    }
    for (const id of outIds) {
        const p = inventoryProducts.find((x) => x.id === id);
        if (p) {
            p.stockQty = 0;
            p.reservedQty = 0;
            p.stockByWarehouse = { 'wh-ho': 0, 'wh-br': 0, 'wh-site': 0 };
        }
    }
})();

export function inventoryProductById(id: string): InventoryProduct | undefined {
    return inventoryProducts.find((p) => p.id === id);
}

export function availableQty(p: InventoryProduct): number {
    return Math.max(0, p.stockQty - p.reservedQty);
}

export function stockStatus(p: InventoryProduct): StockStatus {
    if (p.stockQty <= 0) return 'out';
    if (availableQty(p) <= p.reorderPoint) return 'low';
    return 'in';
}

export function stockValueINR(p: InventoryProduct): number {
    return p.stockQty * p.listPrice;
}

/* ---------------------------------------------------------------------- */
/* Stock ledger — ≥ 200 movements                                         */
/* ---------------------------------------------------------------------- */

const TODAY = Date.now();
const offsetDaysIso = (daysAgo: number, extraMinutes = 0) =>
    new Date(TODAY - daysAgo * 864e5 + extraMinutes * 60000).toISOString();

type LedgerSeed = {
    type: MovementType;
    docType: StockMovement['docType'];
    refPrefix: string;
    qtySign: 1 | -1;
};

const TYPE_SEEDS: LedgerSeed[] = [
    { type: 'purchase', docType: 'GRN', refPrefix: 'GRN-2026-', qtySign: 1 },
    { type: 'sale', docType: 'DN', refPrefix: 'DN-2026-', qtySign: -1 },
    { type: 'transfer_out', docType: 'TRF', refPrefix: 'TRF-2026-', qtySign: -1 },
    { type: 'transfer_in', docType: 'TRF', refPrefix: 'TRF-2026-', qtySign: 1 },
    { type: 'reservation', docType: 'SO', refPrefix: 'SO-2026-', qtySign: -1 },
    { type: 'release', docType: 'SO', refPrefix: 'SO-2026-', qtySign: 1 },
    { type: 'adjustment', docType: 'ADJ', refPrefix: 'ADJ-2026-', qtySign: -1 },
];

const ACTORS = ['u-3', 'u-4', 'u-5', 'u-6'];

function buildLedger(): StockMovement[] {
    const r = pseudoRand(7);
    const movements: StockMovement[] = [];
    let ledgerId = 1;
    // per-(product,warehouse) running balance starts at current stockByWarehouse
    const balances: Record<string, number> = {};
    for (const p of inventoryProducts) {
        for (const [w, q] of Object.entries(p.stockByWarehouse)) {
            balances[`${p.id}|${w}`] = q;
        }
    }
    // Generate 240 movements deterministically, walking back in time from today.
    const TARGET = 240;
    let day = 1;
    for (let i = 0; i < TARGET; i++) {
        const p = inventoryProducts[Math.floor(r() * inventoryProducts.length)];
        if (!p || p.category === 'Services') continue;
        const whIds = Object.keys(p.stockByWarehouse);
        const wh = whIds[Math.floor(r() * whIds.length)];
        const seed = TYPE_SEEDS[Math.floor(r() * TYPE_SEEDS.length)];
        const key = `${p.id}|${wh}`;
        const current = balances[key] ?? 0;
        const baseQty = Math.max(1, Math.round(r() * Math.max(1, p.reorderPoint)));
        const signed = seed.qtySign * baseQty;
        // reverse-compute balance: previously balance was (current - signed)
        const before = current - signed;
        if (before < 0) {
            balances[key] = current; // skip this one
            continue;
        }
        movements.push({
            id: `mov-${ledgerId++}`,
            at: offsetDaysIso(day, (i % 60) * 7),
            productId: p.id,
            warehouseId: wh,
            type: seed.type,
            qty: signed,
            balance: current,
            docType: seed.docType,
            docRef: `${seed.refPrefix}${String(200 - i).padStart(3, '0')}`,
            note:
                seed.type === 'adjustment'
                    ? 'Physical recount variance'
                    : seed.type === 'transfer_out' || seed.type === 'transfer_in'
                        ? 'Inter-warehouse transfer'
                        : undefined,
            actorId: ACTORS[i % ACTORS.length],
        });
        balances[key] = before;
        if (i % 3 === 0) day++;
    }
    return movements;
}

export const stockLedger: StockMovement[] = buildLedger();

export function ledgerForProduct(productId: string): StockMovement[] {
    return stockLedger.filter((m) => m.productId === productId);
}

export function ledgerForWarehouse(warehouseId: string): StockMovement[] {
    return stockLedger.filter((m) => m.warehouseId === warehouseId);
}

/* ---------------------------------------------------------------------- */
/* Reservations — linked to sales orders                                  */
/* ---------------------------------------------------------------------- */

export const reservations: Reservation[] = [
    {
        id: 'res-1',
        productId: 'p-1',
        warehouseId: 'wh-ho',
        orderId: 'so-001',
        orderNumber: 'SO-2026-001',
        qty: 4,
        status: 'active',
        reservedAt: offsetDaysIso(12),
        expectedDispatch: offsetDaysIso(-6),
        customerName: 'Aarav Constructions',
    },
    {
        id: 'res-2',
        productId: 'p-4',
        warehouseId: 'wh-ho',
        orderId: 'so-001',
        orderNumber: 'SO-2026-001',
        qty: 2,
        status: 'active',
        reservedAt: offsetDaysIso(12),
        expectedDispatch: offsetDaysIso(-6),
        customerName: 'Aarav Constructions',
    },
    {
        id: 'res-3',
        productId: 'p-15',
        warehouseId: 'wh-ho',
        orderId: 'so-001',
        orderNumber: 'SO-2026-001',
        qty: 1,
        status: 'partial',
        reservedAt: offsetDaysIso(12),
        expectedDispatch: offsetDaysIso(-2),
        customerName: 'Aarav Constructions',
    },
    {
        id: 'res-4',
        productId: 'p-6',
        warehouseId: 'wh-br',
        orderId: 'so-002',
        orderNumber: 'SO-2026-002',
        qty: 8,
        status: 'active',
        reservedAt: offsetDaysIso(10),
        expectedDispatch: offsetDaysIso(-4),
        customerName: 'Bluewave Projects',
    },
    {
        id: 'res-5',
        productId: 'p-9',
        warehouseId: 'wh-br',
        orderId: 'so-002',
        orderNumber: 'SO-2026-002',
        qty: 20,
        status: 'active',
        reservedAt: offsetDaysIso(10),
        expectedDispatch: offsetDaysIso(-4),
        customerName: 'Bluewave Projects',
    },
    {
        id: 'res-6',
        productId: 'p-8',
        warehouseId: 'wh-ho',
        orderId: 'so-003',
        orderNumber: 'SO-2026-003',
        qty: 6,
        status: 'shipped',
        reservedAt: offsetDaysIso(22),
        expectedDispatch: offsetDaysIso(15),
        customerName: 'Chandak Infra',
    },
    {
        id: 'res-7',
        productId: 'p-25',
        warehouseId: 'wh-br',
        orderId: 'so-006',
        orderNumber: 'SO-2026-006',
        qty: 12,
        status: 'active',
        reservedAt: offsetDaysIso(4),
        expectedDispatch: offsetDaysIso(-8),
        customerName: 'Dhruv Enterprises',
    },
    {
        id: 'res-8',
        productId: 'p-22',
        warehouseId: 'wh-br',
        orderId: 'so-006',
        orderNumber: 'SO-2026-006',
        qty: 8,
        status: 'active',
        reservedAt: offsetDaysIso(4),
        expectedDispatch: offsetDaysIso(-8),
        customerName: 'Dhruv Enterprises',
    },
    {
        id: 'res-9',
        productId: 'p-29',
        warehouseId: 'wh-ho',
        orderId: 'so-008',
        orderNumber: 'SO-2026-008',
        qty: 6,
        status: 'released',
        reservedAt: offsetDaysIso(30),
        expectedDispatch: offsetDaysIso(25),
        customerName: 'Epsilon Housing',
    },
    {
        id: 'res-10',
        productId: 'p-17',
        warehouseId: 'wh-ho',
        orderId: 'so-010',
        orderNumber: 'SO-2026-010',
        qty: 14,
        status: 'active',
        reservedAt: offsetDaysIso(2),
        expectedDispatch: offsetDaysIso(-10),
        customerName: 'Falcon Realty',
    },
];

export function reservationsForProduct(productId: string): Reservation[] {
    return reservations.filter((r) => r.productId === productId);
}

/* ---------------------------------------------------------------------- */
/* Adjustments history                                                    */
/* ---------------------------------------------------------------------- */

export const adjustments: StockAdjustment[] = [
    {
        id: 'adj-1',
        at: offsetDaysIso(2, 30),
        productId: 'p-6',
        warehouseId: 'wh-ho',
        qty: -2,
        reasonCode: 'damaged',
        remark: 'Valve body crack noticed during QC.',
        authorisedBy: 'u-3',
        actorId: 'u-5',
    },
    {
        id: 'adj-2',
        at: offsetDaysIso(4, 45),
        productId: 'p-9',
        warehouseId: 'wh-br',
        qty: 3,
        reasonCode: 'recount',
        remark: 'Physical stock higher than system.',
        authorisedBy: 'u-4',
        actorId: 'u-5',
    },
    {
        id: 'adj-3',
        at: offsetDaysIso(7),
        productId: 'p-25',
        warehouseId: 'wh-br',
        qty: -1,
        reasonCode: 'expired',
        remark: 'Pressure test date expired.',
        authorisedBy: 'u-3',
        actorId: 'u-6',
    },
    {
        id: 'adj-4',
        at: offsetDaysIso(10),
        productId: 'p-18',
        warehouseId: 'wh-ho',
        qty: -5,
        reasonCode: 'damaged',
        remark: 'Bag moisture damage.',
        authorisedBy: 'u-4',
        actorId: 'u-5',
    },
    {
        id: 'adj-5',
        at: offsetDaysIso(14),
        productId: 'p-31',
        warehouseId: 'wh-ho',
        qty: 10,
        reasonCode: 'returned',
        remark: 'Site return — unused.',
        authorisedBy: 'u-3',
        actorId: 'u-6',
    },
    {
        id: 'adj-6',
        at: offsetDaysIso(21),
        productId: 'p-34',
        warehouseId: 'wh-br',
        qty: -30,
        reasonCode: 'correction',
        remark: 'Opening balance correction.',
        authorisedBy: 'u-4',
        actorId: 'u-5',
    },
];

export const ADJUSTMENT_REASONS: Array<{
    value: StockAdjustment['reasonCode'];
    label: string;
}> = [
        { value: 'damaged', label: 'Damaged' },
        { value: 'recount', label: 'Recount variance' },
        { value: 'theft', label: 'Theft / loss' },
        { value: 'correction', label: 'Opening correction' },
        { value: 'returned', label: 'Customer return' },
        { value: 'expired', label: 'Expired / obsolete' },
    ];

/* ---------------------------------------------------------------------- */
/* Reorder derivation                                                     */
/* ---------------------------------------------------------------------- */

export interface ReorderRow {
    product: InventoryProduct;
    available: number;
    shortfall: number;
    suggestedPoQty: number;
    primaryWarehouseId: string;
}

export function reorderRows(): ReorderRow[] {
    return inventoryProducts
        .filter((p) => p.category !== 'Services' && stockStatus(p) !== 'in')
        .map((p) => {
            const available = availableQty(p);
            const shortfall = Math.max(0, p.reorderPoint - available);
            const suggestedPoQty = Math.max(
                p.reorderPoint,
                p.reorderPoint * 2 - available,
            );
            const lowestWarehouse = Object.entries(p.stockByWarehouse).sort(
                (a, b) => a[1] - b[1],
            )[0];
            return {
                product: p,
                available,
                shortfall,
                suggestedPoQty,
                primaryWarehouseId: lowestWarehouse?.[0] ?? 'wh-ho',
            };
        })
        .sort((a, b) => b.shortfall - a.shortfall);
}

/* ---------------------------------------------------------------------- */
/* Dashboard strip                                                        */
/* ---------------------------------------------------------------------- */

export function inventorySummary() {
    const totalSkus = inventoryProducts.length;
    const lowCount = inventoryProducts.filter((p) => stockStatus(p) === 'low').length;
    const outCount = inventoryProducts.filter((p) => stockStatus(p) === 'out').length;
    const stockValue = inventoryProducts.reduce(
        (acc, p) => acc + stockValueINR(p),
        0,
    );
    return { totalSkus, lowCount, outCount, stockValue };
}
