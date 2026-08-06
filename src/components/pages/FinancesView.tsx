import { useState, useEffect } from "react";
import { toast } from "sonner";
import PageHeader from "../ui/PageHeader";
import { Card } from "../ui/Card";
import { CircleDollarSign, AlertCircle, Wallet, HandCoins, Pencil, CheckCircle2, Award } from "lucide-react";
import { useFinances, useUpdateFinance, useFinancesPaginated } from "../../hooks/useFinances";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../ui/Table";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import { apiErrorMessage } from "../../lib/axios";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "../ui/Select";
import { Pagination } from "../ui/Pagination";
const rainbowAccents = [
    { bg: '#FEE2E2', text: '#B91C1C' },
    { bg: '#FFEDD5', text: '#C2410C' },
    { bg: '#FEF3C7', text: '#B45309' },
    { bg: '#DCFCE7', text: '#166534' },
    { bg: '#DBEAFE', text: '#1D4ED8' },
    { bg: '#EDE9FE', text: '#6D28D9' },
];

const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
});

function formatToK(value: number): string {
    if (typeof value !== "number" || isNaN(value)) return "0";
    return Math.abs(value) >= 1000
        ? (value / 1000).toFixed(1).replace(/\.0$/, "") + "K"
        : value.toString();
}



export function FinancesView() {

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    useEffect(() => {
        setPage(1);
    }, [])
    const { data, isLoading, isFetching, isError } = useFinancesPaginated({ page, pageSize, });
    const finances = data?.data ?? [];
    const {data: allFinances = [],} = useFinances();
    const totalPages = data?.totalPages ?? 1;
    const totalCount = data?.total ?? 0;
    const updateFinance = useUpdateFinance();

    const [editingFinance, setEditingFinance] = useState<{
        studentId: number;
        scholarship: number;
        paid: number;
        isInState: boolean;
    } | null>(null);
    const [paymentFinance, setPaymentFinance] = useState<{
        studentId: number;
        paid: number;
        scholarship: number;
        isInState: boolean;
        remaining: number;
    } | null>(null);
    const [editScholarship, setEditScholarship] = useState("");
    const [editResidency, setEditResidency] = useState(true);
    const [paymentAmount, setPaymentAmount] = useState("");

    const totalOutstanding = allFinances.reduce((sum, finance) => sum + finance.remaining, 0);
    const totalScholarships = allFinances.reduce((sum, finance) => sum + finance.scholarship, 0);

    const stats = [
        {
            label: 'Total Fees',
            value: formatToK(allFinances.reduce((sum, finance) => sum + finance.tuition, 0)),
            icon: CircleDollarSign,
            accent: rainbowAccents[3],
        },
        {
            label: 'Scholarships Awarded',
            value: formatToK(totalScholarships),
            icon: Award,
            accent: rainbowAccents[2],
        },
        {
            label: 'Balance Remaining',
            value: formatToK(totalOutstanding),
            icon: AlertCircle,
            accent: rainbowAccents[0],
        }
    ];

    const openEditFinanceModal = (finance: { studentId: number; paid: number; isInState: boolean; scholarship: number }) => {
        setEditingFinance(finance);
        setEditScholarship(currency.format(finance.scholarship));
        setEditResidency(finance.isInState);
    };

    const closeEditFinanceModal = () => {
        setEditingFinance(null);
        setEditScholarship("");
    };

    const openPayModal = (finance: { studentId: number; paid: number; scholarship: number; isInState: boolean; remaining: number }) => {
        setPaymentFinance(finance);
        setPaymentAmount("");
    };

    const closePayModal = () => {
        setPaymentFinance(null);
        setPaymentAmount("");
    };

    const handleSaveFinance = () => {
        if (!editingFinance) return;

        const scholarship = parseCurrencyInput(editScholarship);
        if (!editScholarship || Number.isNaN(scholarship) || scholarship < 0) {
            toast.error("Scholarship must be a valid non-negative number.");
            return;
        }

        updateFinance.mutate(
            {
                studentId: editingFinance.studentId,
                input: {
                    scholarship,
                    paid: editingFinance.paid,
                    isInState: editResidency,
                },
            },
            {
                onSuccess: () => {
                    toast.success("Finance updated.");
                    closeEditFinanceModal();
                },
                onError: (error) => toast.error(apiErrorMessage(error)),
            }
        );
    };

    const handlePay = () => {
        if (!paymentFinance) return;

        const amount = Number(paymentAmount);
        if (Number.isNaN(amount) || amount <= 0 || amount > paymentFinance.remaining) {
            toast.error("Enter a valid payment amount greater than 0 and less than remaining balance.");
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

    return (
        <>
            <div>
                <PageHeader
                    title="Finances"
                    description="View and manage school fees, payments, scholarships, and other financial records."
                />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    const accent = stat.accent;

                    return (
                        // the cards should show any value over 1000 as 1K
                        <Card key={stat.label} padding="lg" className="space-y-4">
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center font-bold"
                                style={{ backgroundColor: accent.bg, color: accent.text }}
                            >
                                <Icon size={20} />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-2xl font-semibold leading-tight">
                                    ${stat.value}
                                </h2>
                                <h3 className="text-sm text-muted-foreground">{stat.label}</h3>
                            </div>
                        </Card>
                    );
                })}
            </div>

            <Card padding="responsive">
                <div className="mb-6 flex items-center gap-2">
                    <Wallet className="text-muted-foreground" size={18} />
                    <h2 className="text-xl font-semibold">Student Financial Records</h2>
                </div>
                <div className={isFetching ? "opacity-70 transition-opacity" : undefined}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Scholarship</TableHead>
                                <TableHead>Paid</TableHead>
                                <TableHead>Balance</TableHead>
                                <TableHead>Residency</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                        Loading finances...
                                    </TableCell>
                                </TableRow>
                            ) : isError ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                        Unable to load finance records.
                                    </TableCell>
                                </TableRow>
                            ) : finances.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                        No finance records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                finances.map((finance) => (
                                    <TableRow key={finance.studentId} style={{ backgroundColor: finance.remaining === 0 ? '#DCFCE7' : undefined }}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">#{finance.studentId}</span>
                                                <span className="text-muted-foreground text-xs">{finance.studentName ?? "Unknown student"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{currency.format(finance.tuition)}</TableCell>
                                        <TableCell>{currency.format(finance.scholarship)}</TableCell>
                                        <TableCell>{currency.format(finance.paid)}</TableCell>
                                        <TableCell>
                                            {currency.format(finance.remaining)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className="px-2 py-1 text-xs"
                                                style={{
                                                    backgroundColor: finance.isInState ? rainbowAccents[4].bg : rainbowAccents[5].bg,
                                                    color: finance.isInState ? rainbowAccents[4].text : rainbowAccents[5].text,
                                                }}
                                            >
                                                {finance.isInState ? "In-state" : "Out-of-state"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openEditFinanceModal(finance)}
                                                >
                                                    <Pencil size={14} />
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={finance.remaining <= 0 ? "outline" : "default"}
                                                    onClick={() => openPayModal(finance)}
                                                    //disable button if balance is 0
                                                    disabled={finance.remaining <= 0}
                                                >
                                                    {finance.remaining > 0 ?
                                                        <HandCoins size={14} /> : <CheckCircle2 size={14} />}
                                                    {/* if balance is 0 change text of button to paid */}
                                                    {finance.remaining <= 0 ? "Paid" : "Pay"}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
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
            </Card>

            <Modal isOpen={!!editingFinance} onClose={closeEditFinanceModal} title="Edit Finance">
                <div className="space-y-4">
                    <Input
                        label="Scholarship Amount"
                        inputMode="numeric"
                        placeholder="Enter Scholarship Amount"
                        value={editScholarship}
                        onChange={(event) => setEditScholarship(formatCurrencyInput(event.target.value))}
                    />

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground/80">Residency</label>
                        <Select
                            value={editResidency ? "in-state" : "out-of-state"}
                            onValueChange={(event) => setEditResidency(event === "in-state")}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Residency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="in-state">In-state</SelectItem>
                                <SelectItem value="out-of-state">Out-of-state</SelectItem>
                            </SelectContent>

                        </Select>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={closeEditFinanceModal}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={handleSaveFinance} disabled={updateFinance.isPending}>
                            {updateFinance.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!paymentFinance} onClose={closePayModal} title="Pay Student Fees">
                <div className="space-y-4">
                    <Input
                        label="Payment Amount ($)"
                        inputMode="decimal"
                        min="0"
                        max={paymentFinance?.remaining}
                        value={paymentAmount}
                        onChange={(event) => setPaymentAmount(event.target.value)}
                        placeholder={
                            paymentFinance
                                ? "Remaining Balance: " + currency.format(paymentFinance.remaining)
                                : "Remaining balance"
                        }
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
            </Modal>
        </>
    );
}

function formatCurrencyInput(value: string): string {
    const digits = value.replace(/\D/g, "");
    return digits ? currency.format(Number(digits)) : "";
}

function parseCurrencyInput(value: string): number {
    return Number(value.replace(/[$,]/g, ""));
}
