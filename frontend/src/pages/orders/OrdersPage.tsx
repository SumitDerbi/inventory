import { ShoppingCart } from 'lucide-react';
import { PlaceholderPage } from '@/pages/_shared/PlaceholderPage';

export default function OrdersPage() {
    return (
        <PlaceholderPage
            title="Sales Orders"
            description="Confirmed orders from accepted quotations."
            icon={ShoppingCart}
            ctaLabel="New order"
        />
    );
}
