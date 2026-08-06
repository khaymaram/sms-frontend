
// RosterModal.tsx shows the list of students currently enrolled in a course,
// allows a student to be enrolled, and lets students be removed from the course.

import { toast } from "sonner";
import { Trash2, GraduationCap } from "lucide-react";
import { useMemo, useState } from "react";

import Modal from "../ui/Modal";
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

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/Select";

import {
    useCourseRoster,
    useUnenrollStudent,
    useEnrollStudent,
    useStudentEnrollments,
} from "../../hooks/useEnrollments";

import { useStudents } from "../../hooks/useStudents";

import { apiErrorMessage } from "../../lib/axios";

import type { Course } from "../../types";

interface RosterModalProps {
    course: Course | null;
    onClose: () => void;
}

const MAX_CREDITS = 15;

export function RosterModal({
    course,
    onClose,
}: RosterModalProps) {
    const [selectedStudent, setSelectedStudent] =
        useState<string>();

    const {
        data: enrollments,
        isLoading,
    } = useCourseRoster(course?.code ?? null);

    const {
        data: allStudents,
        isLoading: studentsLoading,
    } = useStudents({ type: "all" });

    const enrollMutation = useEnrollStudent();
    const unenrollMutation = useUnenrollStudent();

    /*
     * Get the selected student's current enrollments.
     *
     * When no student is selected, passing null prevents the query
     * from running.
     */
    const selectedStudentId = selectedStudent
        ? Number(selectedStudent)
        : null;

    const {
        data: studentEnrollments,
        isLoading: studentEnrollmentsLoading,
    } = useStudentEnrollments(selectedStudentId);

    const enrolledIds = useMemo(
        () =>
            new Set(
                (enrollments ?? []).map(
                    (enrollment) => enrollment.studentId
                )
            ),
        [enrollments]
    );

    const availableStudents = useMemo(
        () =>
            (allStudents ?? []).filter(
                (student) =>
                    !enrolledIds.has(student.studentId)
            ),
        [allStudents, enrolledIds]
    );

    /*
     * Calculate how many credits the selected student
     * is currently taking.
     */
    const currentCredits = useMemo(() => {
        return (
            studentEnrollments?.reduce(
                (total, enrollment) =>
                    total +
                    (enrollment.course?.credits ?? 0),
                0
            ) ?? 0
        );
    }, [studentEnrollments]);

    /*
     * Calculate what the student's credits would be
     * after adding this course.
     */
    const creditsAfterEnrollment =
        currentCredits + (course?.credits ?? 0);

    const exceedsCreditLimit =
        creditsAfterEnrollment > MAX_CREDITS;

    if (!course) return null;

    function handleEnroll() {
        if (!course) return;
        if (!selectedStudent) {
            toast.error("Please select a student.");
            return;
        }

        const studentId = Number(selectedStudent);

        if (Number.isNaN(studentId)) {
            toast.error("Invalid student selected.");
            return;
        }

        /*
         * Prevent enrollment if the student would exceed
         * the 15-credit maximum.
         */
        if (exceedsCreditLimit && course) {
            toast.error(
                `Cannot enroll this student. They currently have ${currentCredits} credits, and ${course.credits} credits would bring them to ${creditsAfterEnrollment}. The maximum is ${MAX_CREDITS} credits.`
            );
            return;
        }

        enrollMutation.mutate(
            {
                courseCode: course.code,
                studentId,
            },
            {
                onSuccess: () => {
                    const student = allStudents?.find(
                        (student) =>
                            student.studentId === studentId
                    );

                    toast.success(
                        `Enrolled ${
                            student?.name ??
                            `student #${studentId}`
                        } in ${course.title}.`
                    );

                    setSelectedStudent(undefined);
                },
                onError: (err) => {
                    toast.error(apiErrorMessage(err));
                },
            }
        );
    }

    function handleRemove(
        studentId: number,
        name: string
    ) {
        if (!course) return;
        if (
            !window.confirm(
                `Remove ${name} from ${course.code}?`
            )
        ) {
            return;
        }

        unenrollMutation.mutate(
            {
                studentId,
                courseCode: course.code,
            },
            {
                onSuccess: () => {
                    toast.success(
                        `Removed ${name} from ${course.code}.`
                    );
                },
                onError: (err) => {
                    toast.error(apiErrorMessage(err));
                },
            }
        );
    }

    return (
        <Modal
            isOpen={!!course}
            onClose={onClose}
            title={`${course.title} Roster`}
            size="lg"
        >
            <div className="space-y-4">

                {/* Enroll Student */}
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[180px]">
                        <label className="block text-sm font-medium text-foreground/80 mb-2">
                            Enroll a Student
                        </label>

                        <Select
                            value={selectedStudent}
                            onValueChange={setSelectedStudent}
                            disabled={studentsLoading}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue
                                    placeholder={
                                        studentsLoading
                                            ? "Loading students..."
                                            : "Select a student"
                                    }
                                />
                            </SelectTrigger>

                            <SelectContent>
                                {availableStudents.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-muted-foreground">
                                        No available students
                                    </div>
                                ) : (
                                    availableStudents.map(
                                        (student) => (
                                            <SelectItem
                                                key={student.studentId}
                                                value={String(
                                                    student.studentId
                                                )}
                                            >
                                                {student.name}{" "}
                                                — #
                                                {
                                                    student.studentId
                                                }
                                            </SelectItem>
                                        )
                                    )
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={handleEnroll}
                        disabled={
                            !selectedStudent ||
                            enrollMutation.isPending ||
                            studentEnrollmentsLoading ||
                            exceedsCreditLimit
                        }
                    >
                        <GraduationCap />

                        {enrollMutation.isPending
                            ? "Enrolling..."
                            : "Enroll"}
                    </Button>
                </div>

                {/* Credit Information */}
                {selectedStudent && (
                    <div
                        className={`rounded-md border p-3 text-sm ${
                            exceedsCreditLimit
                                ? "border-red-300 bg-red-50 text-red-700"
                                : "border-border bg-muted/50 "
                        }`}
                    >
                        {studentEnrollmentsLoading ? (
                            <p>
                                Checking student's current
                                credits...
                            </p>
                        ) : (
                            <>
                                <p>
                                    Current credits:{" "}
                                    <strong>
                                        {currentCredits}
                                    </strong>
                                </p>

                                <p>
                                    Course credits:{" "}
                                    <strong>
                                        {course.credits}
                                    </strong>
                                </p>

                                <p>
                                    Credits after enrollment:{" "}
                                    <strong>
                                        {creditsAfterEnrollment}
                                    </strong>{" "}
                                    / {MAX_CREDITS}
                                </p>

                                {exceedsCreditLimit && (
                                    <p className="mt-2 font-medium">
                                        This student cannot be
                                        enrolled because their
                                        15-credit limit would be
                                        exceeded.
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Loading Roster */}
                {isLoading && (
                    <p className="text-sm text-muted-foreground">
                        Loading roster…
                    </p>
                )}

                {/* Empty Roster */}
                {!isLoading &&
                    !enrollments?.length && (
                        <p className="text-sm text-muted-foreground">
                            No students enrolled in this
                            course yet.
                        </p>
                    )}

                {/* Roster */}
                {!isLoading &&
                    !!enrollments?.length && (
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
                                {enrollments.map(
                                    (enrollment) => (
                                        <TableRow
                                            key={
                                                enrollment.studentId
                                            }
                                        >
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className="font-mono"
                                                >
                                                    #
                                                    {
                                                        enrollment.studentId
                                                    }
                                                </Badge>
                                            </TableCell>

                                            <TableCell className="font-medium">
                                                {
                                                    enrollment
                                                        .student
                                                        ?.name ?? "—"
                                                }
                                            </TableCell>

                                            <TableCell>
                                                {
                                                    enrollment
                                                        .student
                                                        ?.grade ?? "—"
                                                }
                                            </TableCell>

                                            <TableCell>
                                                {
                                                    enrollment.grade ||
                                                    "—"
                                                }
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex justify-end">
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleRemove(
                                                                enrollment.studentId,
                                                                enrollment
                                                                    .student
                                                                    ?.name ??
                                                                    "this student"
                                                            )
                                                        }
                                                        disabled={
                                                            unenrollMutation.isPending
                                                        }
                                                    >
                                                        <Trash2 />
                                                        Remove
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                )}
                            </TableBody>
                        </Table>
                    )}
            </div>
        </Modal>
    );
}
