export interface TermsTemplate {
    id: string;
    name: string;
    body: string;
}

export const termsTemplates: TermsTemplate[] = [
    {
        id: 'tpl-standard',
        name: 'Standard Commercial',
        body: [
            '1. Prices are exclusive of GST which shall be charged at applicable rates.',
            '2. Payment: 30% advance with PO; 60% before dispatch; 10% against installation.',
            '3. Delivery: 4–6 weeks from receipt of confirmed PO and advance.',
            '4. Warranty: 12 months from the date of commissioning against manufacturing defects.',
            '5. Validity: This quotation is valid for 30 days from the date of issue.',
            '6. Force majeure clauses as per industry standard practice apply.',
        ].join('\n'),
    },
    {
        id: 'tpl-amc',
        name: 'AMC Contract',
        body: [
            '1. AMC covers preventive maintenance visits every quarter.',
            '2. Consumables and spare parts are chargeable separately.',
            '3. Response time for breakdown calls: within 48 working hours.',
            '4. Payment: 100% advance at contract execution; renewable annually.',
            '5. Exclusions: damage due to mis-operation, power fluctuations, natural calamities.',
        ].join('\n'),
    },
    {
        id: 'tpl-spare',
        name: 'Spare Parts Supply',
        body: [
            '1. Spare parts are ex-works from our Surat warehouse.',
            '2. Freight and insurance charges are extra at actuals.',
            '3. Payment: 100% advance against proforma invoice.',
            '4. Warranty: 6 months against manufacturing defects only.',
            '5. Returns accepted within 7 days for unused, original-packed items only.',
        ].join('\n'),
    },
    {
        id: 'tpl-turnkey',
        name: 'Turnkey Project',
        body: [
            '1. Scope includes supply, installation, commissioning & training as listed.',
            '2. Civil foundation and utilities (power, water) in customer scope.',
            '3. Payment: 20% advance; 50% pre-dispatch; 20% post-installation; 10% after performance test.',
            '4. Completion: as per agreed project schedule; liquidated damages capped at 5%.',
            '5. Warranty: 12 months from performance acceptance, parts & labour.',
        ].join('\n'),
    },
];

export function termsTemplateById(id: string): TermsTemplate | undefined {
    return termsTemplates.find((t) => t.id === id);
}
