export const capRequestedLimit = (
  requestedLimit: number | undefined,
  maxLimit: number
): number | undefined => {
  if (requestedLimit === undefined) {
    return undefined;
  }
  return Math.min(requestedLimit, maxLimit);
};

export const sliceByOffsetAndLimit = <T>(
  values: T[],
  offset: number,
  limit: number | undefined
): T[] => {
  if (limit === undefined) {
    return values.slice(offset);
  }
  return values.slice(offset, offset + limit);
};

export const toPaginationPayload = (params: {
  requestedLimit: number | undefined;
  maxLimit: number;
  limit: number | undefined;
  offset: number;
  pageSize: number;
  totalCount: number;
}) => {
  const { requestedLimit, maxLimit, limit, offset, pageSize, totalCount } = params;
  return {
    requested_limit: requestedLimit ?? null,
    max_limit: maxLimit,
    limit: limit ?? null,
    offset,
    ...(requestedLimit !== undefined ? { has_more: offset + pageSize < totalCount } : {}),
  };
};
