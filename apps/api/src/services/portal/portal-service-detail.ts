import { prisma } from '@itsi-business/database';
import { toPortalStatusLabel, toPortalEnergyStatusLabel } from '@itsi-business/core';
import { OPEN_TICKET_STATUSES } from '../../routes/portal/constants';

export type PortalServiceType = 'MOBILE' | 'BROADBAND' | 'ENERGY';

const CATEGORY_BY_TYPE: Record<PortalServiceType, string> = {
  MOBILE: 'MOBILE',
  BROADBAND: 'BROADBAND',
  ENERGY: 'ENERGY',
};

export async function loadPortalServiceById(accountId: string, serviceId: string) {
  const [mobile, broadband, energy] = await Promise.all([
    prisma.businessMobileService.findFirst({
      where: { id: serviceId, accountId },
      select: {
        id: true, serviceReference: true, displayName: true, status: true,
        retailPricePence: true, mobileNumber: true, simLabel: true, costCentre: true,
        contractStartDate: true, contractEndDate: true, createdAt: true,
      },
    }),
    prisma.businessBroadbandService.findFirst({
      where: { id: serviceId, accountId },
      select: {
        id: true, serviceReference: true, displayName: true, status: true,
        retailPricePence: true, accessTechnology: true, postcode: true, circuitLabel: true,
        contractStartDate: true, contractEndDate: true, createdAt: true,
        site: { select: { id: true, name: true } },
      },
    }),
    prisma.businessEnergyService.findFirst({
      where: { id: serviceId, accountId, customerVisible: true },
      select: {
        id: true, serviceReference: true, displayName: true, status: true,
        fuelType: true, supplierName: true,
        contractStartDate: true, contractEndDate: true, renewalWindowStartDate: true, nextCheckInDate: true,
        site: { select: { id: true, name: true } },
      },
    }),
  ]);

  if (mobile) {
    return {
      type: 'MOBILE' as const,
      ...mobile,
      statusLabel: toPortalStatusLabel(mobile.status),
    };
  }
  if (broadband) {
    return {
      type: 'BROADBAND' as const,
      ...broadband,
      statusLabel: toPortalStatusLabel(broadband.status),
    };
  }
  if (energy) {
    return {
      type: 'ENERGY' as const,
      ...energy,
      statusLabel: toPortalEnergyStatusLabel(energy.status),
      renewalStatusLabel: energy.status === 'RENEWAL_DUE' ? 'Renewal review due' : null,
      nextReviewLabel: energy.nextCheckInDate ? 'Next account review scheduled' : null,
      energyBillingNote: 'Energy contracts and billing are handled directly through the supplier/Fidelity process.',
    };
  }
  return null;
}

export async function loadRelatedInvoices(accountId: string, serviceReference: string) {
  const lines = await prisma.businessInvoiceLine.findMany({
    where: {
      businessServiceReference: serviceReference,
      invoice: { accountId, status: { in: ['ISSUED', 'PART_PAID', 'PAID', 'OVERDUE'] } },
    },
    select: {
      id: true, description: true, grossAmountPence: true,
      invoice: { select: { id: true, invoiceNumber: true, status: true, issueDate: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return lines.map((l) => ({
    lineId: l.id,
    description: l.description,
    grossAmountPence: l.grossAmountPence,
    invoiceId: l.invoice.id,
    invoiceNumber: l.invoice.invoiceNumber,
    invoiceStatus: l.invoice.status,
    issueDate: l.invoice.issueDate,
  }));
}

export async function loadRelatedTickets(accountId: string, serviceType: PortalServiceType) {
  const category = CATEGORY_BY_TYPE[serviceType];
  return prisma.businessTicket.findMany({
    where: { accountId, category, status: { in: [...OPEN_TICKET_STATUSES] } },
    select: {
      id: true, ticketNumber: true, subject: true, status: true, priority: true, updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  });
}

export async function writePortalTimelineEvent(
  accountId: string,
  type: string,
  actorId: string,
  meta: Record<string, unknown>,
) {
  try {
    await prisma.timelineEvent.create({
      data: {
        type,
        accountId,
        actorId,
        actorType: 'PORTAL_USER',
        meta: meta as object,
      },
    });
  } catch {
    // non-fatal
  }
}

export function mapProductCategory(serviceType: string): 'MOBILE' | 'BROADBAND' | 'ENERGY' | 'GENERAL' {
  if (serviceType === 'MOBILE') return 'MOBILE';
  if (serviceType === 'BROADBAND') return 'BROADBAND';
  if (serviceType === 'ENERGY') return 'ENERGY';
  return 'GENERAL';
}

export function mapServiceCategory(serviceType: PortalServiceType): 'MOBILE' | 'BROADBAND' | 'ENERGY' {
  return CATEGORY_BY_TYPE[serviceType] as 'MOBILE' | 'BROADBAND' | 'ENERGY';
}

export async function resolveServiceDisplayNames(accountId: string, references: string[]) {
  const unique = [...new Set(references.filter(Boolean))];
  if (!unique.length) return {} as Record<string, { displayName: string; serviceId: string; serviceType: string }>;

  const [mobile, broadband, energy] = await Promise.all([
    prisma.businessMobileService.findMany({
      where: { accountId, serviceReference: { in: unique } },
      select: { id: true, serviceReference: true, displayName: true },
    }),
    prisma.businessBroadbandService.findMany({
      where: { accountId, serviceReference: { in: unique } },
      select: { id: true, serviceReference: true, displayName: true },
    }),
    prisma.businessEnergyService.findMany({
      where: { accountId, serviceReference: { in: unique }, customerVisible: true },
      select: { id: true, serviceReference: true, displayName: true },
    }),
  ]);

  const map: Record<string, { displayName: string; serviceId: string; serviceType: string }> = {};
  for (const s of mobile) map[s.serviceReference] = { displayName: s.displayName, serviceId: s.id, serviceType: 'MOBILE' };
  for (const s of broadband) map[s.serviceReference] = { displayName: s.displayName, serviceId: s.id, serviceType: 'BROADBAND' };
  for (const s of energy) map[s.serviceReference] = { displayName: s.displayName, serviceId: s.id, serviceType: 'ENERGY' };
  return map;
}
