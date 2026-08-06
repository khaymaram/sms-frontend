// EnrollmentModal.tsx lets a user enroll a student in a course, remove an
// existing enrollment, and record/edit the final grade for a course the
// student has taken.
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2, GraduationCap } from "lucide-react";
import Modal from "../ui/Modal";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../ui/Table";
import { useCourses } from "../../hooks/useCourses";
import {
  useStudentEnrollments,
  useEnrollStudent,
  useUnenrollStudent,
} from "../../hooks/useEnrollments";
import { apiErrorMessage } from "../../lib/axios";
import type { Student } from "../../types";
// const GRADE_OPTIONS = ["A", "B", "C", "D", "F"] as const;
interface EnrollmentModalProps {
  student: Student | null;
  onClose: () => void;
}

export function EnrollmentModal({ student, onClose }: EnrollmentModalProps) {
  const [selectedCourse, setSelectedCourse] = useState<string>("");

  const { data: enrollments, isLoading } = useStudentEnrollments(student?.studentId ?? null);
  const { data: allCourses } = useCourses({ type: "all" });
  const enrollMutation = useEnrollStudent();
  const unenrollMutation = useUnenrollStudent();

  const enrolledCodes = useMemo(
    () => new Set((enrollments ?? []).map((e) => e.courseCode)),
    [enrollments],
  );

  const currentCredits = useMemo(
    () => (enrollments ?? []).reduce((sum, enrollment) => sum + (enrollment.course?.credits ?? 0), 0),
    [enrollments],
  );

  const selectedCourseCredits = useMemo(
    () => (allCourses ?? []).find((course) => course.code === selectedCourse)?.credits,
    [allCourses, selectedCourse],
  );

  const availableCourses = (allCourses ?? []).filter(
    (course) => !enrolledCodes.has(course.code) && currentCredits + course.credits <= 15,
  );

  const isOverCreditLimit = selectedCourseCredits !== undefined && currentCredits + selectedCourseCredits > 15;

  if (!student) return null;

  function handleEnroll() {
    if (!student || !selectedCourse) return;
    if (isOverCreditLimit) {
      toast.error("This enrollment would push the student over 15 credits.");
      return;
    }

    enrollMutation.mutate(
      { studentId: student.studentId, courseCode: selectedCourse },
      {
        onSuccess: () => {
          toast.success(`Enrolled ${student.name} in ${selectedCourse}.`);
          setSelectedCourse("");
        },
        onError: (err) => toast.error(apiErrorMessage(err)),
      },
    );
  }

  function handleUnenroll(courseCode: string) {
    if (!student) return;
    if (!window.confirm(`Remove ${student.name} from ${courseCode}?`)) return;
    unenrollMutation.mutate(
      { studentId: student.studentId, courseCode },
      {
        onSuccess: () => toast.success(`Removed ${student.name} from ${courseCode}.`),
        onError: (err) => toast.error(apiErrorMessage(err)),
      },
    );
  }

  return (
    <Modal isOpen={!!student} onClose={onClose} title={`${student.name}'s Courses`}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Enroll in a course
            </label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {availableCourses.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {currentCredits >= 15
                      ? "Student is already at the 15-credit limit"
                      : "No available courses"}
                  </div>
                ) : (
                  availableCourses.map((course) => (
                    <SelectItem key={course.code} value={course.code}>
                      {course.code} — {course.title} ({course.credits} credits)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleEnroll}
            disabled={!selectedCourse || enrollMutation.isPending || isOverCreditLimit || currentCredits >= 15}
          >
            <GraduationCap />
            Enroll
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Semester credit limit: {currentCredits} / 15
        </p>

        {isLoading && <p className="text-sm text-muted-foreground">Loading courses…</p>}

        {!isLoading && !enrollments?.length && (
          <p className="text-sm text-muted-foreground">Not enrolled in any courses yet.</p>
        )}

        {!isLoading && !!enrollments?.length && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Credits</TableHead>
                {/* <TableHead>Grade</TableHead> */}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((enrollment) => (
                <EnrollmentRow
                  key={enrollment.courseCode}
                  courseCode={enrollment.courseCode}
                  title={enrollment.course?.title}
                  credits={enrollment.course?.credits}
                  onRemove={() => handleUnenroll(enrollment.courseCode)}
                  removing={unenrollMutation.isPending}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </Modal>
  );
}

function EnrollmentRow({
  courseCode,
  title,
  credits,
  onRemove,
  removing,
}: {
  courseCode: string;
  title?: string;
  credits?: number;
  onRemove: () => void;
  removing: boolean;
}) {
  return (
    <TableRow>
      <TableCell>
        <Badge variant="outline" className="font-mono">
          {courseCode}
        </Badge>
      </TableCell>
      <TableCell>{title ?? "—"}</TableCell>
      <TableCell>{credits ?? "—"}</TableCell>
      {/* <TableCell>
        <div className="flex items-center gap-2">
          <Select
            value={gradeInput || "NONE"}
            onValueChange={(value) => setGradeInput(value === "NONE" ? "" : value)}
          >
            <SelectTrigger className="w-24">
              <SelectValue placeholder="-" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="NONE">-</SelectItem>

              {GRADE_OPTIONS.map((grade) => (
                <SelectItem key={grade} value={grade}>
                  {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveGrade}
            disabled={updateGrade.isPending || gradeInput === (grade ?? "")}
          >
            <Check />
          </Button>
        </div>
      </TableCell> */}
      <TableCell>
        <div className="flex justify-end">
          <Button variant="destructive" size="sm" onClick={onRemove} disabled={removing}>
            <Trash2 />
            Remove
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
