import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

// Layouts
import { AdminLayout } from '@/components/layout/AdminLayout'
import { StaffLayout }  from '@/components/layout/StaffLayout'
import { KioskLayout }  from '@/components/layout/KioskLayout'

// Auth
import { LoginPage } from '@/pages/auth/LoginPage'

// Admin
import { AdminDashboard }   from '@/pages/admin/DashboardPage'
import { AdminBooksPage }   from '@/pages/admin/books/BooksPage'
import { AdminBookDetail }  from '@/pages/admin/books/BookDetailPage'
import { AdminBookForm }    from '@/pages/admin/books/BookFormPage'
import { AdminStudentsPage } from '@/pages/admin/students/StudentsPage'
import { AdminLoansPage }   from '@/pages/admin/loans/LoansPage'
import { AdminLoanDetail }  from '@/pages/admin/loans/LoanDetailPage'
import { AdminViolationsPage } from '@/pages/admin/violations/ViolationsPage'
import { AdminLostBooksPage }  from '@/pages/admin/lost-books/LostBooksPage'
import { AdminReportsPage }    from '@/pages/admin/reports/ReportsPage'
import { AdminAuditLogsPage }  from '@/pages/admin/audit/AuditLogsPage'

// Staff
import { StaffDashboard }   from '@/pages/staff/DashboardPage'
import { StaffBorrowPage }  from '@/pages/staff/BorrowPage'
import { StaffReturnPage }  from '@/pages/staff/ReturnPage'
import { StaffLoansPage }   from '@/pages/staff/LoansPage'
import { StaffViolationsPage } from '@/pages/staff/ViolationsPage'

// Kiosk
import { KioskStandby }            from '@/pages/kiosk/StandbyScreen'
import { KioskBorrowPage }         from '@/pages/kiosk/BorrowPage'
import { KioskBorrowIndividual }   from '@/pages/kiosk/BorrowIndividualPage'
import { KioskBorrowClass }        from '@/pages/kiosk/BorrowClassPage'
import { KioskReturnPage }         from '@/pages/kiosk/ReturnPage'
import { KioskSuccessPage }        from '@/pages/kiosk/SuccessPage'

// ── Protected Route Wrappers ─────────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireRole({ role, children }: { role: string; children: React.ReactNode }) {
  const userRole = useAuthStore((s) => s.role)
  const isAdmin = userRole === 'admin'
  const isStaff = userRole === 'petugas' || isAdmin

  if (role === 'admin' && !isAdmin) return <Navigate to="/staff/dashboard" replace />
  if (role === 'petugas' && !isStaff) return <Navigate to="/login" replace />
  return <>{children}</>
}

// ── Router ───────────────────────────────────────────────────────────────────
export function AppRouter() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <RequireAuth><RequireRole role="admin"><AdminLayout /></RequireRole></RequireAuth>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"   element={<AdminDashboard />} />
        <Route path="books"       element={<AdminBooksPage />} />
        <Route path="books/create" element={<AdminBookForm />} />
        <Route path="books/:id"   element={<AdminBookDetail />} />
        <Route path="books/:id/edit" element={<AdminBookForm />} />
        <Route path="students"    element={<AdminStudentsPage />} />
        <Route path="loans"       element={<AdminLoansPage />} />
        <Route path="loans/:id"   element={<AdminLoanDetail />} />
        <Route path="violations"  element={<AdminViolationsPage />} />
        <Route path="lost-books"  element={<AdminLostBooksPage />} />
        <Route path="reports"     element={<AdminReportsPage />} />
        <Route path="audit-logs"  element={<AdminAuditLogsPage />} />
      </Route>

      {/* Staff Routes */}
      <Route path="/staff" element={
        <RequireAuth><RequireRole role="petugas"><StaffLayout /></RequireRole></RequireAuth>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"   element={<StaffDashboard />} />
        <Route path="borrow"      element={<StaffBorrowPage />} />
        <Route path="return"      element={<StaffReturnPage />} />
        <Route path="loans"       element={<StaffLoansPage />} />
        <Route path="violations"  element={<StaffViolationsPage />} />
      </Route>

      {/* Kiosk Routes — No Auth Required */}
      <Route path="/kiosk" element={<KioskLayout />}>
        <Route index element={<KioskStandby />} />
        <Route path="borrow"            element={<KioskBorrowPage />} />
        <Route path="borrow/individual" element={<KioskBorrowIndividual />} />
        <Route path="borrow/class"      element={<KioskBorrowClass />} />
        <Route path="return"            element={<KioskReturnPage />} />
        <Route path="success"           element={<KioskSuccessPage />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/kiosk" replace />} />
      <Route path="*" element={<Navigate to="/kiosk" replace />} />
    </Routes>
  )
}
