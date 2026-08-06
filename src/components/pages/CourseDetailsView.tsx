// page details will have: 
//  back to courses button at the top of the page 
// TITLE: [Course Title] and the subheading will be [Course Code]
// in the header area there will be: number of students enrolled, professor, credits, avg grade 
// body: table with students enrolled: id, name, grade level, course grade, delete from course button
// add enroll student button next to student roster title so that user can add student to the course from the course details 

import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Trash2, UserPlus2 } from "lucide-react";
import { toast } from "sonner";


import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "../ui/Table";
import { Card } from "../ui/Card";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/Select";

import {
    useCourseRoster,
    useUpdateEnrollmentGrade,
    useUnenrollStudent,
} from "../../hooks/useEnrollments";

import { useCourse } from "../../hooks/useCourses";

import { apiErrorMessage } from "../../lib/axios";

import type { Course, Enrollment } from "../../types";

import { RosterModal } from "./RosterModal";
import { useAuth } from "../../context/AuthContext";

const GRADE_OPTIONS = ["A", "B", "C", "D", "F"] as const;

export default function CourseDetailsView() {
    const { user } = useAuth();
    const { courseCode } = useParams();
    const navigate = useNavigate();
    const {
        data: courseData,
        isLoading: courseLoading,
    } = useCourse(courseCode ?? null);

    const course = courseData as Course | undefined;
    const [enrollmentCourse, setEnrollmentCourse] = useState<Course | null>(null);
    const {
        data: enrollments,
        isLoading: rosterLoading,
    } = useCourseRoster(courseCode ?? null);

    const averageGrade = useMemo(() => {
        if (!enrollments?.length) return null;

        const points: Record<string, number> = {
            A: 4,
            B: 3,
            C: 2,
            D: 1,
            F: 0,
        };

        const graded = enrollments.filter(
            (e) => e.grade && points[e.grade] !== undefined
        );

        if (graded.length === 0) return null;

        const total = graded.reduce(
            (sum, e) => sum + points[e.grade!],
            0
        );

        const avg = total / graded.length;

        if (avg >= 3.5) return "A";
        if (avg >= 2.5) return "B";
        if (avg >= 1.5) return "C";
        if (avg >= 0.5) return "D";
        return "F";


        // return (total / graded.length).toFixed(2);
    }, [enrollments]);

    if (!courseCode) {
        return (
            <div className="p-6">
                <p>Course not found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Back Button */}
            <Button
                variant="outline"
                onClick={() => navigate(user?.role === "professor" ? "/professor-dashboard" : "/courses")}
                className="w-fit"
            >
                <ArrowLeft />
                {user?.role === "professor" ? "Back to Dashboard" : "Back to Courses"}
            </Button>

            {/* Course Header */}
            {!courseLoading && course && (
                <div className="space-y-1">

                    <h1 className="text-4xl font-bold tracking-tight">
                        {course.title}
                    </h1>

                    <p className="text-lg text-muted-foreground font-mono">
                        {course.code} ({course.credits} credits)
                    </p>

                </div>
            )}

            {/* Statistics */}
            {!courseLoading && course && (
                <Card padding="responsive">

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                                Professor
                            </p>

                            <p className={course?.professor?.name === null || course?.professor?.name === undefined ? "mt-1 text-3xl font-bold text-muted-foreground" : "mt-1 text-3xl font-bold"}>

                                {course?.professor?.name ?? "—"}

                            </p>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                                Students Enrolled
                            </p>
                            <p className="mt-1 text-3xl font-bold">
                                {enrollments?.length ?? 0}
                            </p>
                        </div>
                        
                        {/* <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                                Credits
                            </p>

                            <p className="mt-1 text-3xl font-bold">
                                {course.credits}
                            </p>
                        </div> */}

                        
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                                Average Grade
                            </p>

                            <p className={averageGrade === null || averageGrade === undefined ? "mt-1 text-3xl font-bold text-muted-foreground" : "mt-1 text-3xl font-bold"}>
                                {averageGrade ?? "—"}
                            </p>
                        </div>

                    </div>

                </Card>
            )}

            {/* Loading */}
            {rosterLoading && (
                <Card padding="lg">
                    <p className="text-muted-foreground">
                        Loading roster...
                    </p>
                </Card>
            )}

            {/* Empty */}
            {!rosterLoading && course &&
                (!enrollments || enrollments.length === 0) && (
                    <Card padding="lg">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                            <p className="text-muted-foreground">
                                No students are enrolled in this {course?.code}.
                            </p>
                            <Button onClick={() => setEnrollmentCourse(course)}>
                                <UserPlus2 />
                                Enroll Student
                            </Button>
                        </div>

                    </Card>
                )}

            {/* Roster */}
            {!rosterLoading &&
                enrollments && course &&
                enrollments.length > 0 && (

                    <Card padding="responsive">

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">

                            <h2 className="text-xl font-semibold">
                                Student Roster
                            </h2>

                            <Button onClick={() => setEnrollmentCourse(course)}>
                                <UserPlus2 />
                                Enroll Student
                            </Button>

                        </div>

                        <Table>

                            <TableHeader>

                                <TableRow>

                                    <TableHead>
                                        Student ID
                                    </TableHead>

                                    <TableHead>
                                        Name
                                    </TableHead>

                                    <TableHead>
                                        Grade Level
                                    </TableHead>

                                    <TableHead>
                                        Course Grade
                                    </TableHead>

                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>

                                </TableRow>

                            </TableHeader>

                            <TableBody>

                                {enrollments.map((enrollment) => (
                                    <RosterRow
                                        key={enrollment.studentId}
                                        enrollment={enrollment}
                                    />
                                ))}

                            </TableBody>

                        </Table>

                    </Card>

                )}
            <RosterModal course={enrollmentCourse} onClose={() => setEnrollmentCourse(null)} />
        </div>
    );
}
function RosterRow({
    enrollment,
}: {
    enrollment: Enrollment;
}) {
    const [gradeInput, setGradeInput] = useState(
        enrollment.grade ?? ""
    );

    const updateGrade = useUpdateEnrollmentGrade();
    const unenrollMutation = useUnenrollStudent();

    function handleSaveGrade() {
        updateGrade.mutate(
            {
                studentId: enrollment.studentId,
                courseCode: enrollment.courseCode,
                grade: gradeInput,
            },
            {
                onSuccess: () =>
                    toast.success(
                        `Updated grade for ${enrollment.student?.name ?? "student"
                        }.`
                    ),
                onError: (err) =>
                    toast.error(apiErrorMessage(err)),
            }
        );
    }

    function handleRemove() {
        if (
            !window.confirm(
                `Remove ${enrollment.student?.name ?? "this student"
                } from ${enrollment.courseCode}?`
            )
        ) {
            return;
        }

        unenrollMutation.mutate(
            {
                studentId: enrollment.studentId,
                courseCode: enrollment.courseCode,
            },
            {
                onSuccess: () =>
                    toast.success(
                        `Removed ${enrollment.student?.name ?? "student"
                        }.`
                    ),
                onError: (err) =>
                    toast.error(apiErrorMessage(err)),
            }
        );
    }

    return (
        <TableRow>

            <TableCell>

                <Badge
                    variant="outline"
                    className="font-mono"
                >
                    {enrollment.studentId}
                </Badge>

            </TableCell>

            <TableCell className="font-medium">
                {enrollment.student?.name ?? "—"}
            </TableCell>

            <TableCell>
                {enrollment.student?.grade ?? "—"}
            </TableCell>

            <TableCell>

                <div className="flex items-center gap-2">

                    <Select
                        value={gradeInput || "NONE"}
                        onValueChange={(value) =>
                            setGradeInput(
                                value === "NONE" ? "" : value
                            )
                        }
                    >
                        <SelectTrigger className="w-20">
                            <SelectValue placeholder="-" />
                        </SelectTrigger>

                        <SelectContent>

                            <SelectItem value="NONE">
                                -
                            </SelectItem>

                            {GRADE_OPTIONS.map((grade) => (
                                <SelectItem
                                    key={grade}
                                    value={grade}
                                >
                                    {grade}
                                </SelectItem>
                            ))}

                        </SelectContent>

                    </Select>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveGrade}
                        disabled={
                            updateGrade.isPending ||
                            gradeInput ===
                            (enrollment.grade ?? "")
                        }
                    >
                        <Check />
                    </Button>

                </div>

            </TableCell>

            <TableCell>

                <div className="flex justify-end">

                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleRemove}
                        disabled={
                            unenrollMutation.isPending
                        }
                    >
                        <Trash2 />

                    </Button>

                </div>

            </TableCell>

        </TableRow>
    );
}
