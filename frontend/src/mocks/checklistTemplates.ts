export interface ChecklistItemTemplate {
    id: string;
    label: string;
    helperText?: string;
    requiresPhoto?: boolean;
}

export interface ChecklistGroup {
    id: string;
    title: string;
    items: ChecklistItemTemplate[];
}

export interface ChecklistTemplate {
    id: string;
    category: string;
    name: string;
    groups: ChecklistGroup[];
}

export const checklistTemplates: ChecklistTemplate[] = [
    {
        id: 'tmpl-pump',
        category: 'Pumps & Motors',
        name: 'Pump installation & commissioning',
        groups: [
            {
                id: 'g1',
                title: 'Pre-installation',
                items: [
                    { id: 'p-1', label: 'Site survey completed and shared with customer' },
                    { id: 'p-2', label: 'Foundation level checked (within 2 mm tolerance)' },
                    { id: 'p-3', label: 'Power supply cable rating verified' },
                    { id: 'p-4', label: 'PPE issued to crew' },
                ],
            },
            {
                id: 'g2',
                title: 'Mechanical installation',
                items: [
                    { id: 'm-1', label: 'Pump base anchored with grout' },
                    { id: 'm-2', label: 'Coupling alignment within OEM spec', requiresPhoto: true },
                    { id: 'm-3', label: 'Suction & delivery piping torque-checked' },
                    { id: 'm-4', label: 'Anti-vibration pads installed' },
                ],
            },
            {
                id: 'g3',
                title: 'Electrical & control',
                items: [
                    { id: 'e-1', label: 'Earthing continuity tested' },
                    { id: 'e-2', label: 'Phase sequence verified' },
                    { id: 'e-3', label: 'Overload relay set per FLA' },
                    { id: 'e-4', label: 'Control panel labels affixed', requiresPhoto: true },
                ],
            },
            {
                id: 'g4',
                title: 'Commissioning & handover',
                items: [
                    { id: 'c-1', label: 'No-load run for 10 minutes' },
                    { id: 'c-2', label: 'Load run with rated discharge' },
                    { id: 'c-3', label: 'Customer trained on start/stop procedure' },
                    { id: 'c-4', label: 'Commissioning report signed', requiresPhoto: true },
                ],
            },
        ],
    },
    {
        id: 'tmpl-firefighting',
        category: 'Fire Fighting',
        name: 'Sprinkler / hydrant commissioning',
        groups: [
            {
                id: 'g1',
                title: 'Pre-commissioning',
                items: [
                    { id: 'p-1', label: 'Hydraulic test pressure achieved' },
                    { id: 'p-2', label: 'Pump room ventilation OK' },
                    { id: 'p-3', label: 'Diesel tank fuel level >75%' },
                ],
            },
            {
                id: 'g2',
                title: 'Functional tests',
                items: [
                    { id: 'f-1', label: 'Jockey pump cut-in/cut-out verified' },
                    { id: 'f-2', label: 'Main electric pump auto-start verified' },
                    { id: 'f-3', label: 'Diesel pump auto-start with 5-attempt sequencer' },
                    { id: 'f-4', label: 'Sprinkler test valve flow OK', requiresPhoto: true },
                ],
            },
            {
                id: 'g3',
                title: 'Documentation',
                items: [
                    { id: 'd-1', label: 'Test report signed by site safety officer' },
                    { id: 'd-2', label: 'NOC application papers handed over' },
                ],
            },
        ],
    },
    {
        id: 'tmpl-solar',
        category: 'Solar Pumping',
        name: 'Solar pump set commissioning',
        groups: [
            {
                id: 'g1',
                title: 'Array',
                items: [
                    { id: 's-1', label: 'Module Voc / Isc within 5% of spec' },
                    { id: 's-2', label: 'Mounting structure earthed' },
                    { id: 's-3', label: 'String labelling complete', requiresPhoto: true },
                ],
            },
            {
                id: 'g2',
                title: 'VFD & pump',
                items: [
                    { id: 'v-1', label: 'VFD parameters set per pump curve' },
                    { id: 'v-2', label: 'Dry-run protection verified' },
                    { id: 'v-3', label: 'Tank-full sensor tested' },
                ],
            },
            {
                id: 'g3',
                title: 'Handover',
                items: [
                    { id: 'h-1', label: 'Customer manual handed over' },
                    { id: 'h-2', label: 'AMC card filled' },
                ],
            },
        ],
    },
];

export function checklistTemplateByCategory(
    category: string,
): ChecklistTemplate | undefined {
    return checklistTemplates.find((t) => t.category === category);
}

export function checklistTemplateById(
    id: string,
): ChecklistTemplate | undefined {
    return checklistTemplates.find((t) => t.id === id);
}
