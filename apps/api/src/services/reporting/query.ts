export interface ReportDateRange {
  from?: Date;
  to?: Date;
}

export function parseReportQuery(query: Record<string, string | undefined>): ReportDateRange & {
  accountId?: string;
  serviceType?: string;
  status?: string;
} {
  const from = query.from ? new Date(query.from) : undefined;
  const to = query.to ? new Date(query.to) : undefined;
  return {
    from: from && !Number.isNaN(from.getTime()) ? from : undefined,
    to: to && !Number.isNaN(to.getTime()) ? to : undefined,
    accountId: query.accountId,
    serviceType: query.serviceType,
    status: query.status,
  };
}

export function createdAtFilter(range: ReportDateRange): { gte?: Date; lte?: Date } | undefined {
  if (!range.from && !range.to) return undefined;
  return {
    ...(range.from ? { gte: range.from } : {}),
    ...(range.to ? { lte: range.to } : {}),
  };
}
