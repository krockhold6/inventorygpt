import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { AppLayout } from "@/components/layout/AppLayout"
import { RequireAdmin, RequireAuth } from "@/components/RequireAuth"
import { AuthProvider } from "@/lib/auth"
import { AuthPage } from "@/pages/AuthPage"
import { ProgramDetailPage } from "@/pages/ProgramDetailPage"
import { ProgramsListPage } from "@/pages/ProgramsListPage"
import { ProgramAdminFormPage } from "@/pages/admin/ProgramAdminFormPage"
import { ProgramRegistrationsPage } from "@/pages/admin/ProgramRegistrationsPage"
import { ProgramsAdminListPage } from "@/pages/admin/ProgramsAdminListPage"

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<ProgramsListPage />} />
            <Route path="programs/:slug" element={<ProgramDetailPage />} />
            <Route
              path="admin/programs"
              element={
                <RequireAdmin>
                  <ProgramsAdminListPage />
                </RequireAdmin>
              }
            />
            <Route
              path="admin/programs/new"
              element={
                <RequireAdmin>
                  <ProgramAdminFormPage />
                </RequireAdmin>
              }
            />
            <Route
              path="admin/programs/:id"
              element={
                <RequireAdmin>
                  <ProgramAdminFormPage />
                </RequireAdmin>
              }
            />
            <Route
              path="admin/programs/:id/registrations"
              element={
                <RequireAdmin>
                  <ProgramRegistrationsPage />
                </RequireAdmin>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
