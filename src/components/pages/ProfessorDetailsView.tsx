import { useMemo, useState } from "react";
import { ArrowLeft, CalendarClock, Plus } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { useProfessor } from "../../hooks/useProfessors";
import { useCourses, useUpdateCourses } from "../../hooks/useCourses";
import { useAllEnrollments } from "../../hooks/useEnrollments";
import { apiErrorMessage } from "../../lib/axios";
import type { Course } from "../../types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import Modal from "../ui/Modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/Table";
import { useAuth } from "../../context/AuthContext";

const scheduleDays = [
    { key: "M", label: "Monday" }, { key: "T", label: "Tuesday" },
    { key: "W", label: "Wednesday" }, { key: "Th", label: "Thursday" },
    { key: "F", label: "Friday" },
] as const;

const rainbowAccents = [
    { bg: "#FEE2E2", text: "#B91C1C" }, { bg: "#FFEDD5", text: "#C2410C" },
    { bg: "#FEF3C7", text: "#B45309" }, { bg: "#DCFCE7", text: "#166534" },
    { bg: "#DBEAFE", text: "#1D4ED8" }, { bg: "#EDE9FE", text: "#6D28D9" },
];

function formatTime(value: string) {
    const [hour, minute] = value.split(":").map(Number);
    return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

function endTime(value: string) {
    const [hour, minute] = value.split(":").map(Number);
    const total = hour * 60 + minute + 60;
    return formatTime(`${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`);
}

export default function ProfessorDetailsView() {
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const { professorId: routeProfessorId } = useParams();
    const professorId = routeProfessorId ?? (user?.role === "professor" ? user.subjectId ?? undefined : undefined);
    const navigate = useNavigate();
    const [assignOpen, setAssignOpen] = useState(false);
    const [selectedCourseCode, setSelectedCourseCode] = useState("");
    const { data: professor, isLoading: professorLoading } = useProfessor(professorId ?? null);
    const { data: allCourses = [], isLoading: coursesLoading } = useCourses();
    const { data: enrollments = [] } = useAllEnrollments();
    const updateCourse = useUpdateCourses();

    const courses = useMemo(() => allCourses.filter((course) => course.professorId === professorId), [allCourses, professorId]);
    const availableCourses = allCourses.filter((course) => !course.professorId);
    const courseCodes = new Set(courses.map((course) => course.code));
    const studentsTaught = new Set(enrollments.filter((item) => courseCodes.has(item.courseCode)).map((item) => item.studentId)).size;
    const hoursWorked = courses.reduce((total, course) => total + course.meetingDays.length, 0);
    const rosterCounts = useMemo(() => {
        const counts = new Map<string, number>();
        enrollments.forEach((item) => counts.set(item.courseCode, (counts.get(item.courseCode) ?? 0) + 1));
        return counts;
    }, [enrollments]);

    function assignCourse() {
        const course = allCourses.find((item) => item.code === selectedCourseCode);
        if (!course || !professorId) return;
        updateCourse.mutate({
            courseCode: course.code,
            input: { code: course.code, title: course.title, credits: course.credits, professorId, meetingDays: course.meetingDays, startTime: course.startTime },
        }, {
            onSuccess: () => {
                toast.success(`${course.code} assigned to ${professor?.name ?? professorId}.`);
                setSelectedCourseCode("");
                setAssignOpen(false);
            },
            onError: (error) => toast.error(apiErrorMessage(error)),
        });
    }

    if (!professorId) return <p>Professor not found.</p>;

    return (
        <div className="space-y-6">
            {isAdmin && <Button variant="outline" onClick={() => navigate("/professors")} className="w-fit"><ArrowLeft /> Back to Professors</Button>}

            {!professorLoading && professor && <div className="space-y-1">
                <h1 className="text-4xl font-bold tracking-tight">{professor.name}</h1>
                <p className="font-mono text-lg text-muted-foreground">Professor ID: {professor.id}</p>
            </div>}

            <Card padding="responsive">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {[
                        { label: "Courses Taught", value: courses.length },
                        { label: "Students Taught", value: studentsTaught },
                        { label: "Hours / Week", value: hoursWorked },
                    ].map((stat) => <div key={stat.label} className="text-center">
                        <p className="text-3xl font-bold">{stat.value}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                    </div>)}
                </div>
            </Card>

            <Card padding="responsive">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div><h2 className="text-xl font-semibold">Courses Being Taught</h2><p className="text-sm text-muted-foreground">Current teaching assignments</p></div>
                    {isAdmin && <Button onClick={() => setAssignOpen(true)}><Plus /> Add Course</Button>}
                </div>
                {coursesLoading ? <p className="text-sm text-muted-foreground">Loading courses...</p> : courses.length === 0 ?
                    <p className="py-8 text-center text-sm text-muted-foreground">No courses assigned.</p> :
                    <Table><TableHeader><TableRow><TableHead>Course</TableHead><TableHead>Title</TableHead><TableHead>Credits</TableHead><TableHead>Students</TableHead><TableHead>Schedule</TableHead></TableRow></TableHeader>
                        <TableBody>{courses.map((course) => <TableRow key={course.code}>
                            <TableCell><Link to={`/courses/${course.code}`}><Badge variant="outline" className="cursor-pointer font-mono transition-colors hover:bg-accent hover:text-accent-foreground">{course.code}</Badge></Link></TableCell>
                            <TableCell className="font-medium">{course.title}</TableCell><TableCell>{course.credits}</TableCell>
                            <TableCell>{rosterCounts.get(course.code) ?? 0}</TableCell><TableCell><CourseSchedule course={course} /></TableCell>
                        </TableRow>)}</TableBody></Table>}
            </Card>

            <ProfessorWeeklySchedule courses={courses} />

            {isAdmin && <Modal isOpen={assignOpen} onClose={() => setAssignOpen(false)} title="Assign a Course">
                <div className="space-y-4"><div><label htmlFor="assign-course" className="mb-2 block text-sm font-medium">Course</label>
                    <Select value={selectedCourseCode} onValueChange={setSelectedCourseCode}><SelectTrigger id="assign-course" className="w-full"><SelectValue placeholder="Select an unassigned course" /></SelectTrigger>
                        <SelectContent>{availableCourses.map((course) => <SelectItem key={course.code} value={course.code}>{course.code} — {course.title}</SelectItem>)}</SelectContent></Select>
                    {availableCourses.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No unassigned courses are available.</p>}
                </div><div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
                    <Button onClick={assignCourse} disabled={!selectedCourseCode || updateCourse.isPending}>{updateCourse.isPending ? "Assigning..." : "Assign Course"}</Button></div></div>
            </Modal>}
        </div>
    );
}

function CourseSchedule({ course }: { course: Course }) {
    return <div className="min-w-44"><div className="mb-1 flex gap-1">{course.meetingDays.map((day) =>
        <span key={day} className="rounded bg-[#DBEAFE] px-1.5 py-0.5 text-xs font-semibold text-[#1D4ED8]">{day}</span>)}</div>
        <span className="whitespace-nowrap text-xs text-muted-foreground">{formatTime(course.startTime)} – {endTime(course.startTime)}</span></div>;
}

function ProfessorWeeklySchedule({ courses }: { courses: Course[] }) {
    const accents = new Map([...courses].sort((a, b) => a.code.localeCompare(b.code)).map((course, index) => [
        course.code, rainbowAccents[rainbowAccents.length - 1 - (index % rainbowAccents.length)],
    ]));
    return <Card padding="responsive">
        <div className="mb-5 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#DBEAFE] text-[#1D4ED8]"><CalendarClock className="size-5" /></div>
            <div><h2 className="text-xl font-semibold">Weekly Schedule</h2><p className="text-sm text-muted-foreground">Teaching schedule, Monday through Friday</p></div>
        </div>
        <br></br>
        <div className="overflow-x-auto rounded-xl border bg-background">
            <div className="grid min-w-[760px] grid-cols-5">
                {scheduleDays.map((day) => {
                    const dayCourses = courses
                        .filter((course) => course.meetingDays.includes(day.key))
                        .sort((a, b) => a.startTime.localeCompare(b.startTime));

                    return (
                        <div key={day.key} className="flex min-h-64 flex-col">
                            <div className="border-b bg-muted/50 px-3 py-3 text-center">
                                <p className="text-sm font-semibold">{day.label}</p>
                            </div>
                            <div
                                className="min-h-[13rem] flex-1 space-y-4 p-3"
                                style={{ borderRight: day.key === "F" ? undefined : "1px solid var(--border)" }}
                            >
                                {dayCourses.length === 0 ? (
                                    <p className="py-6 text-center text-xs text-muted-foreground">No classes</p>
                                ) : dayCourses.map((course) => {
                                    const accent = accents.get(course.code) ?? rainbowAccents[4];
                                    return (
                                        <div
                                            key={course.code}
                                            className="rounded-lg border-l-4 px-3 py-2.5 shadow-sm"
                                            style={{ backgroundColor: accent.bg, borderColor: accent.text, color: accent.text }}
                                        >
                                            <p className="truncate text-sm font-bold">{course.code}</p>
                                            <p className="mt-0.5 truncate text-xs" title={course.title}>{course.title}</p>
                                            <p className="mt-2 whitespace-nowrap text-[11px] font-medium">
                                                {formatTime(course.startTime)} – {endTime(course.startTime)}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </Card>;
}
