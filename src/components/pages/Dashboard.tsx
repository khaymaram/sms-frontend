// dashboard page should have cards with summary statistics, charts, and other relevant information for the user
// total students, average gpa, total courses offered, total professors, etc.
import PageHeader from "../ui/PageHeader";
import { Card } from "../ui/Card";
import { UserCheck2, Users, BookOpen, Award, GraduationCap, Star } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../ui/Table";
import { useStudents } from "../../hooks/useStudents";
import { useCourses } from "../../hooks/useCourses";
import { useProfessors } from "../../hooks/useProfessors";
import { useAllEnrollments } from "../../hooks/useEnrollments";
import { Badge } from "../ui/Badge";
import type { CSSProperties } from "react";

const rainbowAccents = [
    { bg: '#FEE2E2', chart: '#F15757', text: '#B91C1C' },
    { bg: '#FFEDD5', chart: '#FA812D', text: '#C2410C' },
    { bg: '#FEF3C7', chart: '#ECBB21', text: '#B45309' },
    { bg: '#DCFCE7', chart: '#38CB6E', text: '#166534' },
    { bg: '#DBEAFE', chart: '#4F8FF7', text: '#1D4ED8' },
    { bg: '#EDE9FE', chart: '#976CF7', text: '#6D28D9' },
];

interface MajorDistributionItem {
    name: string;
    count: number;
    color: string;
}

