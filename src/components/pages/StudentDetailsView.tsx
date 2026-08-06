// page details will have: 
//  back to students button at the top of the page 
// Name
// in the header area there will be: number of courses enrolled, grade level, credits, gpa
// body: table with courses enrolled: id, title, course grade, unenroll from course button
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, Check, Trash2, Plus, HandCoins, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { EnrollmentModal } from "./EnrollmentModal";
import Modal from "../ui/Modal";
import Input from "../ui/Input";

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
    useStudentEnrollments,
    useUpdateEnrollmentGrade,
    useUnenrollStudent,
} from "../../hooks/useEnrollments";

import { useStudent } from "../../hooks/useStudents";
import { useAuth } from "../../context/AuthContext";

import { useFinance, useUpdateFinance } from "../../hooks/useFinances";

import { apiErrorMessage } from "../../lib/axios";

import type { Student, Enrollment, Finance } from "../../types";

const GRADE_OPTIONS = ["A", "B", "C", "D", "F"] as const;

const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
});

const rainbowAccents = [
    { bg: '#FEE2E2', text: '#B91C1C' },
    { bg: '#FFEDD5', text: '#C2410C' },
    { bg: '#FEF3C7', text: '#B45309' },
    { bg: '#DCFCE7', text: '#166534' },
    { bg: '#DBEAFE', text: '#1D4ED8' },
    { bg: '#EDE9FE', text: '#6D28D9' },
];

function getTotalCredits(enrollments: Enrollment[] | undefined) {
    return (
        enrollments?.reduce(
            (sum, enrollment) => sum + (enrollment.course?.credits ?? 0),
            0
        ) ?? 0
    );
}

type StudentDetailsSection = "all" | "courses" | "finances" | "schedule";

