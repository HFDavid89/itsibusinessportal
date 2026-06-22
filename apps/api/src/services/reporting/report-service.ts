import { prisma } from '@itsi-business/database';
import { getWorkQueueStats } from '../work-items/work-item-service';
import { OPEN_WORK_ITEM_STATUSES } from '../work-items/work-item-service';
import { classifyAccountHealth } from './account-health';
import { computeAgeingBuckets } from './billing-ageing';
import type { ReportDateRange } from './query';
import { createdAtFilter } from './query';

const OPEN_TICKET_STATUSES = ['OPEN', 'WAITING_CUSTOMER', 'WAITING_INTERNAL', 'WAITING_ITSI_MOBILE'] as const;
const OUTSTANDING_INVOICE_STATUSES = ['ISSUED', 'PART_PAID', 'OVERDUE'] as const;

function balanceDue(totalPence: number, amountPaidPence: number) {
  return Math.max(0, totalPence - amountPaidPence);
}

function addDays(d: Date, days: number) {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function getOverviewReport(staffUserId?: string) {
  const now = new Date();
  const renewalCutoff = addDays(now, 90);

  const [
    totalAccounts,
    activeAccounts,
    mobileActive,
    broadbandActive,
    energyActive,
    openTickets,
    workStats,
    outstandingAgg,
    overdueAgg,
    overdueCount,
    productEnquiries,
    energyRenewalsDue,
    energyCheckInsDue,
  ] = await Promise.all([
    prisma.businessAccount.count(),
    prisma.businessAccount.count({ where: { status: 'ACTIVE' } }),
    prisma.businessMobileService.count({ where: { status: 'ACTIVE' } }),
    prisma.businessBroadbandService.count({ where: { status: 'ACTIVE' } }),
    prisma.businessEnergyService.count({ where: { status: { in: ['CONTRACTED', 'RENEWAL_DUE'] } } }),
    prisma.businessTicket.count({ where: { status: { in: [...OPEN_TICKET_STATUSES] } } }),
    getWorkQueueStats(staffUserId),
    prisma.businessInvoice.findMany({
      where: { status: { in: [...OUTSTANDING_INVOICE_STATUSES] } },
      select: { totalPence: true, amountPaidPence: true },
    }),
    prisma.businessInvoice.findMany({
      where: { status: 'OVERDUE' },
      select: { totalPence: true, amountPaidPence: true },
    }),
    prisma.businessInvoice.count({ where: { status: 'OVERDUE' } }),
    prisma.businessWorkItem.count({
      where: { type: 'PRODUCT_ENQUIRY', status: { in: [...OPEN_WORK_ITEM_STATUSES] } },
    }),
    prisma.businessEnergyService.count({
      where: {
        OR: [
          { status: 'RENEWAL_DUE' },
          { contractEndDate: { lte: renewalCutoff, gte: now } },
        ],
      },
    }),
    prisma.businessEnergyService.count({
      where: { nextCheckInDate: { lte: addDays(now, 30) } },
    }),
  ]);

  const outstandingPence = outstandingAgg.reduce((s, i) => s + balanceDue(i.totalPence, i.amountPaidPence), 0);
  const overduePence = overdueAgg.reduce((s, i) => s + balanceDue(i.totalPence, i.amountPaidPence), 0);

  const [ticketsOpened, ticketsResolved, invoicesIssued, workOpened, workResolved] = await Promise.all([
    prisma.businessTicket.count({ where: { createdAt: { gte: addDays(now, -30) } } }),
    prisma.businessTicket.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] }, updatedAt: { gte: addDays(now, -30) } } }),
    prisma.businessInvoice.count({ where: { status: { in: ['ISSUED', 'PART_PAID', 'PAID', 'OVERDUE'] }, issueDate: { gte: addDays(now, -30) } } }),
    prisma.businessWorkItem.count({ where: { createdAt: { gte: addDays(now, -30) } } }),
    prisma.businessWorkItem.count({ where: { status: { in: ['RESOLVED', 'CANCELLED'] }, completedAt: { gte: addDays(now, -30) } } }),
  ]);

  return {
    accounts: { total: totalAccounts, active: activeAccounts },
    services: {
      active: mobileActive + broadbandActive + energyActive,
      mobile: mobileActive,
      broadband: broadbandActive,
      energy: energyActive,
      mix: [
        { type: 'MOBILE', count: mobileActive },
        { type: 'BROADBAND', count: broadbandActive },
        { type: 'ENERGY', count: energyActive },
      ],
    },
    tickets: { open: openTickets },
    workItems: {
      open: workStats.open,
      breached: workStats.breached,
      dueSoon: workStats.dueSoon,
      assignedToMe: workStats.assignedToMe,
    },
    billing: {
      outstandingPence,
      overduePence,
      overdueCount,
    },
    productEnquiries: { open: productEnquiries },
    energy: { renewalsDue: energyRenewalsDue, checkInsDue: energyCheckInsDue },
    trends: {
      note: '30-day activity counts — full time-series trends deferred until sufficient historical data.',
      last30Days: {
        ticketsOpened,
        ticketsResolved,
        invoicesIssued,
        workItemsOpened: workOpened,
        workItemsResolved: workResolved,
      },
    },
    generatedAt: now.toISOString(),
  };
}

