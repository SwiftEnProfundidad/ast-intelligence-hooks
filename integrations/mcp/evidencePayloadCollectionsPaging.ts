type OptionalLimit = { limit?: number }['limit'];

export const capRequestedLimit = (
  requestedLimit: OptionalLimit,
  maxLimit: number
): OptionalLimit => {
  if (requestedLimit === undefined) {
    return undefined;
  }
  return Math.min(requestedLimit, maxLimit);
};

export const sliceByOffsetAndLimit = <T>(
  values: T[],
  offset: number,
  limit: OptionalLimit
): T[] => {
  if (limit === undefined) {
    return values.slice(offset);
  }
  return values.slice(offset, offset + limit);
};

export const toPaginationPayload = (params: {
  requestedLimit: OptionalLimit;
  maxLimit: number;
  limit: OptionalLimit;
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
