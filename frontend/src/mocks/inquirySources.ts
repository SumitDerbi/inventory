export interface InquirySource {
    id: string;
    name: string;
    isActive: boolean;
}

export const inquirySources: InquirySource[] = [
    { id: 's-1', name: 'Dealer', isActive: true },
    { id: 's-2', name: 'Website', isActive: true },
    { id: 's-3', name: 'Direct Walk-in', isActive: true },
    { id: 's-4', name: 'Referral', isActive: true },
    { id: 's-5', name: 'Trade Show', isActive: true },
    { id: 's-6', name: 'Cold Call', isActive: true },
    { id: 's-7', name: 'IndiaMART', isActive: true },
];

export function sourceById(id: string | null | undefined): InquirySource | undefined {
    if (!id) return undefined;
    return inquirySources.find((s) => s.id === id);
}