function pieSlicePath(startPercent: number, endPercent: number) {
    const point = (percent: number) => {
        const angle = percent * Math.PI * 2 - Math.PI / 2;
        return {
            x: 50 + 48 * Math.cos(angle),
            y: 50 + 48 * Math.sin(angle),
        };
    };

    const start = point(startPercent);
    const end = point(endPercent);
    const largeArc = endPercent - startPercent > 0.5 ? 1 : 0;

    return `M 50 50 L ${start.x} ${start.y} A 48 48 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

function MajorDistributionChart({ data, total }: { data: MajorDistributionItem[]; total: number }) {
    if (total === 0) {
        return (
            <div className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">
                No student major data yet.
            </div>
        );
    }

    let cumulative = 0;

    return (
        <div className="flex flex-col items-center gap-5">
            <svg
                viewBox="0 0 100 100"
                className="size-44 shrink-0 drop-shadow-sm"
                role="img"
                aria-label="Student distribution by major"
            >
                {data.map((item) => {
                    const start = cumulative / total;
                    cumulative += item.count;
                    const end = cumulative / total;

                    if (item.count === total) {
                        return (
                            <circle key={item.name} cx="50" cy="50" r="48" fill={item.color}>
                                <title>{item.name}: {item.count} students (100%)</title>
                            </circle>
                        );
                    }

                    return (
                        <path key={item.name} d={pieSlicePath(start, end)} fill={item.color} stroke="white" strokeWidth="1">
                            <title>{item.name}: {item.count} students ({Math.round((item.count / total) * 100)}%)</title>
                        </path>
                    );
                })}
            </svg>

            <div className="grid w-full gap-2">
                {data.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                        <span className="size-3 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
                        <span className="min-w-0 flex-1 truncate" title={item.name}>{item.name}</span>
                        <span className="font-medium tabular-nums">{item.count}</span>
                        <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                            {Math.round((item.count / total) * 100)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function Dashboard() {
    const { data: students = [] } = useStudents();
    const { data: courses = [] } = useCourses();
    const { data: professors = [] } = useProfessors();
    const { data: enrollments = [] } = useAllEnrollments();

    const totalStudents = students.length;
    const totalCourses = courses.length;
    const totalProfessors = professors.length;
    const majorCounts = students.reduce<Record<string, number>>((counts, student) => {
        const majorName = student.major?.name ?? "Unknown";
        counts[majorName] = (counts[majorName] ?? 0) + 1;
        return counts;
    }, {});
    const majorDistribution = Object.entries(majorCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .map(([name, count], index) => ({
            name,
            count,
            color: rainbowAccents[index % rainbowAccents.length].chart,
        }));
    const activeProfessors = new Set(
        courses
            .filter((course) => Boolean(course.professorId))
            .map((course) => course.professorId as string)
    ).size;
    const studentsWithGpa = students.filter(
        (student) => student.gpa !== null
    );

    const averageGpa = studentsWithGpa.length
        ? (
            studentsWithGpa.reduce(
                (sum, student) => sum + student.gpa!,
                0
            ) / studentsWithGpa.length
        ).toFixed(2)
        : "N/A";

    //replace with revenue when financial data is available
    const honorRollStudents = students.filter(
        (student) => student.gpa !== null && student.gpa >= 3.5
    ).length;
    const recentActions = [
        ...students.map((student) => ({
            action: 'Student Added',
            details: `${student.name} was added to the roster`,
            date: student.createdAt ?? new Date().toISOString(),
            accent: rainbowAccents[0],
        })),
        ...courses.map((course) => ({
            action: 'Course Added',
            details: `${course.title} (${course.code}) was added to the catalog`,
            date: course.createdAt ?? new Date().toISOString(),
            accent: rainbowAccents[1],
        })),
        ...professors.map((professor) => ({
            action: 'Professor Added',
            details: `${professor.name} (${professor.id}) joined the faculty`,
            date: professor.createdAt ?? new Date().toISOString(),
            accent: rainbowAccents[2],
        })),
        ...enrollments.map((enrollment) => ({
            action: 'Enrollment',
            details: `${enrollment.student?.name ?? `Student #${enrollment.studentId}`} enrolled in ${enrollment.course?.code ?? enrollment.courseCode}`,
            date: enrollment.enrolledAt ?? enrollment.updatedAt ?? new Date().toISOString(),
            accent: rainbowAccents[4],
        })),
        // ...finances.map((finance) => ({
        //     action: 'Financial',
        //     // want the details to show exactly what happened (paid balance, scholarship update, residency update) and the name of the student rather than id
        //     details: `Financial record for Student #${finance.studentId} was updated`,
        //     date: finance.updatedAt ?? new Date().toISOString(),
        //     accent: rainbowAccents[3],
        // })),
    ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    const stats = [
        {
            label: 'Total Students',
            value: totalStudents.toString(),
            icon: Users,
            accent: rainbowAccents[0],
        },
        {
            label: 'Total Courses',
            value: totalCourses.toString(),
            icon: BookOpen,
            accent: rainbowAccents[1],
        },
        {
            label: 'Total Professors',
            value: totalProfessors.toString(),
            icon: UserCheck2,
            accent: rainbowAccents[2],
        },
        {
            label: 'Average GPA',
            value: averageGpa,
            icon: Award,
            accent: rainbowAccents[3],
        },
        {
            label: 'Active Professors',
            value: activeProfessors.toString(),
            icon: GraduationCap,
            accent: rainbowAccents[4],
        },
        {
            label: 'Honor Roll',
            value: honorRollStudents.toString(),
            icon: Star,
            accent: rainbowAccents[5],
        },
    ];

    return (
        <>
            <div>
                <PageHeader
                    title="Dashboard"
                    description="GRGI University"
                />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    const accent = stat.accent;

                    return (
                        <Card
                            key={stat.label}
                            padding="lg"
                            className="group space-y-4 transition-all duration-200 ease-out hover:-translate-y-1 hover:bg-[var(--stat-hover-bg)] hover:shadow-lg"
                            style={{ "--stat-hover-bg": accent.bg } as CSSProperties}
                        >
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--stat-hover-bg)] font-bold transition-colors duration-200 group-hover:bg-white"
                                style={{ color: accent.text }}
                            >
                                <Icon size={20} />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-2xl font-semibold leading-tight">{stat.value}</h2>
                                <h3 className="text-sm text-muted-foreground">{stat.label}</h3>
                            </div>
                        </Card>
                    );
                })}
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Card padding="responsive" className="lg:col-span-1">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold">Majors</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Student distribution by declared major</p>
                    </div>
                    <MajorDistributionChart data={majorDistribution} total={totalStudents} />
                </Card>

                <Card padding="responsive" className="lg:col-span-2">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold">
                            Recent Actions
                        </h2>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Action</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentActions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                        No recent activity yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                recentActions.map((item) => (
                                    <TableRow key={`${item.action}-${item.details}-${item.date}`} >
                                        <TableCell >
                                            <Badge className="px-2 py-1 text-xs" style={{ backgroundColor: item.accent.bg, color: item.accent.text }} >
                                                {item.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{item.details}</TableCell>
                                        <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </>
    )
}
