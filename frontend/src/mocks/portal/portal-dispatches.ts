/**
 * Portal projection of `dispatches.ts` — internal cost / freight terms
 * stripped; surfaces challan #, transporter, vehicle, ETA, route stops.
 */
import { dispatches } from '../dispatches';
import type { DispatchStage } from '../dispatches';
import { transporters } from '../transporters';
import { vehicles } from '../vehicles';
import { currentClientUser } from './client-users';

export interface PortalRouteStop {
    id: string;
    label: string;
    city: string;
    arrivedAt: string | null;
    departedAt: string | null;
}

export interface PortalDispatch {
    id: string;
    challanNumber: string;
    orderNumbers: string[];
    stage: DispatchStage;
    dispatchDate: string;
    expectedDeliveryDate: string;
    actualDeliveryDate: string | null;
    transporterName: string;
    vehicleNumber: string;
    eWayBill: string | null;
    destinationCity: string;
    destinationAddress: string;
    routeStops: PortalRouteStop[];
}

function transporterName(id: string): string {
    return transporters.find((t) => t.id === id)?.name ?? '—';
}
function vehicleNumber(id: string): string {
    return vehicles.find((v) => v.id === id)?.registration ?? '—';
}

function project(d: typeof dispatches[number]): PortalDispatch {
    return {
        id: d.id,
        challanNumber: d.challanNumber,
        orderNumbers: d.orderIds,
        stage: d.stage,
        dispatchDate: d.dispatchDate,
        expectedDeliveryDate: d.expectedDeliveryDate,
        actualDeliveryDate: d.actualDeliveryDate,
        transporterName: transporterName(d.transporterId),
        vehicleNumber: vehicleNumber(d.vehicleId),
        eWayBill: d.eWayBill,
        destinationCity: d.destinationCity,
        destinationAddress: d.destinationAddress,
        routeStops: d.routeStops.map((s) => ({
            id: s.id,
            label: s.label,
            city: s.city,
            arrivedAt: s.arrivedAt,
            departedAt: s.departedAt,
        })),
    };
}

export function portalDispatches(): PortalDispatch[] {
    const company = currentClientUser().companyName;
    return dispatches.filter((d) => d.customerCompany === company).map(project);
}

export function portalDispatchById(id: string): PortalDispatch | undefined {
    const company = currentClientUser().companyName;
    const d = dispatches.find((x) => x.id === id && x.customerCompany === company);
    return d ? project(d) : undefined;
}
