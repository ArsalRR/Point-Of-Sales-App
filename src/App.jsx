import { Routes, Route, Navigate } from "react-router-dom"
import DashboardLayout from "./Template/layout"
import Login from "./views/Auth/Login"
import ListProduk from "./views/Produk/List-produk"
import CreateProduk from "./views/Produk/create-produk"
import EditProduk from "./views/Produk/Edit-produk"
import ListKasir from "./views/Kasir/list-kasir"
import Dashboard from "./views/Dasboard/dasboard"
import LaporanHarian from "./views/Laporan/laporan-harian"
import ProtectedRoute from "./middleware/ProtectRoutes"
import LaporanBulanan from "./views/Laporan/laporan-bulanan"
import NetworkNotifier from "./hooks/NetworkNotifier"

function App() {
  return (
    <>
      <NetworkNotifier />
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/produk"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ListProduk />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/produk/create"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CreateProduk />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/produk/edit/:id"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <EditProduk />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/kasir"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ListKasir />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/laporanharian"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <LaporanHarian />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/laporanbulanan"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <LaporanBulanan />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
