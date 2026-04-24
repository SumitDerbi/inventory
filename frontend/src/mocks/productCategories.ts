export interface ProductCategory {
    id: string;
    name: string;
}

export const productCategories: ProductCategory[] = [
    { id: 'pc-1', name: 'Industrial Pumps' },
    { id: 'pc-2', name: 'Valves & Fittings' },
    { id: 'pc-3', name: 'Compressors' },
    { id: 'pc-4', name: 'Spare Parts' },
    { id: 'pc-5', name: 'Pipes & Tubing' },
    { id: 'pc-6', name: 'Electrical Panels' },
    { id: 'pc-7', name: 'AMC Services' },
];

export function categoryById(id: string | null | undefined): ProductCategory | undefined {
    if (!id) return undefined;
    return productCategories.find((c) => c.id === id);
}
