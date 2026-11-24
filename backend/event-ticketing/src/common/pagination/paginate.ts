export function buildPaginatedResponse<T>(
    items: T[],
    total: number,
    page: number,
    limit: number
) {
    return {
        data: items,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1,
        }
    }
}