export async function getBillingReport(range: ReportDateRange, accountId?: string) {
  const now = new Date();
  const where = {
    ...(accountId ? { accountId } : {}),
    ...(createdAtFilter(range) ? { createdAt: createdAtFilter(range) } : {}),
  };

  const invoices = await prisma.businessInvoice.findMany({
    where,
    select: {
      id: true,
      invoiceNumber: true,
      accountId: true,
      status: true,
      dueDate: true,
      issueDate: true,
      totalPence: true,
      amountPaidPence: true,
      account: { select: { companyName: true, accountNumber: true } },
      lines: { select: { serviceType: true, grossAmountPence: true } },
    },
  });

  const statusCounts = { DRAFT: 0, ISSUED: 0, PART_PAID: 0, PAID: 0, OVERDUE: 0, VOID: 0 };
  let outstandingPence = 0;
  let overduePence = 0;
  const overdueAccounts = new Map<string, { companyName: string; balancePence: number; count: number }>();
  const byServiceType = new Map<string, number>();

  for (const inv of invoices) {
    const st = inv.status as keyof typeof statusCounts;
    if (st in statusCounts) statusCounts[st] += 1;

    const due = balanceDue(inv.totalPence, inv.amountPaidPence);
    if (OUTSTANDING_INVOICE_STATUSES.includes(inv.status as typeof OUTSTANDING_INVOICE_STATUSES[number])) {
      outstandingPence += due;
    }
    if (inv.status === 'OVERDUE') {
      overduePence += due;
      const cur = overdueAccounts.get(inv.accountId) ?? {
        companyName: inv.account?.companyName ?? 'Unknown',
        balancePence: 0,
        count: 0,
      };
      cur.balancePence += due;
      cur.count += 1;
      overdueAccounts.set(inv.accountId, cur);
    }

    for (const line of inv.lines) {
      if (line.serviceType) {
        byServiceType.set(line.serviceType, (byServiceType.get(line.serviceType) ?? 0) + line.grossAmountPence);
      }
    }
  }

  const dueSoon = (days: number) => {
    const cutoff = addDays(now, days);
    return invoices.filter((i) =>
      OUTSTANDING_INVOICE_STATUSES.includes(i.status as typeof OUTSTANDING_INVOICE_STATUSES[number])
      && i.dueDate && i.dueDate >= now && i.dueDate <= cutoff,
    ).length;
  };

  const ageing = computeAgeingBuckets(
    invoices.map((i) => ({
      status: i.status,
      dueDate: i.dueDate,
      totalPence: i.totalPence,
      amountPaidPence: i.amountPaidPence,
    })),
    now,
  );

  const topOverdue = [...overdueAccounts.entries()]
    .map(([id, v]) => ({ accountId: id, ...v }))
    .sort((a, b) => b.balancePence - a.balancePence)
    .slice(0, 10);

  return {
    outstandingPence,
    overduePence,
    overdueAccountsCount: overdueAccounts.size,
    statusCounts,
    dueSoon: { days7: dueSoon(7), days14: dueSoon(14), days30: dueSoon(30) },
    ageingBuckets: ageing,
    billingByServiceType: [...byServiceType.entries()].map(([serviceType, totalPence]) => ({ serviceType, totalPence })),
    topOverdueAccounts: topOverdue,
    generatedAt: now.toISOString(),
  };
}

