export type EngineerProficiency = 'expert' | 'proficient' | 'trainee';

export interface EngineerSkill {
    category: string;
    proficiency: EngineerProficiency;
}

export interface Engineer {
    id: string;
    userId: string;
    code: string;
    fullName: string;
    phone: string;
    baseCity: string;
    serviceCities: string[];
    skills: EngineerSkill[];
    certifications: string[];
    yearsOfExperience: number;
    activeJobs: number;
    completedThisMonth: number;
    avgRating: number;
    status: 'available' | 'on_job' | 'on_leave';
    nextSlotAt: string;
}

export const engineers: Engineer[] = [
    {
        id: 'eng-1',
        userId: 'u-8',
        code: 'ENG-001',
        fullName: 'Manish Patel',
        phone: '+91 98250 11122',
        baseCity: 'Ahmedabad',
        serviceCities: ['Ahmedabad', 'Gandhinagar', 'Vadodara', 'Anand'],
        skills: [
            { category: 'Hydraulic Systems', proficiency: 'expert' },
            { category: 'Pumps & Motors', proficiency: 'expert' },
            { category: 'Pipes & Fittings', proficiency: 'proficient' },
            { category: 'Fire Fighting', proficiency: 'proficient' },
        ],
        certifications: ['ISO Hydraulics L-2', 'Confined Space Entry'],
        yearsOfExperience: 9,
        activeJobs: 2,
        completedThisMonth: 11,
        avgRating: 4.7,
        status: 'on_job',
        nextSlotAt: '2026-04-26T09:00:00+05:30',
    },
    {
        id: 'eng-2',
        userId: 'u-9',
        code: 'ENG-002',
        fullName: 'Ritika Sharma',
        phone: '+91 98250 22233',
        baseCity: 'Ahmedabad',
        serviceCities: ['Ahmedabad', 'Surat', 'Rajkot'],
        skills: [
            { category: 'Pumps & Motors', proficiency: 'expert' },
            { category: 'Solar Pumping', proficiency: 'expert' },
            { category: 'Control Panels', proficiency: 'proficient' },
            { category: 'Hydraulic Systems', proficiency: 'proficient' },
        ],
        certifications: ['MNRE Solar Installer'],
        yearsOfExperience: 6,
        activeJobs: 1,
        completedThisMonth: 9,
        avgRating: 4.8,
        status: 'available',
        nextSlotAt: '2026-04-25T14:00:00+05:30',
    },
    {
        id: 'eng-3',
        userId: 'u-10',
        code: 'ENG-003',
        fullName: 'Arjun Joshi',
        phone: '+91 98250 33344',
        baseCity: 'Surat',
        serviceCities: ['Surat', 'Vapi', 'Valsad', 'Bharuch'],
        skills: [
            { category: 'Fire Fighting', proficiency: 'expert' },
            { category: 'Pipes & Fittings', proficiency: 'expert' },
            { category: 'Pumps & Motors', proficiency: 'proficient' },
            { category: 'Control Panels', proficiency: 'trainee' },
        ],
        certifications: ['NFPA Sprinkler Tech'],
        yearsOfExperience: 4,
        activeJobs: 1,
        completedThisMonth: 6,
        avgRating: 4.4,
        status: 'on_leave',
        nextSlotAt: '2026-04-28T09:00:00+05:30',
    },
];

export function engineerById(id: string | null | undefined): Engineer | undefined {
    if (!id) return undefined;
    return engineers.find((e) => e.id === id);
}

export function engineersByCity(city: string): Engineer[] {
    return engineers.filter(
        (e) => e.serviceCities.includes(city) && e.status !== 'on_leave',
    );
}
