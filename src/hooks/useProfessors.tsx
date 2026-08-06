import axios from "axios";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { api, get, post, put } from "../lib/axios"
import type { Professor, ProfessorInput } from "../types";

export type ProfessorFilter =
    | { type: "all" }
    | { type: "search"; id: string }
    | { type: "name"; name: string};

export interface ProfessorPaginationOptions {
    page: number; pageSize: number; filter: ProfessorFilter;
}

export interface PaginatedProfessors {
    data: Professor[]; page: number; pageSize: number; total: number; totalPages: number;
}

export function useProfessors(filter: ProfessorFilter = { type: "all"}, enabled = true){
    // React Query fetches students from the backend and caches the result.
    // The query key includes the current filter so different views can reuse
    // their own cached data without interfering with each other.
    return useQuery<Professor[]>({
        queryKey: ["professors", filter],
        enabled,
        queryFn: async () => {
            switch (filter.type) {
                case "search": {
                    try {
                        const professor = await get<Professor>(`/professors/${filter.id}`);
                        return [professor];
                    } catch (unknownError) {
                        const error = unknownError as Error;
                        if (axios.isAxiosError(error) && error.response?.status === 404) {
                            return [];
                        }
                        throw error;
                    }
                }
                case "name": {
                    const query = encodeURIComponent(filter.name.trim());
                    if (!query) {
                        return [];
                    }

                    return await get<Professor[]>(`/professors/search?name=${query}`);
                }
                case "all":
                default:
                    return await get<Professor[]>("/professors");
            }
        },
    });
}

export function useProfessorsPaginated({
    page, pageSize, filter,
}: ProfessorPaginationOptions) {
    return useQuery<PaginatedProfessors>({
        queryKey:["professors", "paginated", page, pageSize, filter,],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("limit", String(pageSize));

            switch(filter.type) {
                case "search":
                    params.set("professorId", filter.id);
                    break;
                case "name":
                    params.set("name", filter.name);
                    break;
                case "all":
                    break;
            }
            return await get<PaginatedProfessors>(
                `/professors?${params.toString()}`
            );
        },
        placeholderData: keepPreviousData,
    });
}

export function useProfessor(id: string | null) {
    return useQuery<Professor>({
        queryKey: ["professor", id],
        queryFn: () => get<Professor>(`/professors/${id}`),
        enabled: !!id,
    });
}

export function useCreateProfessor() {
    const queryClient = useQueryClient();
    // Send a POST request to create a student and refresh the student list on success.
    // Invalidating the students query makes the roster refetch immediately after creation.
    return useMutation({
        mutationFn: async (input: ProfessorInput) => {
            return await post<string>("/professors", input);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["professors"] });
        },
    });
}

export function useUpdateProfessor() {
    const queryClient = useQueryClient();
    // Update an existing student and invalidate cached queries so the UI refreshes.
    // This keeps the roster view in sync with the backend after an edit.
    return useMutation({
        mutationFn: async ({ professorId, input }: { professorId: string; input: ProfessorInput}) => {
            return await put<string>(`/professors/${professorId}`, input);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["professors"] });
        },
    });
}

export function useDeleteProfessor() {
    const queryClient = useQueryClient();
    // Delete a student by ID and then refetch the student list.
    // The invalidation step ensures the roster immediately removes the deleted row.
    return useMutation({
        mutationFn: async (professorId: string) => {
            await api.delete(`/professors/${professorId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["professors"] });
        },
    });
}
