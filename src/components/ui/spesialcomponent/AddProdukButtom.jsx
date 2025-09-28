import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function AddProdukButton() {
  return (
    <>
      {/* Tombol normal, tampil di sm ke atas */}
      <Link to="/produk/create" className="hidden sm:block">
        <Button className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Tambah Produk
        </Button>
      </Link>

      <Link
  to="/produk/create"
  className="fixed bottom-20 right-6 sm:hidden"
>
  <Button className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center">
    <Plus className="h-6 w-6" />
  </Button>
</Link>
    </>
  )
}
