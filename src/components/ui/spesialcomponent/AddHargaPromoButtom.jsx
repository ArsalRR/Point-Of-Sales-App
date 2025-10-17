import React from 'react'
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function AddHargaPromoButton() {
  return (
    <>
      {/* Tombol normal untuk desktop */}
      <Link to="/hargapromo/create" className="hidden sm:block">
        <Button className="gap-2 w-full sm:w-auto text-white shadow-md">
          <Plus className="h-4 w-4" />
          Tambah Produk
        </Button>
      </Link>

      {/* Floating Action Button untuk mobile */}
      <Link
        to="/hargapromo/create"
        className="fixed bottom-6 right-6 sm:hidden z-50"
      >
        <Button
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl 
          transition-all duration-300 flex items-center justify-center 
          bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </>
  )
}
