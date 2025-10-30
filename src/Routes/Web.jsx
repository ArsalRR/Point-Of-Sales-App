import { Routes, Route, Navigate } from "react-router-dom"
import { lazy, Suspense } from "react"
import Login from "@/views/Auth/Login"
import ProtectedRoute from "@/middleware/ProtectRoutes"
import DashboardLayout from "@/views/Template/layout"
import { Spinner } from "@/components/ui/spinner"

const UpdateMassalRoute = lazy(() => import("@/views/Produk/UpdateMassal"))
const ListProduk = lazy(() => import("@/views/Produk/List-produk"))
const CreateProduk = lazy(() => import("@/views/Produk/create-produk"))
const EditProduk = lazy(() => import("@/views/Produk/Edit-produk"))
const ListKasir = lazy(() => import("@/views/Kasir/list-kasir"))
const Dashboard = lazy(() => import("@/views/Dasboard/dasboard"))
const LaporanHarian = lazy(() => import("@/views/Laporan/laporan-harian"))
const LaporanBulanan = lazy(() => import("@/views/Laporan/laporan-bulanan"))
const ListHargaPromo = lazy(() => import("@/views/HargaPromo/ListHargaPromo"))
const CreateHargaPromo = lazy(() => import("@/views/HargaPromo/CreateHargaPromo"))
const EditHargaPromo = lazy(() => import("@/views/HargaPromo/EditHargaPromo"))
const LoadingFallback = () => <div className="flex items-center justify-center h-screen"> <Spinner /></div>
const ProtectedWithLayout = ({ children }) => (
  <ProtectedRoute>
    <DashboardLayout>
      <Suspense fallback={<LoadingFallback />}>
        {children}
      </Suspense>
    </DashboardLayout>
  </ProtectedRoute>
)
const protectedRoutes = [
  { path: "/produk", component: ListProduk },
  { path: "/produk/update-massal", component: UpdateMassalRoute },
  { path: "/produk/create", component: CreateProduk },
  { path: "/produk/edit/:id", component: EditProduk },
  { path: "/kasir", component: ListKasir },
  { path: "/dashboard", component: Dashboard },
  { path: "/laporanharian", component: LaporanHarian },
  { path: "/laporanbulanan", component: LaporanBulanan },
  { path: "/hargapromo", component: ListHargaPromo },
  { path: "/hargapromo/create", component: CreateHargaPromo },
  { path: "/hargapromo/edit/:id", component: EditHargaPromo },
]

export default function Web() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      {protectedRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            <ProtectedWithLayout>
              <route.component />
            </ProtectedWithLayout>
          }
        />
      ))}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}