export async function getServicesReport(accountId?: string) {
  const now = new Date();
  const base = accountId ? { accountId } : {};

  const [mobile, broadband, energy, wholesaleLinks] = await Promise.all([
    prisma.businessMobileService.groupBy({ by: ['status'], where: base, _count: true }),
    prisma.businessBroadbandService.groupBy({ by: ['status'], where: base, _count: true }),
    prisma.businessEnergyService.groupBy({ by: ['status'], where: base, _count: true }),
    prisma.itsiMobileWholesaleServiceLink.groupBy({
      by: ['status'],
      ...(accountId ? { where: { businessAccountId: accountId } } : {}),
      _count: true,
    }),
  ]);

  const broadbandTech = await prisma.businessBroadbandService.groupBy({
    by: ['accessTechnology'],
    where: { ...base, status: 'ACTIVE' },
    _count: true,
  });

  const mobileNoContact = await prisma.businessMobileService.count({
    where: { ...base, contactId: null, status: { notIn: ['CEASED', 'CANCELLED'] } },
  });

  const openWorkByService = await prisma.businessWorkItem.count({
    where: { ...base, status: { in: [...OPEN_WORK_ITEM_STATUSES] }, serviceId: { not: null } },
  });

  return {
    mobile: {
      active: mobile.find((g) => g.status === 'ACTIVE')?._count ?? 0,
      byStatus: mobile.map((g) => ({ status: g.status, count: g._count })),
    },
    broadband: {
      active: broadband.find((g) => g.status === 'ACTIVE')?._count ?? 0,
      byStatus: broadband.map((g) => ({ status: g.status, count: g._count })),
      byAccessTechnology: broadbandTech.map((g) => ({
        accessTechnology: g.accessTechnology ?? 'Unknown',
        count: g._count,
      })),
    },
    energy: {
      active: energy.filter((g) => ['CONTRACTED', 'RENEWAL_DUE'].includes(g.status)).reduce((s, g) => s + g._count, 0),
      byStatus: energy.map((g) => ({ status: g.status, count: g._count })),
    },
    dataQuality: {
      mobileWithoutContact: mobileNoContact,
      servicesWithOpenWorkItems: openWorkByService,
    },
    wholesale: {
      label: 'Local wholesale link status only — not live provider data until 13B-2',
      byStatus: wholesaleLinks.map((g) => ({ status: g.status, count: g._count })),
    },
    generatedAt: now.toISOString(),
  };
}