export default function StudentDetailsView({ section = "all" }: { section?: StudentDetailsSection }) {
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const canPayFees = isAdmin || user?.role === "student";
    const showCourses = section === "all" || section === "courses";
    const showFinances = section === "all" || section === "finances";
    const showSchedule = section === "all" || section === "schedule";
    const { studentId } = useParams();
    const navigate = useNavigate();
    const parsedStudentId = studentId ? Number(studentId) : user?.role === "student" && user.subjectId ? Number(user.subjectId) : null;
    const [enrollmentStudent, setEnrollmentStudent] = useState<Student | null>(null);

    const {
        data: studentData,
        isLoading: studentLoading,
    } = useStudent(parsedStudentId);

    const student = studentData as Student | undefined;

    const {
        data: financeData,
        isLoading: financeLoading,
    } = useFinance(parsedStudentId)

    const finance = financeData as Finance | undefined;

    const [paymentFinance, setPaymentFinance] = useState<{
        studentId: number;
        paid: number;
        scholarship: number;
        isInState: boolean;
    } | null>(null);
    const updateFinance = useUpdateFinance();
    const [paymentAmount, setPaymentAmount] = useState("");

    const openPayModal = (finance: { studentId: number; paid: number; scholarship: number; isInState: boolean }) => {
        setPaymentFinance(finance);
        setPaymentAmount("");
    };

    const closePayModal = () => {
        setPaymentFinance(null);
        setPaymentAmount("");
    };

    const handlePay = () => {
        if (!paymentFinance) return;

        const amount = Number(paymentAmount);
        if (Number.isNaN(amount) || amount <= 0) {
            toast.error("Enter a valid payment amount greater than 0.");
            return;
        }

        updateFinance.mutate(
            {
                studentId: paymentFinance.studentId,
                input: {
                    scholarship: paymentFinance.scholarship,
                    paid: paymentFinance.paid + amount,
                    isInState: paymentFinance.isInState,
                },
            },
            {
                onSuccess: () => {
                    toast.success("Payment recorded.");
                    closePayModal();
                },
                onError: (error) => toast.error(apiErrorMessage(error)),
            }
        );
    };

    const {
        data: enrollments,
        isLoading: enrollmentsLoading,
    } = useStudentEnrollments(parsedStudentId);

    const totalCredits = useMemo(
        () => getTotalCredits(enrollments),
        [enrollments]
    );

    if (parsedStudentId === null || Number.isNaN(parsedStudentId)) {
        return (
            <div className="p-6">
                <p>Student not found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Back Button */}
            {isAdmin && <Button
                variant="outline"
                onClick={() => navigate("/roster")}
                className="w-fit"
            >
                <ArrowLeft />
                Back to Roster
            </Button>}

            {/* Course Header */}
            {!studentLoading && student && (
                <div className="space-y-1">

                    <h1 className="text-4xl font-bold tracking-tight">
                        {student.name}
                    </h1>

                    <p className="text-lg text-muted-foreground font-mono">
                        Student ID: {student.studentId} | Major: {student.major?.name}
                    </p>
                    
                </div>
            )}

            {/* Statistics */}
            {showCourses && !studentLoading && student && (
                <Card padding="responsive">

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">

                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                                Courses Enrolled
                            </p>

                            <p className="mt-1 text-3xl font-bold">
                                {enrollments?.length ?? 0}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                                Grade
                            </p>

                            <p className="mt-1 text-3xl font-bold">

                                {student.grade}

                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                                Credits
                            </p>

                            <p className="mt-1 text-3xl font-bold">
                                {totalCredits}
                            </p>
                        </div>


                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                                GPA
                            </p>

                            <p className="mt-1 text-3xl font-bold">
                                {student.gpa === null ? "N/A" : student.gpa.toFixed(2)}
                            </p>
                        </div>

                    </div>

                </Card>
            )}

            {/* Loading */}
            {showCourses && enrollmentsLoading && (
                <Card padding="lg">
                    <p className="text-muted-foreground">
                        Loading enrollments...
                    </p>
                </Card>
            )}

            {/* Empty */}
            {showCourses && !enrollmentsLoading && student &&
                (!enrollments || enrollments.length === 0) && (
                    <Card padding="lg">

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                            <p className="text-muted-foreground center-align">
                                {student.name} is not enrolled in any courses.
                            </p>


                            <Button onClick={() => setEnrollmentStudent(student)}>
                                <Plus />
                                Add Course
                            </Button>
                        </div>

                    </Card>
                )}

            {/* Roster */}
            {showCourses && !enrollmentsLoading &&
                enrollments && student &&
                enrollments.length > 0 && (

                    <Card padding="responsive">

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">

                            <h2 className="text-xl font-semibold">
                                {student.name}'s Courses
                            </h2>



                            <Button onClick={() => setEnrollmentStudent(student)}>
                                <Plus />
                                Add Course
                            </Button>

                        </div>

                        <Table>

                            <TableHeader>

                                <TableRow>

                                    <TableHead>
                                        Course ID
                                    </TableHead>

                                    <TableHead>
                                        Title
                                    </TableHead>

                                    <TableHead>
                                        Professor
                                    </TableHead>

                                    <TableHead>
                                        Credits
                                    </TableHead>

                                    <TableHead>
                                        Schedule
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
                                        key={enrollment.courseCode}
                                        enrollment={enrollment}
                                        professorName={
                                            enrollment.course?.professor?.name
                                        }
                                        canEditGrade={isAdmin}
                                    />
                                ))}

                            </TableBody>

                        </Table>

                    </Card>

                )}

            {/* Finances */}
            {showFinances && finance && !financeLoading && student && (
                <div className={section === "all" ? "mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3" : "mb-4"}>
                    <Card padding={"responsive"}>
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold">
                                {student.name}'s Finances
                            </h2>
                            <div>
                                <Badge style={{
                                    backgroundColor: finance.isInState ? rainbowAccents[4].bg : rainbowAccents[5].bg,
                                    color: finance.isInState ? rainbowAccents[4].text : rainbowAccents[5].text,
                                }}>
                                    {finance.isInState ? "In-state" : "Out-of-state"}
                                </Badge>
                            </div>
                        </div>
                        {/* fix so that the table automaticallly refreshes when the payment is made */}
                        <Table >
                            <TableBody>
                                <TableRow >
                                    <TableCell>Tuition:</TableCell>
                                    <TableCell align="right">{currency.format(finance.tuition)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Scholarships:</TableCell>
                                    <TableCell align="right">{currency.format(finance.scholarship)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Paid:</TableCell>
                                    <TableCell align="right">{currency.format(finance.paid)}</TableCell>
                                </TableRow>
                                <TableRow style={{ backgroundColor: finance.remaining > 0 ? rainbowAccents[0].bg : rainbowAccents[3].bg, color: finance.remaining > 0 ? rainbowAccents[0].text : rainbowAccents[3].text }}>
                                    <TableCell>Balance Remaining:</TableCell>
                                    <TableCell align="right">{currency.format(finance.remaining)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>

                        <br></br>
                        {canPayFees && <Button
                            type="button"
                            variant={finance.remaining === 0 ? "outline" : "default"}
                            onClick={() => openPayModal(finance)}
                            disabled={finance.remaining === 0}>
                            {finance.remaining > 0 ?
                                <HandCoins /> : <CheckCircle2 />}
                            {finance.remaining === 0 ? "Paid" : "Pay"}
                        </Button>}
                    </Card>
                    {section === "all" && <WeeklyCourseSchedule enrollments={enrollments ?? []} />}
                </div>

            )}

            {showFinances && !financeLoading && !finance && student && (
                <div className={section === "all" ? "mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3" : "mb-4"}>
                    <Card padding="responsive">
                        <h2 className="text-xl font-semibold">{student.name}'s Finances</h2>
                        <p className="mt-3 text-sm text-muted-foreground">
                            No financial record is available for this student.
                        </p>
                    </Card>
                    {section === "all" && <WeeklyCourseSchedule enrollments={enrollments ?? []} />}
                </div>
            )}
            {showSchedule && section === "schedule" && !enrollmentsLoading && (
                <WeeklyCourseSchedule enrollments={enrollments ?? []} />
            )}
            {/* fix so that it doesnt require a manual refresh after every payment */}
            <EnrollmentModal student={enrollmentStudent} onClose={() => setEnrollmentStudent(null)} />
            {canPayFees && <Modal isOpen={!!paymentFinance} onClose={closePayModal} title="Pay Student Fees">
                <div className="space-y-4">
                    <Input
                        label="Payment Amount ($)"
                        inputMode="decimal"
                        value={paymentAmount}
                        onChange={(event) => setPaymentAmount(event.target.value)}
                        placeholder={finance?.remaining ? `Remaining Balance: ${currency.format(finance.remaining)}` : ""}
                    />

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={closePayModal}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={handlePay} disabled={updateFinance.isPending}>
                            {updateFinance.isPending ? "Processing..." : "Confirm Payment"}
                        </Button>
                    </div>
                </div>
            </Modal>}
        </div>
    );
}

function RosterRow({
    enrollment,
    professorName,
    canEditGrade,
}: {
    enrollment: Enrollment;
    professorName?: string;
    canEditGrade: boolean;
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
                        `Updated grade for ${enrollment.course?.title ?? "course"
                        }.`
                    ),
                onError: (err) =>
                    toast.error(apiErrorMessage(err)),
            }
        );
    }

    function handleRemove() {
        if (!window.confirm(`Remove ${enrollment.course?.title ?? "this course"} from ${enrollment.student?.name}?`)
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
                    toast.success(`Removed ${enrollment.course?.title ?? "course"}.`),
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
                    {enrollment.courseCode}
                </Badge>

            </TableCell>

            <TableCell className="font-medium">
                {enrollment.course?.title ?? "—"}
            </TableCell>

            <TableCell>
                {professorName ?? <span className="text-muted-foreground">TBD</span>}
            </TableCell>

            <TableCell>
                {enrollment.course?.credits ?? "—"}
            </TableCell>

            <TableCell>
                {enrollment.course ? (
                    <div className="flex min-w-48 flex-col gap-1.5">
                        <div className="flex gap-1">
                            {(enrollment.course.meetingDays ?? []).map((day) => (
                                <span
                                    key={day}
                                    className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-[#DBEAFE] px-1.5 text-xs font-semibold text-[#1D4ED8]"
                                >
                                    {day}
                                </span>
                            ))}
                        </div>
                        <span className="flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
                            <CalendarClock className="size-3.5" />
                            {enrollment.course.startTime
                                ? `${formatCourseTime(enrollment.course.startTime)} – ${formatCourseEndTime(enrollment.course.startTime)}`
                                : "Schedule not set"}
                        </span>
                    </div>
                ) : "—"}
            </TableCell>

            <TableCell>

                {canEditGrade ? <div className="flex items-center gap-2">

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

                </div> : <Badge variant="outline">{enrollment.grade || "Not graded"}</Badge>}

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

function formatCourseTime(value: string) {
    const [hour, minute] = value.split(":").map(Number);
    const suffix = hour >= 12 ? "PM" : "AM";
    return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

const scheduleDays = [
    { key: "M", label: "Monday" },
    { key: "T", label: "Tuesday" },
    { key: "W", label: "Wednesday" },
    { key: "Th", label: "Thursday" },
    { key: "F", label: "Friday" },
] as const;

function WeeklyCourseSchedule({ enrollments }: { enrollments: Enrollment[] }) {
    const courseAccents = new Map(
        [...new Set(enrollments.map((enrollment) => enrollment.courseCode))]
            .sort()
            .map((courseCode, index) => [
                courseCode,
                rainbowAccents[rainbowAccents.length - 1 - (index % rainbowAccents.length)],
            ])
    );

    return (
        <Card padding="responsive" className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#DBEAFE] text-[#1D4ED8]">
                    <CalendarClock className="size-4" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold">Weekly Schedule</h2>
                    <p className="text-xs text-muted-foreground">All enrolled courses, Monday through Friday</p>
                </div>
            </div>

            <div className="divide-y rounded-lg border bg-background px-3">
                {scheduleDays.map((day) => {
                    const courses = enrollments
                        .filter((enrollment) => enrollment.course?.meetingDays?.includes(day.key))
                        .sort((a, b) => (a.course?.startTime ?? "").localeCompare(b.course?.startTime ?? ""));

                    return (
                        <div key={day.key} className="grid min-h-14 grid-cols-[5.5rem_1fr] items-center gap-3 py-2.5">
                            <div className="flex items-center gap-2">
                                <span className="rounded-md bg-[#DBEAFE] px-1.5 py-0.5 text-xs font-bold text-[#1D4ED8]">
                                    {day.key}
                                </span>
                                <span className="text-xs font-medium">{day.label.slice(0, 3)}</span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {courses.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No classes</p>
                                ) : courses.map((enrollment) => {
                                    const accent = courseAccents.get(enrollment.courseCode) ?? rainbowAccents[4];
                                    return (
                                        <div
                                            key={enrollment.courseCode}
                                            className="min-w-28 rounded-md border-l-2 px-2 py-1.5"
                                            style={{ backgroundColor: accent.bg, borderColor: accent.text }}
                                        >
                                            <p className="truncate text-xs font-semibold" style={{ color: accent.text }} title={enrollment.course?.title}>
                                                {enrollment.courseCode}
                                            </p>
                                            <p className="mt-0.5 whitespace-nowrap text-[11px]" style={{ color: accent.text }}>
                                                {enrollment.course?.startTime
                                                    ? `${formatCourseTime(enrollment.course.startTime)} – ${formatCourseEndTime(enrollment.course.startTime)}`
                                                    : "Time not set"}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}

function formatCourseEndTime(value: string) {
    const [hour, minute] = value.split(":").map(Number);
    const total = hour * 60 + minute + 60;
    return formatCourseTime(`${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`);
}
