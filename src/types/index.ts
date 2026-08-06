// types/index.ts defines the shared frontend type schemas for students.
// StudentSchema describes the API shape and StudentInputSchema validates form data.
import { z } from "zod";

export type UserRole = "admin" | "student" | "professor";
export interface UserAccount {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    subjectId?: string | null;
}

function capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, char => char.toUpperCase());
}
export const ProfessorSchema = z.object({
    id: z.string(),
    name: z.string(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export type Professor = z.infer<typeof ProfessorSchema>;

export const ProfessorInputSchema = z.object({
    id: z.string().trim().toUpperCase().regex(/^P\d{4,}$/, "Professor IDs must follow the format P1234..."),
    name: z.string().min(1, "Professor name is required").transform(value => capitalizeWords(value.trim())),
});

export type ProfessorInput = z.infer<typeof ProfessorInputSchema>;

export const MajorSchema = z.object({
    id: z.number(),
    name: z.string(),
});
export type Major = z.infer<typeof MajorSchema>;
// StudentSchema describes the API response shape returned by the backend.
export const StudentSchema = z.object({
    id: z.number().optional(),
    studentId: z.number(),
    name: z.string(),
    grade: z.number(),
    gpa: z.number().nullable(),
	majorId: z.number(),
	major: MajorSchema.optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});
export type Student = z.infer<typeof StudentSchema>;

// StudentInputSchema validates the form data before it is sent to the API.
export const StudentInputSchema = z.object({
    studentId: z.coerce.number().int().positive("Student ID must be a positive number"),
    name: z.string().min(1, "Name is required").transform(value => capitalizeWords(value.trim())),
    grade: z.coerce.number().int().min(1, "Lowest grade level is 1").max(4, "Highest grade level is 4"),
	majorId: z.coerce.number().int().positive("Major is required"),
	isInState: z.boolean().optional(),
});
export type StudentInput = z.infer<typeof StudentInputSchema>;

export const CourseSchema = z.object({
    title: z.string(),
    code: z.string(),
    credits: z.number(),
    professorId: z.string().nullable().optional(),
    professor: ProfessorSchema.optional(),
	meetingDays: z.array(z.enum(["M", "T", "W", "Th", "F"])),
	startTime: z.string(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});
export type Course = z.infer<typeof CourseSchema>;

export const CourseInputSchema = z.object({
    title: z.string()
        .min(1)
        .transform(v => capitalizeWords(v.trim())),

    code: z.string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z]{4}\d{3}$/, "Course codes must follow the format ABCD123"),

    credits: z.coerce.number()
        .int()
        .min(1)
        .max(4),

	meetingDays: z.array(z.enum(["M", "T", "W", "Th", "F"]))
		.min(1, "Select at least one meeting day"),

	startTime: z.string()
		.regex(/^(0[89]|1[0-6]):(00|30)$/, "Select a valid start time")
		.refine(value => value !== "16:30", "The last class starts at 4:00 PM"),

    professorId: z
        .string()
        .optional()
        .transform((v) => {
            if (v === undefined || v === null || v === "" || v === "NONE" || v === "No Professor") {
                return undefined;
            }

            return v.trim().toUpperCase();
        })
        .refine(
            v => v === undefined || /^P\d{4,}$/.test(v),
            "Professor IDs must follow the format P1234..."
        ),
});
export type CourseInput = z.infer<typeof CourseInputSchema>;



// EnrollmentSchema describes a student's registration in a course. The backend
// preloads the related Student or Course record depending on which endpoint
// was called (a student's enrollments include `course`, a course's roster
// includes `student`), so both are optional here.
export const EnrollmentSchema = z.object({
    id: z.number().optional(),
    studentId: z.number(),
    courseCode: z.string(),
    grade: z.string().optional(),
    enrolledAt: z.string().optional(),
    updatedAt: z.string().optional(),
    student: StudentSchema.optional(),
    course: CourseSchema.optional(),
});
export type Enrollment = z.infer<typeof EnrollmentSchema>;

export const FinanceSchema = z.object({
    studentId: z.number(),
    studentName: z.string().optional(),
    tuition: z.number(),
    scholarship: z.number(),
    paid: z.number(),
    isInState: z.boolean(),
    remaining: z.number(),
    updatedAt: z.string().optional(),
});
export type Finance = z.infer<typeof FinanceSchema>;

