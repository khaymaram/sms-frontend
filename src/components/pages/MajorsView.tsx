import { useEffect, useState, type FormEvent } from "react";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useCreateMajor, useDeleteMajor, useMajorsPaginated } from "../../hooks/useMajors";
import { apiErrorMessage } from "../../lib/axios";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import PageHeader from "../ui/PageHeader";
import { Pagination } from "../ui/Pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/Table";

export function MajorsView() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const { data, isLoading, isError, error } = useMajorsPaginated(page, pageSize);
  const majors = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const createMajor = useCreateMajor();
  const deleteMajor = useDeleteMajor();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (data && page > Math.max(data.totalPages, 1)) {
      setPage(Math.max(data.totalPages, 1));
    }
  }, [data, page]);

  function closeAddModal() {
    setIsAddOpen(false);
    setName("");
  }

  function addMajor(event: FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Major name is required.");
      return;
    }
    createMajor.mutate(trimmedName, {
      onSuccess: () => {
        toast.success(`${trimmedName} added.`);
        closeAddModal();
      },
      onError: (mutationError) => toast.error(apiErrorMessage(mutationError)),
    });
  }

  function removeMajor(id: number, majorName: string) {
    if (!window.confirm(`Delete ${majorName}? Students in this major will become Undeclared.`)) return;
    deleteMajor.mutate(id, {
      onSuccess: () => toast.success(`${majorName} deleted. Affected students are now Undeclared.`),
      onError: (mutationError) => toast.error(apiErrorMessage(mutationError)),
    });
  }

  return (
    <div>
      <PageHeader
        title="Majors"
        description="Manage the academic majors available to students."
        actions={<Button onClick={() => setIsAddOpen(true)}><Plus /> Add Major</Button>}
      />

      {isError && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {apiErrorMessage(error)}
        </div>
      )}

      <Card padding="responsive">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[#EDE9FE] text-[#6D28D9]">
            <BookOpen className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Current Majors</h2>
            <p className="text-sm text-muted-foreground">{total} major{total === 1 ? "" : "s"} available</p>
          </div>
        </div>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading majors...</p>
        ) : majors.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No majors are available.</p>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Major</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {majors.map((major) => {
                const isUndeclared = major.name.toLowerCase() === "undeclared";
                return (
                  <TableRow key={major.id}>
                    <TableCell className="font-mono">#{major.id}</TableCell>
                    <TableCell className="font-medium">{major.name}</TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        {!isUndeclared && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeMajor(major.id, major.name)}
                            disabled={deleteMajor.isPending}
                            title={`Delete ${major.name}`}
                          >
                            <Trash2 /> Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {!isLoading && !isError && total > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalCount={total}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        )}
      </Card>

      <Modal isOpen={isAddOpen} onClose={closeAddModal} title="Add Major">
        <form className="space-y-4" onSubmit={addMajor}>
          <Input
            label="Major Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Chemistry"
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeAddModal}>Cancel</Button>
            <Button type="submit" disabled={createMajor.isPending}>{createMajor.isPending ? "Adding..." : "Add Major"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
