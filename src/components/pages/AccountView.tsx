import { useState, type FormEvent } from "react";
import { LogOut, Save, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { apiErrorMessage } from "../../lib/axios";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import Input from "../ui/Input";
import PageHeader from "../ui/PageHeader";

export default function AccountView() {
  const { user, logout, updateProfile, changePassword, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? ""); const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState(""); const [newPassword, setNewPassword] = useState(""); const [deletePassword, setDeletePassword] = useState("");
  if (!user) return null;

  async function saveProfile(e: FormEvent) { e.preventDefault(); try { await updateProfile(name, email); toast.success("Profile updated."); } catch (error) { toast.error(apiErrorMessage(error)); } }
  async function resetPassword(e: FormEvent) { e.preventDefault(); try { await changePassword(currentPassword, newPassword); setCurrentPassword(""); setNewPassword(""); toast.success("Password updated."); } catch (error) { toast.error(apiErrorMessage(error)); } }
  async function removeAccount() { if (!window.confirm("Permanently delete your account? This cannot be undone.")) return; try { await deleteAccount(deletePassword); navigate("/login", { replace: true }); } catch (error) { toast.error(apiErrorMessage(error)); } }
  async function signOut() { await logout(); navigate("/login", { replace: true }); }

  return <div><PageHeader title="User Account" description="Manage your profile and security settings." actions={<Button variant="outline" onClick={signOut}><LogOut /> Log out</Button>} />
    <div className="grid gap-4 lg:grid-cols-2">
      <Card padding="responsive"><div className="mb-5"><div className="mb-2 flex items-center gap-2"><h2 className="text-xl font-semibold">Profile</h2><Badge>{user.role === "professor" ? "Teacher" : user.role}</Badge></div><p className="text-sm text-muted-foreground">Account ID: {user.subjectId ?? user.id}</p></div>
        <form className="space-y-4" onSubmit={saveProfile}><Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required /><Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /><Button type="submit"><Save /> Save Profile</Button></form>
      </Card>
      <Card padding="responsive"><h2 className="mb-5 text-xl font-semibold">Reset Password</h2><form className="space-y-4" onSubmit={resetPassword}><Input label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required /><Input label="New Password" type="password" helperText="At least 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /><Button type="submit">Reset Password</Button></form></Card>
      {user.role === "admin" && <Card padding="responsive" className="border-destructive/50 lg:col-span-2"><h2 className="text-xl font-semibold text-destructive">Delete Account</h2><p className="mb-4 mt-1 text-sm text-muted-foreground">Permanently remove this administrator login.</p><div className="flex max-w-xl flex-col items-end gap-3 sm:flex-row"><Input label="Confirm Password" type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} /><Button variant="destructive" onClick={removeAccount} disabled={!deletePassword}><Trash2 /> Delete Account</Button></div></Card>}
    </div>
  </div>;
}