export async function getDeskReport(range: ReportDateRange, accountId?: string) {
  const now = new Date();
  const where = {
    ...(accountId ? { accountId } : {}),
    ...(createdAtFilter(range) ? { createdAt: createdAtFilter(range) } : {}),
  };

  const openTickets = await prisma.businessTicket.findMany({
    where: { ...where, status: { in: [...OPEN_TICKET_STATUSES] } },
    select: {
      id: true,
      ticketNumber: true,
      subject: true,
      status: true,
      priority: true,
      category: true,
      accountId: true,
      assignedToStaffUserId: true,
      createdAt: true,
      account: { select: { companyName: true } },
      _count: { select: { workItems: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const [byStatus, byPriority, byCategory] = await Promise.all([
    prisma.businessTicket.groupBy({ by: ['status'], where, _count: true }),
    prisma.businessTicket.groupBy({ by: ['priority'], where: { ...where, status: { in: [...OPEN_TICKET_STATUSES] } }, _count: true }),
    prisma.businessTicket.groupBy({ by: ['category'], where: { ...where, status: { in: [...OPEN_TICKET_STATUSES] } }, _count: true }),
  ]);

  const unassigned = openTickets.filter((t) => !t.assignedToStaffUserId).length;
  const withWorkItems = openTickets.filter((t) => t._count.workItems > 0).length;
  const agesMs = openTickets.map((t) => now.getTime() - t.createdAt.getTime());
  const avgAgeDays = agesMs.length
    ? Math.round(agesMs.reduce((s, a) => s + a, 0) / agesMs.length / (24 * 60 * 60 * 1000))
    : 0;

  const oldest = openTickets.slice(0, 10).map((t) => ({
    id: t.id,
    ticketNumber: t.ticketNumber,
    subject: t.subject,
    accountId: t.accountId,
    companyName: t.account?.companyName,
    ageDays: Math.floor((now.getTime() - t.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
  }));

  return {
    open: openTickets.length,
    unassigned,
    withWorkItems,
    averageOpenAgeDays: avgAgeDays,
    byStatus: byStatus.map((g) => ({ status: g.status, count: g._count })),
    byPriority: byPriority.map((g) => ({ priority: g.priority, count: g._count })),
    byCategory: byCategory.map((g) => ({ category: g.category, count: g._count })),
    oldestOpen: oldest,
    generatedAt: now.toISOString(),
  };
}

export async function getWorkItemsReport(staffUserId?: string, range?: ReportDateRange, accountId?: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const where = {
    ...(accountId ? { accountId } : {}),
    ...(createdAtFilter(range ?? {}) ? { createdAt: createdAtFilter(range ?? {}) } : {}),
  };

  const stats = await getWorkQueueStats(staffUserId);

  const [byType, byPriority, byStatus, breachedByType, openItems, completedMtd] = await Promise.all([
    prisma.businessWorkItem.groupBy({
      by: ['type'],
      where: { ...where, status: { in: [...OPEN_WORK_ITEM_STATUSES] } },
      _count: true,
    }),
    prisma.businessWorkItem.groupBy({
      by: ['priority'],
      where: { ...where, status: { in: [...OPEN_WORK_ITEM_STATUSES] } },
      _count: true,
    }),
    prisma.businessWorkItem.groupBy({ by: ['status'], where, _count: true }),
    prisma.businessWorkItem.groupBy({
      by: ['type'],
      where: {
        ...where,
        status: { in: [...OPEN_WORK_ITEM_STATUSES] },
        completedAt: null,
        dueAt: { lt: now },
      },
      _count: true,
    }),
    prisma.businessWorkItem.findMany({
      where: { ...where, status: { in: [...OPEN_WORK_ITEM_STATUSES] } },
      select: { id: true, title: true, type: true, createdAt: true, accountId: true, account: { select: { companyName: true } } },
      orderBy: { createdAt: 'asc' },
      take: 10,
    }),
    prisma.businessWorkItem.count({
      where: { ...where, status: 'RESOLVED', completedAt: { gte: startOfMonth } },
    }),
  ]);

  const ages = openItems.map((i) => now.getTime() - i.createdAt.getTime());
  const avgAgeDays = ages.length
    ? Math.round(ages.reduce((s, a) => s + a, 0) / ages.length / (24 * 60 * 60 * 1000))
    : 0;

  return {
    ...stats,
    completedThisMonth: completedMtd,
    averageOpenAgeDays: avgAgeDays,
    byType: byType.map((g) => ({ type: g.type, count: g._count })),
    byPriority: byPriority.map((g) => ({ priority: g.priority, count: g._count })),
    byStatus: byStatus.map((g) => ({ status: g.status, count: g._count })),
    breachedByType: breachedByType.map((g) => ({ type: g.type, count: g._count })),
    oldestOpen: openItems.map((i) => ({
      id: i.id,
      title: i.title,
      type: i.type,
      accountId: i.accountId,
      companyName: i.account?.companyName,
      ageDays: Math.floor((now.getTime() - i.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
    })),
    generatedAt: now.toISOString(),
  };
}

export async function getEnergyReport(accountId?: string) {
  const now = new Date();
  const base = accountId ? { accountId } : {};

  const [byStatus, renewals30, renewals60, renewals90, checkInsDue, missingData, spendAgg] = await Promise.all([
    prisma.businessEnergyService.groupBy({ by: ['status'], where: base, _count: true }),
    prisma.businessEnergyService.count({
      where: {
        ...base,
        OR: [
          { status: 'RENEWAL_DUE' },
          { contractEndDate: { lte: addDays(now, 30), gte: now } },
        ],
      },
    }),
    prisma.businessEnergyService.count({
      where: { ...base, contractEndDate: { lte: addDays(now, 60), gte: now } },
    }),
    prisma.businessEnergyService.count({
      where: { ...base, contractEndDate: { lte: addDays(now, 90), gte: now } },
    }),
    prisma.businessEnergyService.count({
      where: { ...base, nextCheckInDate: { lte: addDays(now, 30) } },
    }),
    prisma.businessEnergyService.count({
      where: {
        ...base,
        OR: [
          { supplierName: null },
          { meterPointReference: null },
        ],
        status: { notIn: ['LOST', 'CEASED'] },
      },
    }),
    prisma.businessEnergyService.aggregate({
      where: { ...base, estimatedAnnualSpendPence: { not: null } },
      _sum: { estimatedAnnualSpendPence: true },
      _count: true,
    }),
  ]);

  const referred = byStatus.find((g) => g.status === 'REFERRED_TO_FIDELITY')?._count ?? 0;
  const quote = byStatus.find((g) => g.status === 'QUOTE_IN_PROGRESS')?._count ?? 0;
  const contracted = byStatus.find((g) => g.status === 'CONTRACTED')?._count ?? 0;
  const lost = byStatus.find((g) => g.status === 'LOST')?._count ?? 0;

  return {
    label: 'Manual Fidelity referral and renewal tracking — not supplier billing or live API fulfilment',
    byStatus: byStatus.map((g) => ({ status: g.status, count: g._count })),
    pipeline: { referred, quoteInProgress: quote, contracted, lost },
    renewalsDue: { days30: renewals30, days60: renewals60, days90: renewals90 },
    checkInsDueNext30Days: checkInsDue,
    missingSupplierOrMeterData: missingData,
    estimatedAnnualSpendPence: spendAgg._sum.estimatedAnnualSpendPence ?? 0,
    recordsWithSpendEntered: spendAgg._count,
    generatedAt: now.toISOString(),
  };
}

export async function getProductsReport() {
  const now = new Date();

  const [visibleCatalogue, incompleteCatalogue, enquiries, enquiriesByType] = await Promise.all([
    prisma.businessServiceCatalogueItem.count({ where: { status: 'ACTIVE', customerVisible: true } }),
    prisma.businessServiceCatalogueItem.count({
      where: {
        status: 'ACTIVE',
        OR: [
          { retailPricePence: 0 },
          { contractTermMonths: null },
          { customerVisible: true, description: null },
        ],
      },
    }),
    prisma.businessWorkItem.findMany({
      where: { type: 'PRODUCT_ENQUIRY', status: { in: [...OPEN_WORK_ITEM_STATUSES] } },
      select: {
        id: true,
        title: true,
        accountId: true,
        createdAt: true,
        account: { select: { companyName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.businessWorkItem.groupBy({
      by: ['serviceType'],
      where: { type: 'PRODUCT_ENQUIRY', status: { in: [...OPEN_WORK_ITEM_STATUSES] } },
      _count: true,
    }),
  ]);

  return {
    catalogue: {
      customerVisibleActive: visibleCatalogue,
      incompleteCustomerVisible: incompleteCatalogue,
    },
    productEnquiries: {
      open: enquiries.length,
      byServiceType: enquiriesByType.map((g) => ({
        serviceType: g.serviceType ?? 'UNSPECIFIED',
        count: g._count,
      })),
      recent: enquiries,
    },
    generatedAt: now.toISOString(),
  };
}

export async function getAccountsReport() {
  const now = new Date();
  const dueSoonDate = new Date(now.getTime() + 4 * 60 * 60 * 1000);

  const accounts = await prisma.businessAccount.findMany({
    select: {
      id: true,
      companyName: true,
      accountNumber: true,
      status: true,
      _count: {
        select: {
          contacts: true,
          sites: true,
          tickets: true,
          invoices: true,
          mobileServices: true,
          broadbandServices: true,
          energyServices: true,
          workItems: true,
        },
      },
    },
  });

  const accountIds = accounts.map((a) => a.id);

  const [overdueByAccount, openTicketsByAccount, breachedByAccount, dueSoonByAccount, productEnqByAccount, energyRenewalByAccount, noPrimaryContact] = await Promise.all([
    prisma.businessInvoice.groupBy({
      by: ['accountId'],
      where: { accountId: { in: accountIds }, status: 'OVERDUE' },
      _count: true,
      _sum: { totalPence: true },
    }),
    prisma.businessTicket.groupBy({
      by: ['accountId'],
      where: { accountId: { in: accountIds }, status: { in: [...OPEN_TICKET_STATUSES] } },
      _count: true,
    }),
    prisma.businessWorkItem.groupBy({
      by: ['accountId'],
      where: {
        accountId: { in: accountIds },
        status: { in: [...OPEN_WORK_ITEM_STATUSES] },
        completedAt: null,
        dueAt: { lt: now },
      },
      _count: true,
    }),
    prisma.businessWorkItem.groupBy({
      by: ['accountId'],
      where: {
        accountId: { in: accountIds },
        status: { in: [...OPEN_WORK_ITEM_STATUSES] },
        completedAt: null,
        dueAt: { gte: now, lte: dueSoonDate },
      },
      _count: true,
    }),
    prisma.businessWorkItem.groupBy({
      by: ['accountId'],
      where: { accountId: { in: accountIds }, type: 'PRODUCT_ENQUIRY', status: { in: [...OPEN_WORK_ITEM_STATUSES] } },
      _count: true,
    }),
    prisma.businessEnergyService.groupBy({
      by: ['accountId'],
      where: {
        accountId: { in: accountIds },
        OR: [{ status: 'RENEWAL_DUE' }, { contractEndDate: { lte: addDays(now, 90) } }],
      },
      _count: true,
    }),
    prisma.businessContact.count({ where: { accountId: { in: accountIds }, isPrimary: true } }),
  ]);

  const mapCount = (rows: { accountId: string; _count: number }[]) =>
    Object.fromEntries(rows.map((r) => [r.accountId, r._count]));

  const overdueMap = Object.fromEntries(overdueByAccount.map((r) => [r.accountId, { count: r._count, pence: r._sum.totalPence ?? 0 }]));

  const classified = accounts.map((acc) => {
    const overdue = overdueMap[acc.id];
    const health = classifyAccountHealth({
      accountStatus: acc.status,
      openTickets: mapCount(openTicketsByAccount)[acc.id] ?? 0,
      overdueInvoiceCount: overdue?.count ?? 0,
      overdueBalancePence: overdue?.pence ?? 0,
      breachedWorkItems: mapCount(breachedByAccount)[acc.id] ?? 0,
      dueSoonWorkItems: mapCount(dueSoonByAccount)[acc.id] ?? 0,
      activeServices: (acc._count.mobileServices + acc._count.broadbandServices + acc._count.energyServices),
      energyRenewalsDue: mapCount(energyRenewalByAccount)[acc.id] ?? 0,
      openProductEnquiries: mapCount(productEnqByAccount)[acc.id] ?? 0,
      contactCount: acc._count.contacts,
      siteCount: acc._count.sites,
    });
    return {
      accountId: acc.id,
      companyName: acc.companyName,
      accountNumber: acc.accountNumber,
      accountStatus: acc.status,
      health,
      openTickets: mapCount(openTicketsByAccount)[acc.id] ?? 0,
      overdueInvoices: overdue?.count ?? 0,
      overdueBalancePence: overdue?.pence ?? 0,
    };
  });

  const atRisk = classified.filter((a) => a.health.tier === 'at_risk' || a.health.tier === 'needs_attention');
  const debtAndTickets = classified.filter((a) => a.overdueInvoices > 0 && a.openTickets > 0);
  const noContacts = accounts.filter((a) => a._count.contacts === 0);

  return {
    summary: {
      healthy: classified.filter((a) => a.health.tier === 'healthy').length,
      watch: classified.filter((a) => a.health.tier === 'watch').length,
      atRisk: classified.filter((a) => a.health.tier === 'at_risk').length,
      needsAttention: classified.filter((a) => a.health.tier === 'needs_attention').length,
    },
    accountsAtRisk: atRisk.sort((a, b) => a.health.score - b.health.score).slice(0, 25),
    overdueDebtWithOpenTickets: debtAndTickets.slice(0, 25),
    accountsWithoutContacts: noContacts.map((a) => ({
      accountId: a.id,
      companyName: a.companyName,
      accountNumber: a.accountNumber,
    })),
    generatedAt: now.toISOString(),
  };
}
