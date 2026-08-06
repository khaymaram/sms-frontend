// ProfessorsView.tsx renders the roster UI and handles filtering, editing, and deletion.
import { useEffect, useState, type FormEvent } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDeleteProfessor, useUpdateProfessor, useCreateProfessor, useProfessorsPaginated, type ProfessorFilter } from "../../hooks/useProfessors";
import { apiErrorMessage } from "../../lib/axios";
import { ProfessorInputSchema, type Professor, type ProfessorInput } from "../../types";
import PageHeader from "../ui/PageHeader";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { Pagination } from "../ui/Pagination";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "../ui/Select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../ui/Table";
import { useCourses } from "@/hooks/useCourses";
import { Link } from "react-router-dom";

type FilterMode = "all" | "search" | "name";
const emptyForm = { id: "", name: "" };
export function ProfessorsView() {
    const { data: courses = [] } = useCourses();

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    const [mode, setMode] = useState<FilterMode>("all");
    const [searchInput, setSearchInput] = useState("");
    const [nameInput, setNameInput] = useState("");
    const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [addForm, setAddForm] = useState(emptyForm);
    const [addFieldErrors, setAddFieldErrors] = useState<Partial<Record<keyof ProfessorInput, string>>>({});

    const [editForm, setEditForm] = useState(emptyForm);
    const [editFieldErrors, setEditFieldErrors] = useState<Partial<Record<keyof ProfessorInput, string>>>({});

    const filter: ProfessorFilter =
        mode === "search" && searchInput
            ? { type: "search", id: String(searchInput) }
            : mode === "name" && nameInput
                ? { type: "name", name: String(nameInput) }
                : { type: "all" };

    useEffect(() => {
        setPage(1);
    }, [mode, searchInput, nameInput,]);

    const {
        data,
        isLoading,
        isFetching,
        isError,
        error,
    } = useProfessorsPaginated({
        page,
        pageSize,
        filter,
    });

    const professors =
        data?.data ?? [];

    const totalPages =
        data?.totalPages ?? 1;

    const totalCount =
        data?.total ?? 0;
    const deleteProfessor = useDeleteProfessor();
    const createProfessor = useCreateProfessor();
    const updateProfessor = useUpdateProfessor();

    function handleDelete(professor: Professor) {
        if (!window.confirm(`Remove ${professor.name} (ID ${professor.id}) from the roster`)) return;
        deleteProfessor.mutate(professor.id, {
            onSuccess: () => toast.success(`Removed ${professor.name} from the roster.`),
            onError: (err) => toast.error(apiErrorMessage(err)),
        });
    }
    function handleAddFormChange(field: keyof typeof addForm, value: string) {
        setAddForm((prev) => ({ ...prev, [field]: value }));
    }
    function handleEditFormChange(
        field: keyof typeof editForm,
        value: string
    ) {
        setEditForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    }
    function openEditProfessorModal(professor: Professor) {
        setEditingProfessor(professor);

        setEditForm({
            id: professor.id,
            name: professor.name,
        });

        setEditFieldErrors({});
    }

    function closeEditProfessorModal() {
        setEditingProfessor(null);
        setEditForm({ ...emptyForm });
        setEditFieldErrors({});
    }
    function openAddProfessorModal() {
        setAddForm({ ...emptyForm });
        setAddFieldErrors({});
        setIsAddModalOpen(true);
    }

    function closeAddProfessorModal() {
        setIsAddModalOpen(false);
        setAddForm({ ...emptyForm });
        setAddFieldErrors({});
    }

    function getProfessorStatus(professorId: string) {
        // check how many courses the professor is teaching and return "active" if they are teaching at least one course, otherwise return "inactive"
        const teachingCourses = courses.filter((course) => course.professorId === professorId);
        const status = teachingCourses.length > 0 ? "active" : "inactive";
        return status;
    }

    function addProfessor(e: FormEvent) {
        e.preventDefault();

        const result = ProfessorInputSchema.safeParse(addForm);
        if (!result.success) {
            const errors: Partial<Record<keyof ProfessorInput, string>> = {};
            for (const issue of result.error.issues) {
                const key = issue.path[0] as keyof ProfessorInput;
                errors[key] = issue.message;
            }
            setAddFieldErrors(errors);
            return;
        }

        setAddFieldErrors({});
        createProfessor.mutate(result.data, {
            onSuccess: () => {
                setAddForm({ ...emptyForm });
                setIsAddModalOpen(false);
                const emailName = result.data.name.toLowerCase().replace(/[^a-z0-9]/g, "");
                toast.success(
                    `Professor created. Login: ${result.data.id} · Password: Teacher${result.data.id}! · Email: ${emailName}${result.data.id.toLowerCase()}@grgi.edu`,
                    { duration: 12000 }
                );
            },
            onError: (err) => toast.error(apiErrorMessage(err)),
        });
    }
    function editProfessor(e: FormEvent) {
        e.preventDefault();

        if (!editingProfessor) return;

        const result = ProfessorInputSchema.safeParse(editForm);

        if (!result.success) {
            const errors: Partial<Record<keyof ProfessorInput, string>> = {};

            for (const issue of result.error.issues) {
                const key = issue.path[0] as keyof ProfessorInput;
                errors[key] = issue.message;
            }

            setEditFieldErrors(errors);
            return;
        }

        setEditFieldErrors({});

        updateProfessor.mutate(
            {
                professorId: editingProfessor.id,
                input: result.data,
            },
            {
                onSuccess: () => {
                    toast.success(`Updated ${result.data.name}.`);
                    closeEditProfessorModal();
                },
                onError: (err) => toast.error(apiErrorMessage(err)),
            }
        );
    }
    return (
        <div>
            <PageHeader
                title="Professors"
                description="View, filter, edit, add or remove professors on file."
                actions={
                    <Button onClick={openAddProfessorModal}>
                        <Plus />
                        Register a Professor
                    </Button>
                }
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
                                <SelectItem value="all">All professors</SelectItem>
                                <SelectItem value="search">Search by ID</SelectItem>
                                <SelectItem value="name">Search by name</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {mode === "search" && (
                        <div className="w-full sm:w-48">
                            <Input
                                label="Professor ID"
                                id="search-filter"
                                inputMode="text"
                                placeholder="P1001"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                        </div>
                    )}

                    {mode === "name" && (
                        <div className="w-full sm:w-64">
                            <Input
                                label="Professor Name"
                                id="name-filter"
                                inputMode="text"
                                placeholder="Charlie Brown"
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </Card>

            {isLoading && <p className="text-sm text-muted-foreground">Loading directory</p>}
            {isError && (
                <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {apiErrorMessage(error)}
                </div>
            )}

            {!isLoading && !isError && !professors?.length && (
                <Card padding="lg" className="text-center text-muted-foreground">
                    No professors registered yet.
                </Card>
            )}

            {!isLoading && !!professors?.length && (
                <>
                <div className={isFetching  ? "opacity-70 transition-opacity"  : undefined}>
                    <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {professors.map((professor) =>
                        (
                            <TableRow key={professor.id}>
                                <TableCell>
                                    <Link to={`/professors/${professor.id}`}>
                                        <Badge variant="outline" className="cursor-pointer font-mono transition-colors hover:bg-accent hover:text-accent-foreground">
                                            #{professor.id}
                                        </Badge>
                                    </Link>
                                </TableCell>
                                <TableCell className="font-medium">{professor.name}</TableCell>
                                <TableCell>
                                    {(() => {
                                        const professorStatus = getProfessorStatus(professor.id);
                                        return (
                                            <Badge

                                                className={professorStatus === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-red-800"}
                                            >
                                                {professorStatus === "active" ? "Active" : "Inactive"}
                                            </Badge>
                                        );
                                    })()}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEditProfessorModal(professor)}
                                        >
                                            <Pencil />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(professor)}
                                            disabled={deleteProfessor.isPending}
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
                
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        totalCount={totalCount}
                        onPageChange={setPage}
                        onPageSizeChange={(size) => {
                            setPageSize(size);
                            setPage(1);
                        }}
                    />
                </>

            )}

            <Modal isOpen={isAddModalOpen} onClose={closeAddProfessorModal} title="Register a Professor">
                <form className="space-y-4" onSubmit={addProfessor}>
                    <Input
                        label="Professor ID"
                        id="professorId"
                        inputMode="numeric"
                        placeholder="P1005"
                        value={addForm.id}
                        onChange={(e) => handleAddFormChange("id", e.target.value)}
                        error={addFieldErrors.id}
                        required
                    />

                    <Input
                        label="Full Name"
                        id="name"
                        placeholder="Charlie Brown"
                        value={addForm.name}
                        onChange={(e) => handleAddFormChange("name", e.target.value)}
                        error={addFieldErrors.name}
                        required
                    />


                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={closeAddProfessorModal}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createProfessor.isPending}>
                            {createProfessor.isPending ? "Saving..." : "Save Professor"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={!!editingProfessor}
                onClose={closeEditProfessorModal}
                title="Edit Professor"
            >
                <form className="space-y-4" onSubmit={editProfessor}>
                    <Input
                        label="Professor ID"
                        value={editForm.id}
                        disabled
                    />

                    <Input
                        label="Full Name"
                        value={editForm.name}
                        onChange={(e) =>
                            handleEditFormChange("name", e.target.value)
                        }
                        error={editFieldErrors.name}
                        required
                    />


                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeEditProfessorModal}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            disabled={updateProfessor.isPending}
                        >
                            {updateProfessor.isPending
                                ? "Saving..."
                                : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </Modal>

        </div>
    );
}
