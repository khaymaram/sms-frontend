// useEnrollments.ts provides React Query hooks for the enrollment
// relationship between students and courses (enroll/unenroll, list a
// student's courses, list a course's roster, record a grade).
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, get, post, put } from "../lib/axios";
import type { Enrollment } from "../types";

// A global list of all enrollments, preloaded with student/course details.
export function useAllEnrollments() {
  return useQuery<Enrollment[]>({
    queryKey: ["enrollments", "all"],
    queryFn: async () => await get<Enrollment[]>(`/enrollments`),
  });
}

// A student's list of enrolled courses. Disabled until a real studentId is provided.
export function useStudentEnrollments(studentId: number | null) {
  return useQuery<Enrollment[]>({
    queryKey: ["enrollments", "student", studentId],
    queryFn: async () => await get<Enrollment[]>(`/students/${studentId}/enrollments`),
    enabled: studentId !== null,
  });
}

// A course's roster of enrolled students. Disabled until a real course code is provided.
export function useCourseRoster(courseCode: string | null) {
  return useQuery<Enrollment[]>({
    queryKey: ["enrollments", "course", courseCode],
    queryFn: async () => await get<Enrollment[]>(`/courses/${courseCode}/roster`),
    enabled: !!courseCode,
  });
}

export function useEnrollStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, courseCode }: { studentId: number; courseCode: string }) => {
      return await post<string>(`/students/${studentId}/enrollments`, { courseCode });
    },
    onSuccess: async (_data, variables) => {
      // Refresh both sides of the relationship so the student's course list
      // and the course's roster both reflect the new enrollment immediately.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["enrollments"] }),
        queryClient.invalidateQueries({ queryKey: ["enrollments", "student", variables.studentId] }),
        queryClient.invalidateQueries({ queryKey: ["enrollments", "course", variables.courseCode] }),
         // Refresh the student's newly calculated GPA.
        queryClient.invalidateQueries({
          queryKey: ["student", variables.studentId],
        }),

        // Refresh the student roster/dashboard GPA.
        queryClient.invalidateQueries({
          queryKey: ["students"],
        }),
      ]);
    },
  });
}

export function useUnenrollStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, courseCode }: { studentId: number; courseCode: string }) => {
      await api.delete(`/students/${studentId}/enrollments/${courseCode}`);
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["enrollments"] }),
        queryClient.invalidateQueries({ queryKey: ["enrollments", "student", variables.studentId] }),
        queryClient.invalidateQueries({ queryKey: ["enrollments", "course", variables.courseCode] }),
         // Refresh the student's newly calculated GPA.
        queryClient.invalidateQueries({
          queryKey: ["student", variables.studentId],
        }),

        // Refresh the student roster/dashboard GPA.
        queryClient.invalidateQueries({
          queryKey: ["students"],
        }),
      ]);
    },
  });
}

export function useUpdateEnrollmentGrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      courseCode,
      grade,
    }: {
      studentId: number;
      courseCode: string;
      grade: string;
    }) => {
      return await put<string>(`/students/${studentId}/enrollments/${courseCode}`, { grade });
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["enrollments"] }),
        queryClient.invalidateQueries({ queryKey: ["enrollments", "student", variables.studentId] }),
        queryClient.invalidateQueries({ queryKey: ["enrollments", "course", variables.courseCode] }),
         // Refresh the student's newly calculated GPA.
        queryClient.invalidateQueries({
          queryKey: ["student", variables.studentId],
        }),

        // Refresh the student roster/dashboard GPA.
        queryClient.invalidateQueries({
          queryKey: ["students"],
        }),
      ]);
    },
  });
}
