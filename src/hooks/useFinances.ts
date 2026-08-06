
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { get, put } from "../lib/axios";
import type { Finance } from "../types";

export function useFinances() {
    return useQuery<Finance[]>({
        queryKey: ["finances"],
        queryFn: async () => await get<Finance[]>("/finances"),
    });
}

export interface FinancePaginationOptions {
    page: number; pageSize: number;
}

export interface PaginatedFinances {
    data: Finance[]; page: number; pageSize: number; total: number; totalPages: number;
}

export function useFinance(id: number | null) {
    return useQuery<Finance>({
        queryKey: ["finance", id],
        queryFn: () => get<Finance>(`/finances/${id}`),
        enabled: id !== null,
    });
}

export function useFinancesPaginated({
    page, pageSize,
}: FinancePaginationOptions) {
    return useQuery<PaginatedFinances>({
        queryKey:["finances", "paginated", page, pageSize,],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("limit", String(pageSize));
            return await get<PaginatedFinances>(
                `/finances?${params.toString()}`
            );
        },
        placeholderData: keepPreviousData,
    });
}

export function useUpdateFinance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            studentId,
            input,
        }: {
            studentId: number;
            input: {
                scholarship: number;
                paid: number;
                isInState: boolean;
            };
        }) => {
            return await put<string>(`/finances/${studentId}`, input);
        },

        onSuccess: (_, variables) => {
            // Refresh the finance list
            queryClient.invalidateQueries({
                queryKey: ["finances"],
            });

            // Refresh the individual student's finance details
            queryClient.invalidateQueries({
                queryKey: ["finance", variables.studentId],
            });
        },
    });
}
