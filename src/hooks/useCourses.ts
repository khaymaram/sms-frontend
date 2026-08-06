import axios from "axios";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { api, get, post } from "../lib/axios"
import type { Course, CourseInput } from "../types";

export type CourseFilter =
    | { type: "all" }
    | { type: "credits"; credits: number }
    | { type: "title"; title: string }
    | { type: "professorId"; professorId: string }
    | { type: "code"; code: string };

export interface CoursePaginationOptions {
  page: number;
  pageSize: number;
  filter: CourseFilter;
}

export interface PaginatedCourses {
  data: Course[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function useCoursesPaginated({
    page, pageSize, filter,
}: CoursePaginationOptions) {
    return useQuery<PaginatedCourses>({
        queryKey:["courses", "paginated", page, pageSize, filter,],

        queryFn: async () => {
            const params = new URLSearchParams();

            params.set("page", String(page));
            params.set("limit", String(pageSize));

            switch (filter.type) {
                case "credits":
                    params.set("credits", String(filter.credits)); 
                    break;
                case "title":
                    params.set("title", filter.title);
                    break;
                case "code":
                    params.set("code", filter.code);
                    break;
                case "professorId":
                    params.set("professorId", filter.professorId);
                    break;
                case "all":
                    break;
            }
            return await get<PaginatedCourses>(
                `courses?${params.toString()}`
            );
        },
        placeholderData: keepPreviousData,
    });
}

export function useCourses(filter: CourseFilter = { type: "all" }) {
    // React Query fetches courses from the backend and caches the result.
    // The query key includes the current filter so different views can reuse
    // their own cached data without interfering with each other.
    return useQuery<Course[]>({
        queryKey: ["courses", filter],
        queryFn: async () => {
            switch (filter.type) {
                case "credits":
                    return await get<Course[]>(`/courses/credits/${filter.credits}`);
                case "title":
                    const query = encodeURIComponent(filter.title.trim());
                    if (!query) {
                        return [];
                    }
                    return await get<Course[]>(`/courses/search?title=${query}`);
                case "professorId":
                    const query2 = encodeURIComponent(filter.professorId.trim());
                    if (!query2) {
                        return [];
                    }
                    return await get<Course[]>(`/courses?professorId=${query2}`);
                case "code": {
                    try {
                        const course = await get<Course>(`/courses/${filter.code}`);
                        return [course];
                    } catch (unknownError) {
                        const error = unknownError as Error;
                        if (axios.isAxiosError(error) && error.response?.status === 404) {
                            return [];
                        }
                        throw error;
                    }
                }
                default:
                    return await get<Course[]>("/courses");
            }
        },
    });
}

export function useCreateCourse() {
    const queryClient = useQueryClient();
    // Send a POST request to create a course and refresh the course list on success.
    // Invalidating the students query makes the roster refetch immediately after creation.
    return useMutation({
        mutationFn: async (input: CourseInput) => {
            return await post<string>("/courses", input);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["courses"] });
            queryClient.invalidateQueries({ queryKey: ["enrollments"] });
        },
    });
}
export function useCourse(code: string | null) {
    return useQuery({
        queryKey: ["course", code],
        queryFn: () => get(`/courses/${code}`),
        enabled: !!code,
    });
}
export function useUpdateCourses() {
    const queryClient = useQueryClient();
    // Update an existing course and invalidate cached queries so the UI refreshes.
    // This keeps the roster view in sync with the backend after an edit.
    return useMutation({
        mutationFn: async ({ courseCode, input }: { courseCode: string; input: CourseInput }) => {
            const { data } = await api.put(`/courses/${courseCode}`, input);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["courses"] });
            queryClient.invalidateQueries({ queryKey: ["enrollments"] });
        },
    });
}

export function useDeleteCourse() {
    const queryClient = useQueryClient();
    // Delete a course by code and then refetch the course list.
    // The invalidation step ensures the roster immediately removes the deleted row.
    return useMutation({
        mutationFn: async (courseCode: string) => {
            await api.delete(`/courses/${courseCode}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["courses"] });
        },
    });
}
