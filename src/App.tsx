import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import LoginView from "./components/pages/LoginView";
import AccountView from "./components/pages/AccountView";
import { StudentsView } from "./components/pages/StudentsView";
import StudentDetailsView from "./components/pages/StudentDetailsView";
import { CoursesView } from "./components/pages/CoursesView";
import CourseDetailsView from "./components/pages/CourseDetailsView";
import { ProfessorsView } from "./components/pages/ProfessorsView";
import ProfessorDetailsView from "./components/pages/ProfessorDetailsView";
import { Dashboard } from "./components/pages/Dashboard";
import { FinancesView } from "./components/pages/FinancesView";
import { MajorsView } from "./components/pages/MajorsView";

function HomeRedirect() { const { user } = useAuth(); if (!user) return <Navigate to="/login" replace />; return <Navigate to={user.role === "student" ? "/my-courses" : user.role === "professor" ? "/professor-dashboard" : "/dashboard"} replace />; }

function AppRoutes() {
  return <Routes>
    <Route path="/login" element={<LoginView />} />
    <Route element={<ProtectedRoute />}><Route element={<AppLayout />}>
      <Route index element={<HomeRedirect />} /><Route path="/account" element={<AccountView />} />
      <Route element={<ProtectedRoute roles={["admin"]} />}>
        <Route path="/dashboard" element={<Dashboard />} /><Route path="/roster" element={<StudentsView />} /><Route path="/professors" element={<ProfessorsView />} /><Route path="/majors" element={<MajorsView />} /><Route path="/finances" element={<FinancesView />} />
      </Route>
      <Route element={<ProtectedRoute roles={["admin", "student"]} />}><Route path="/roster/:studentId" element={<StudentDetailsView />} /></Route>
      <Route element={<ProtectedRoute roles={["student"]} />}><Route path="/my-courses" element={<StudentDetailsView section="courses" />} /><Route path="/my-finances" element={<StudentDetailsView section="finances" />} /><Route path="/my-schedule" element={<StudentDetailsView section="schedule" />} /></Route>
      <Route element={<ProtectedRoute roles={["professor"]} />}><Route path="/professor-dashboard" element={<ProfessorDetailsView />} /></Route>
      <Route element={<ProtectedRoute roles={["admin"]} />}><Route path="/courses" element={<CoursesView />} /></Route>
      <Route element={<ProtectedRoute roles={["admin", "professor"]} />}><Route path="/courses/:courseCode" element={<CourseDetailsView />} /></Route>
      <Route element={<ProtectedRoute roles={["admin", "professor"]} />}><Route path="/professors/:professorId" element={<ProfessorDetailsView />} /></Route>
    </Route></Route>
    <Route path="*" element={<HomeRedirect />} />
  </Routes>;
}

export default function App() { return <BrowserRouter><AuthProvider><AppRoutes /><Toaster position="top-right" richColors /></AuthProvider></BrowserRouter>; }
