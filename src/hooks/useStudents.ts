// useStudents.ts provides React Query hooks for student CRUD operations.
// It keeps the UI logic separate from HTTP details.
import axios from "axios";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { api, get, post, put } from "../lib/axios"
import type { Student, StudentInput } from "../types";

export type StudentFilter =
    | { type: "all" }
    | { type: "grade"; grade: number}
    | { type: "honors" }
    | { type: "search"; studentId: number }
    | { type: "name"; name: string};

export interface StudentPaginationOptions {
    page: number; 
    pageSize: number;
    filter: StudentFilter;
}

export interface PaginatedStudents {
    data: Student[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}
    
export function useStudents(filter: StudentFilter = { type: "all"}){
    // React Query fetches students from the backend and caches the result.
    // The query key includes the current filter so different views can reuse
    // their own cached data without interfering with each other.
    return useQuery<Student[]>({
        queryKey: ["students", filter],
        queryFn: async () => {
            switch (filter.type) {
                case "grade":
                    return await get<Student[]>(`/students/grade/${filter.grade}`);
                case "honors":
                    return await get<Student[]>("/students/honors");
                case "search": {
                    try {
                        const student = await get<Student>(`/students/${filter.studentId}`);
                        return [student];
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

                    return await get<Student[]>(`/students/search?name=${query}`);
                }
                case "all":
                default:
                    return await get<Student[]>("/students");
            }
        },
    });
}

// paginated student list 
export function useStudentsPaginated({
    page, pageSize, filter,
}: StudentPaginationOptions) {
    return useQuery<PaginatedStudents>({
        queryKey: [
            "students", "paginated", page, pageSize, filter,
        ],

        queryFn: async () => {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("limit", String(pageSize));

            switch (filter.type) {
                case "grade":
                    params.set(
                        "grade", 
                        String(filter.grade)
                    );
                    break;
                case "honors":
                    params.set("honors", "true");
                    break;
                case "search":
                    params.set(
                        "studentId",
                        String(filter.studentId)
                    );
                    break;
                case "name":
                    params.set(
                        "name",
                        filter.name
                    );
                    break;
                case "all":
                    break;
                }
            return await get<PaginatedStudents>(
                `/students?${params.toString()}`
            );
        },

        placeholderData: keepPreviousData,
    });
}

export function useStudent(id: number | null){
    return useQuery({
        queryKey: ["student", id],
        queryFn: () => get(`/students/${id}`),
        enabled: !!id,
    });
}

export function useCreateStudent() {
    const queryClient = useQueryClient();
    // Send a POST request to create a student and refresh the student list on success.
    // Invalidating the students query makes the roster refetch immediately after creation.
    return useMutation({
        mutationFn: async (input: StudentInput) => {
            return await post<string>("/students", input);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
        },
    });
}

export function useUpdateStudent() {
    const queryClient = useQueryClient();
    // Update an existing student and invalidate cached queries so the UI refreshes.
    // This keeps the roster view in sync with the backend after an edit.
    return useMutation({
        mutationFn: async ({ studentId, input }: { studentId: number; input: StudentInput}) => {
            return await put<string>(`/students/${studentId}`, input);
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
            queryClient.invalidateQueries({ queryKey: ["student", variables.studentId] });
        },
    });
}

export function useDeleteStudent() {
    const queryClient = useQueryClient();
    // Delete a student by ID and then refetch the student list.
    // The invalidation step ensures the roster immediately removes the deleted row.
    return useMutation({
        mutationFn: async (studentId: number) => {
            await api.delete(`/students/${studentId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
        },
    });
}
