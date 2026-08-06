import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, get, post } from "../lib/axios";
import type { Major } from "../types";

export function useMajors() {
  return useQuery<Major[]>({
    queryKey: ["majors"],
    queryFn: () => get<Major[]>("/majors"),
    staleTime: 5 * 60 * 1000,
  });
}

export interface PaginatedMajors {
  data: Major[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function useMajorsPaginated(page: number, pageSize: number) {
  return useQuery<PaginatedMajors>({
    queryKey: ["majors", "paginated", page, pageSize],
    queryFn: () => get<PaginatedMajors>(`/majors?page=${page}&limit=${pageSize}`),
  });
}

export function useCreateMajor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => post<Major>("/majors", { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["majors"] }),
  });
}

export function useDeleteMajor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/majors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["majors"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student"] });
    },
  });
}
