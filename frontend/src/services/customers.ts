/**
 * Minimal customer lookup service used by quotation/order create dialogs.
 *
 * Only exposes a search helper for now; full CRUD lives in the masters slice.
 */
import { apiClient } from './apiClient';

export interface CustomerOption {
    id: string;
    companyName: string;
    contactPersonName: string;
    mobile: string;
    email: string;
    city: string;
}

interface ApiCustomerListItem {
    id: number;
    company_name?: string;
    contact_person_name?: string;
    mobile?: string;
    email?: string;
    city?: string;
}

interface PaginatedResponse<T> {
    results?: T[];
    count?: number;
}

function fromApi(c: ApiCustomerListItem): CustomerOption {
    return {
        id: String(c.id),
        companyName: c.company_name ?? '',
        contactPersonName: c.contact_person_name ?? '',
        mobile: c.mobile ?? '',
        email: c.email ?? '',
        city: c.city ?? '',
    };
}

export async function searchCustomers(
    search: string,
    limit = 10,
): Promise<CustomerOption[]> {
    const params: Record<string, string | number> = { page_size: limit };
    if (search.trim()) params.search = search.trim();
    const res = await apiClient.get<PaginatedResponse<ApiCustomerListItem> | ApiCustomerListItem[]>(
        '/customers/',
        { params },
    );
    const data = res.data;
    const rows = Array.isArray(data) ? data : (data.results ?? []);
    return rows.map(fromApi);
}

export async function getCustomer(id: string | number): Promise<CustomerOption> {
    const res = await apiClient.get<ApiCustomerListItem>(`/customers/${id}/`);
    return fromApi(res.data);
}
