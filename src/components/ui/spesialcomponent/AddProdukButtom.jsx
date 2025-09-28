import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function AddProdukButton() {
  return (
    <>
      <Link to="/produk/create" className="hidden sm:block">
        <Button className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Tambah Produk
        </Button>
      </Link>
      <Link
        to="/produk/create"
        className="fixed bottom-32 right-6 sm:hidden z-50"
      >
        <Button className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center bg-gray-900 hover:bg-gray-800 text-white">
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </>
  )
}