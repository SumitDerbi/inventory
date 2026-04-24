import { z } from 'zod';
import {
    INQUIRY_PRIORITIES,
    INQUIRY_STATUSES,
    INQUIRY_TYPES,
} from '@/lib/inquiryStatus';

const mobileRegex = /^[+0-9 ()-]{7,20}$/;

export const inquirySchema = z.object({
    sourceId: z.string().min(1, 'Source is required'),
    sourceReference: z.string().max(255).optional().or(z.literal('')),
    inquiryType: z.enum(INQUIRY_TYPES as [string, ...string[]]),
    priority: z.enum(INQUIRY_PRIORITIES as [string, ...string[]]),
    status: z.enum(INQUIRY_STATUSES as [string, ...string[]]),
    customerName: z
        .string()
        .min(2, 'Customer name is required')
        .max(255),
    companyName: z.string().max(255).optional().or(z.literal('')),
    mobile: z
        .string()
        .min(7, 'Mobile is required')
        .regex(mobileRegex, 'Enter a valid mobile number'),
    email: z.string().email('Enter a valid email').optional().or(z.literal('')),
    city: z.string().max(100).optional().or(z.literal('')),
    state: z.string().max(100).optional().or(z.literal('')),
    projectName: z.string().max(255).optional().or(z.literal('')),
    projectDescription: z.string().max(2000).optional().or(z.literal('')),
    productCategoryId: z.string().min(1, 'Product category is required'),
    expectedOrderDate: z.string().optional().or(z.literal('')),
    siteLocation: z.string().max(500).optional().or(z.literal('')),
    budgetRange: z.string().max(100).optional().or(z.literal('')),
    assignedTo: z.string().optional().or(z.literal('')),
    notes: z.string().max(2000).optional().or(z.literal('')),
});

export type InquiryFormValues = z.infer<typeof inquirySchema>;

export const followUpSchema = z
    .object({
        followUpType: z.enum([
            'call',
            'email',
            'visit',
            'whatsapp',
            'meeting',
        ] as const),
        scheduledAt: z.string().min(1, 'Date & time is required'),
        assignedTo: z.string().min(1, 'Assignee is required'),
        outcome: z.string().max(1000).optional().or(z.literal('')),
    })
    .refine(
        (data) => {
            const ts = new Date(data.scheduledAt).getTime();
            return Number.isFinite(ts) && ts > Date.now();
        },
        { message: 'Pick a future date & time', path: ['scheduledAt'] },
    );

export type FollowUpFormValues = z.infer<typeof followUpSchema>;

export const lostReasonSchema = z.object({
    lostReason: z
        .string()
        .min(5, 'Please describe why this inquiry was lost (min 5 chars)')
        .max(1000),
});

export type LostReasonFormValues = z.infer<typeof lostReasonSchema>;
