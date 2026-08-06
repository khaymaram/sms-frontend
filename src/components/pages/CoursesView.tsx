import { useEffect, useState, type FormEvent } from "react";
import { CalendarClock, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useProfessors } from "../../hooks/useProfessors";
import { useCoursesPaginated, useDeleteCourse, useUpdateCourses, useCreateCourse, type CourseFilter } from "../../hooks/useCourses";
import { apiErrorMessage } from "../../lib/axios";
import { CourseInputSchema, type Course, type CourseInput } from "../../types";
import PageHeader from "../ui/PageHeader";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { Pagination } from "../ui/Pagination";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../ui/Select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../ui/Table";
import { useAuth } from "../../context/AuthContext";

type FilterMode = "all" | "credits" | "title" | "professorId" | "code";

const WEEKDAYS = ["M", "T", "W", "Th", "F"] as const;
const START_HOURS = Array.from({ length: 9 }, (_, index) => String(8 + index).padStart(2, "0"));

function formatTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function formatTimeAfterHour(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  const total = hour * 60 + minute + 60;
  return formatTime(`${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`);
}

function CourseSchedule({ course }: { course: Course }) {
  return (
    <div className="flex min-w-48 flex-col gap-1.5">
      <div className="flex gap-1" aria-label={`Meets ${course.meetingDays.join(", ")}`}>
        {course.meetingDays.map((day) => (
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
        {formatTime(course.startTime)} – {formatTimeAfterHour(course.startTime)}
      </span>
    </div>
  );
}

export function CoursesView() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const emptyForm = { title: "", credits: "", code: "", professorId: "", meetingDays: [] as string[], startTime: "" };

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [mode, setMode] = useState<FilterMode>("all");
  const [creditInput, setCreditInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [profInput, setProfInput] = useState("");
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const { data: professors } = useProfessors({ type: "all" }, isAdmin);

  const [addFieldErrors, setAddFieldErrors] =
    useState<Partial<Record<keyof CourseInput, string>>>({});

  const [editForm, setEditForm] = useState(emptyForm);

  const [editFieldErrors, setEditFieldErrors] =
    useState<Partial<Record<keyof CourseInput, string>>>({});

  const filter: CourseFilter =
    mode === "credits" && creditInput
      ? { type: "credits", credits: Number(creditInput) }
      : mode === "title" && titleInput
        ? { type: "title", title: String(titleInput) }
        : mode === "professorId" && profInput
          ? { type: "professorId", professorId: String(profInput) }
          : mode === "code" && codeInput
            ? { type: "code", code: String(codeInput) }
            : { type: "all" };

  useEffect(() => {
    setPage(1);
  }, [mode, creditInput, titleInput, profInput, codeInput,]);

  const { data: data, isLoading, isFetching, isError, error } = useCoursesPaginated({ page, pageSize, filter });
  const courses = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.total ?? 0;
  const deleteCourse = useDeleteCourse();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourses();


  function handleDelete(course: Course) {
    if (!window.confirm(`Remove ${course.title} (${course.code}) from the directory`)) return;
    deleteCourse.mutate(course.code, {
      onSuccess: () => toast.success(`Removed ${course.title} from the directory.`),
      onError: (err) => toast.error(apiErrorMessage(err)),
    });
  }

  function handleAddFormChange(field: keyof typeof addForm, value: string | string[]) {
    setAddForm((prev) => ({ ...prev, [field]: value }));
  }
  function handleEditFormChange(
    field: keyof typeof editForm,
    value: string | string[]
  ) {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function openEditCourseModal(course: Course) {
    setEditingCourse(course);

    setEditForm({
      title: course.title,
      professorId: course.professorId ?? "",
      credits: String(course.credits),
      code: course.code,
	  meetingDays: course.meetingDays,
	  startTime: course.startTime,
    });

    setEditFieldErrors({});
  }

  function closeEditCourseModal() {
    setEditingCourse(null);
    setEditForm({ ...emptyForm });
    setEditFieldErrors({});
  }
  function openAddCourseModal() {
    setAddForm({ ...emptyForm });
    setAddFieldErrors({});
    setIsAddModalOpen(true);
  }

  function closeAddCourseModal() {
    setIsAddModalOpen(false);
    setAddForm({ ...emptyForm });
    setAddFieldErrors({});
  }

  function addCourse(e: FormEvent) {
    e.preventDefault();

    const result = CourseInputSchema.safeParse(addForm);
    if (!result.success) {
      const errors: Partial<Record<keyof CourseInput, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof CourseInput;
        errors[key] = issue.message;
      }
      setAddFieldErrors(errors);
      return;
    }

    setAddFieldErrors({});
    createCourse.mutate(result.data, {
      onSuccess: () => {
        setAddForm({ ...emptyForm });
        setIsAddModalOpen(false);
        toast.success(`Created ${result.data.title} (${result.data.code}) in the directory.`);
      },
      onError: (err) => toast.error(apiErrorMessage(err)),
    });
  }
  function editCourse(e: FormEvent) {
    e.preventDefault();

    if (!editingCourse) return;

    const result = CourseInputSchema.safeParse(editForm);

    if (!result.success) {
      const errors: Partial<Record<keyof CourseInput, string>> = {};

      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof CourseInput;
        errors[key] = issue.message;
      }

      setEditFieldErrors(errors);
      return;
    }

    setEditFieldErrors({});

    updateCourse.mutate(
      {
        courseCode: editingCourse.code,
        input: result.data,
      },
      {
        onSuccess: () => {
          toast.success(`Updated ${result.data.code}.`);
          closeEditCourseModal();
        },
        onError: (err) => toast.error(apiErrorMessage(err)),
      }
    );
  }
  return (
    <div>
      <PageHeader
        title={user?.role === "professor" ? "My Courses" : "Course Directory"}
        description={user?.role === "professor" ? "View the courses you teach and manage their students." : "View, filter, edit, add or remove courses."}
        actions={isAdmin ? (
          <Button onClick={openAddCourseModal}>
            <Plus />
            Add a Course
          </Button>
        ) : undefined}
      />

      <Card padding="responsive" className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-full sm:w-56">
            <label htmlFor="filter-mode" className="block text-sm font-medium text-foreground/80 mb-2">
              Show
            </label>
            <Select
              value={mode}
              onValueChange={(value) => setMode(value as FilterMode)}
            >
              <SelectTrigger id="filter-mode" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All courses</SelectItem>
                <SelectItem value="credits">By credits</SelectItem>
                <SelectItem value="title">Search by course title</SelectItem>
                {isAdmin && <SelectItem value="professorId">Search by professor</SelectItem>}
                <SelectItem value="code">Search by course code</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "credits" && (
            <div className="w-full sm:w-40">
              <Input
                label="Credits"
                id="credits-filter"
                inputMode="numeric"
                placeholder="3"
                value={creditInput}
                onChange={(e) => setCreditInput(e.target.value)}
              />
            </div>
          )}

          {mode === "title" && (
            <div className="w-full sm:w-64">
              <Input
                label="Course Title"
                id="title-filter"
                inputMode="text"
                placeholder="Intro to OOP"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
              />
            </div>
          )}

          {mode === "professorId" && (
            <div className="w-full sm:w-64">
              <Select
                value={profInput}
                onValueChange={(value) =>
                  setProfInput(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Professor" />
                </SelectTrigger>

                <SelectContent>

                  {professors?.map((professor) => (
                    <SelectItem
                      key={professor.id}
                      value={professor.id}
                    >
                      {professor.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="NONE">
                    No Professor
                  </SelectItem>
                </SelectContent>

              </Select>
            </div>
          )}


          {mode === "code" && (
            <div className="w-full sm:w-48">
              <Input
                label="Course Code"
                id="code-filter"
                inputMode="text"
                placeholder="CMSC131"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
              />
            </div>
          )}
        </div>
      </Card>

      {isLoading && <p className="text-sm text-muted-foreground">Loading courses…</p>}
      {isError && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {apiErrorMessage(error)}
        </div>
      )}

      {!isLoading && !isError && !courses?.length && (
        <Card padding="lg" className="text-center text-muted-foreground">
          No courses in directory yet.
        </Card>
      )}

      {!isLoading && !!courses?.length && (
        <>
          <div className={isFetching ? "opacity-70 transition-opacity" : undefined}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Professor</TableHead>
                  <TableHead>Credits</TableHead>
				  <TableHead>Schedule</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) =>
                (
                  <TableRow key={course.code}>
                    {isAdmin && <TableCell>
                      <Link
                        to={`/courses/${course.code}`}
                        className="inline-block"
                      >
                        <Badge
                          variant="outline"
                          className="font-mono cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          {course.code}
                        </Badge>
                      </Link>
                    </TableCell>}
                    <TableCell className="font-medium">{course.title}</TableCell>
                    <TableCell>
                      {course.professor?.name ?? "TBD"}
                    </TableCell>
                    <TableCell>{course.credits}</TableCell>
					<TableCell><CourseSchedule course={course} /></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditCourseModal(course)}
                        >
                          <Pencil />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(course)}
                          disabled={deleteCourse.isPending}
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
          </div>
          <Pagination page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }} />
        </>

      )}

      {isAdmin && <Modal isOpen={isAddModalOpen} onClose={closeAddCourseModal} title="Add a Course">
        <form className="space-y-4" onSubmit={addCourse}>
          <Input
            label="Course Title"
            id="add-course-title"
            value={addForm.title}
            onChange={(e) => handleAddFormChange("title", e.target.value)}
            error={addFieldErrors.title}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="add-course-professor" className="mb-2 block text-sm font-medium text-foreground/80">
                Professor
              </label>
              <Select
                value={addForm.professorId || "NONE"}
                onValueChange={(value) => handleAddFormChange("professorId", value === "NONE" ? "" : value)}
              >
                <SelectTrigger id="add-course-professor" className="w-full">
                  <SelectValue placeholder="Select Professor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No Professor</SelectItem>
                  {professors?.map((professor) => (
                    <SelectItem key={professor.id} value={professor.id}>
                      {professor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Input
              label="Credits"
              id="add-course-credits"
              inputMode="numeric"
              value={addForm.credits}
              onChange={(e) => handleAddFormChange("credits", e.target.value)}
              error={addFieldErrors.credits}
              required
            />
          </div>

          <Input
            label="Course Code"
            id="add-course-code"
            value={addForm.code}
            onChange={(e) => handleAddFormChange("code", e.target.value)}
            error={addFieldErrors.code}
            required
          />

		  <ScheduleFields
			fieldId="add-course"
			meetingDays={addForm.meetingDays}
			startTime={addForm.startTime}
			onDaysChange={(days) => handleAddFormChange("meetingDays", days)}
			onTimeChange={(time) => handleAddFormChange("startTime", time)}
			daysError={addFieldErrors.meetingDays}
			timeError={addFieldErrors.startTime}
		  />



          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeAddCourseModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCourse.isPending}>
              {createCourse.isPending ? "Saving..." : "Save Course"}
            </Button>
          </div>
        </form>
      </Modal>}
      {isAdmin && <Modal
        isOpen={!!editingCourse}
        onClose={closeEditCourseModal}
        title="Edit Course"
      >
        <form className="space-y-4" onSubmit={editCourse}>
          <Input
            label="Course Code"
            value={editForm.code}
            disabled
          />

          <Input
            label="Course Title"
            value={editForm.title}
            onChange={(e) =>
              handleEditFormChange("title", e.target.value)
            }
            error={editFieldErrors.title}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-course-professor" className="mb-2 block text-sm font-medium text-foreground/80">
                Professor
              </label>
              <Select
                value={editForm.professorId || "NONE"}
                onValueChange={(value) => handleEditFormChange("professorId", value === "NONE" ? "" : value)}
              >
                <SelectTrigger id="edit-course-professor" className="w-full">
                  <SelectValue placeholder="Select Professor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No Professor</SelectItem>
                  {professors?.map((professor) => (
                    <SelectItem key={professor.id} value={professor.id}>
                      {professor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Input
              label="Credits"
              inputMode="numeric"
              value={editForm.credits}
              onChange={(e) => handleEditFormChange("credits", e.target.value)}
              error={editFieldErrors.credits}
              required
            />
          </div>

		  <ScheduleFields
			fieldId="edit-course"
			meetingDays={editForm.meetingDays}
			startTime={editForm.startTime}
			onDaysChange={(days) => handleEditFormChange("meetingDays", days)}
			onTimeChange={(time) => handleEditFormChange("startTime", time)}
			daysError={editFieldErrors.meetingDays}
			timeError={editFieldErrors.startTime}
		  />


          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeEditCourseModal}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={updateCourse.isPending}
            >
              {updateCourse.isPending
                ? "Saving..."
                : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>}
    </div>
  );
}

function ScheduleFields({
  fieldId,
  meetingDays,
  startTime,
  onDaysChange,
  onTimeChange,
  daysError,
  timeError,
}: {
  fieldId: string;
  meetingDays: string[];
  startTime: string;
  onDaysChange: (days: string[]) => void;
  onTimeChange: (time: string) => void;
  daysError?: string;
  timeError?: string;
}) {
  const [selectedHour = "", selectedMinute = ""] = startTime.split(":");

  function toggleDay(day: string) {
    onDaysChange(
      meetingDays.includes(day)
        ? meetingDays.filter((selected) => selected !== day)
        : WEEKDAYS.filter((weekday) => [...meetingDays, day].includes(weekday))
    );
  }

  return (
    <section className="rounded-xl border border-border/80  p-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#DBEAFE] text-[#1D4ED8]">
          <CalendarClock className="size-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Class Schedule</h3>
          <p className="text-xs text-muted-foreground">Each meeting lasts one hour.</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <span className="mb-2 block text-sm font-medium text-foreground/80">
            Meeting Days<span className="ml-1 text-destructive">*</span>
          </span>
          <div className="grid grid-cols-5 gap-1.5">
            {WEEKDAYS.map((day) => {
              const selected = meetingDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  className={`h-10 min-w-0 rounded-lg border px-0 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    selected
                      ? "border-[#1D4ED8] bg-[#DBEAFE] text-[#1D4ED8] shadow-sm"
                      : "border-input bg-background text-muted-foreground hover:border-[#83A4E9] hover:bg-[#DBEAFE]/50 hover:text-[#1D4ED8]"
                  }`}
                  aria-pressed={selected}
                  onClick={() => toggleDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
          {daysError && <p className="mt-1.5 text-sm text-destructive">{daysError}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground/80" htmlFor={`${fieldId}-time`}>
            Start Time<span className="ml-1 text-destructive">*</span>
          </label>
          <div className="flex items-center gap-2">
            <Select
              value={selectedHour}
              onValueChange={(hour) => onTimeChange(`${hour}:${hour === "16" ? "00" : selectedMinute || "00"}`)}
            >
              <SelectTrigger id={`${fieldId}-time`} className="flex-1 bg-background" aria-required="true">
                <SelectValue placeholder="Hour" />
              </SelectTrigger>
              <SelectContent>
                {START_HOURS.map((hour) => (
                  <SelectItem key={hour} value={hour}>
                    {Number(hour) > 12 ? Number(hour) - 12 : Number(hour)} {Number(hour) >= 12 ? "PM" : "AM"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="font-semibold text-muted-foreground">:</span>

            <Select
              value={selectedMinute}
              onValueChange={(minute) => selectedHour && onTimeChange(`${selectedHour}:${minute}`)}
              disabled={!selectedHour || selectedHour === "16"}
            >
              <SelectTrigger className="w-24 bg-background" aria-label="Start time minutes">
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="00">00</SelectItem>
                <SelectItem value="30">30</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {startTime && (
            <p className="mt-2 text-xs text-muted-foreground">
              {formatTime(startTime)} – {formatTimeAfterHour(startTime)}
            </p>
          )}
          {timeError && <p className="mt-1.5 text-sm text-destructive">{timeError}</p>}
        </div>
      </div>
    </section>
  );
}

