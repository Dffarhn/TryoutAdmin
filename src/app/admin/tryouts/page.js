"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { useTryouts, useDeleteTryout } from "@/hooks/useTryouts";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";

// Component untuk sortable table head
function SortableTableHead({ column, currentSort, sortDirection, onSort, children }) {
  const isActive = currentSort === column;
  const Icon = isActive
    ? sortDirection === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <TableHead>
      <button
        onClick={() => onSort(column)}
        className="flex items-center gap-1 hover:text-gray-900 transition-colors w-full text-left"
      >
        {children}
        <Icon className="w-4 h-4" />
      </button>
    </TableHead>
  );
}

export default function TryoutsPage() {
  const { data: tryouts = [], isLoading } = useTryouts();
  const deleteTryout = useDeleteTryout();
  const { showToast } = useToast();
  const { showConfirm } = useDialog();
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  const [sortColumn, setSortColumn] = useState(null); // 'title', 'durationMinutes', 'packageName', 'isActive', 'createdAt'
  const [sortDirection, setSortDirection] = useState("asc"); // 'asc' or 'desc'

  const filtered = useMemo(() => {
    let list = tryouts;
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      list = list.filter(
        (it) =>
          it.title?.toLowerCase().includes(query) ||
          it.description?.toLowerCase().includes(query) ||
          it.packageName?.toLowerCase().includes(query) ||
          it.categoryName?.toLowerCase().includes(query)
      );
    }
    if (onlyActive) {
      list = list.filter((it) => it.isActive);
    }
    return list;
  }, [tryouts, searchQuery, onlyActive]);

  const sortedTryouts = useMemo(() => {
    if (!sortColumn) return filtered;

    const sorted = [...filtered].sort((a, b) => {
      let aVal, bVal;

      switch (sortColumn) {
        case "title":
          aVal = (a.title || "").toLowerCase();
          bVal = (b.title || "").toLowerCase();
          break;
        case "durationMinutes":
          aVal = a.durationMinutes || 0;
          bVal = b.durationMinutes || 0;
          break;
        case "packageName":
          aVal = (a.packageName || "").toLowerCase();
          bVal = (b.packageName || "").toLowerCase();
          break;
        case "isActive":
          aVal = a.isActive ? 1 : 0;
          bVal = b.isActive ? 1 : 0;
          break;
        case "createdAt":
          aVal = new Date(a.createdAt || 0).getTime();
          bVal = new Date(b.createdAt || 0).getTime();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filtered, sortColumn, sortDirection]);

  function handleSort(column) {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  async function handleDelete(id, title) {
    const confirmed = await showConfirm({
      title: "Konfirmasi Hapus Tryout",
      description: `Apakah Anda yakin ingin menghapus tryout "${title}"? Tindakan ini tidak dapat dibatalkan.`,
      variant: "danger",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
    });

    if (!confirmed) return;

    try {
      await deleteTryout.mutateAsync(id);
      showToast("Tryout berhasil dihapus", "success");
    } catch (error) {
      showToast(`Gagal menghapus tryout: ${error.message}`, "error");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Memuat tryouts...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tryouts</h1>
          <p className="text-gray-600 mt-2">
            Kelola daftar tryout: cari, tambah, edit, hapus
          </p>
        </div>
        <Link href="/admin/tryouts/new">
          <Button>+ Tryout</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Tryout</CardTitle>
          <CardDescription>
            {sortedTryouts.length} dari {tryouts.length} tryout
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Cari judul/deskripsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={onlyActive}
                onChange={(e) => setOnlyActive(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Hanya aktif
              </span>
            </label>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <SortableTableHead
                  column="title"
                  currentSort={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                >
                  Judul
                </SortableTableHead>
                <SortableTableHead
                  column="durationMinutes"
                  currentSort={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                >
                  Durasi (mnt)
                </SortableTableHead>
                <SortableTableHead
                  column="packageName"
                  currentSort={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                >
                  Paket
                </SortableTableHead>
                <TableHead>Kategori</TableHead>
                <SortableTableHead
                  column="isActive"
                  currentSort={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                >
                  Status
                </SortableTableHead>
                <TableHead>Aksi</TableHead>
              </TableHeader>
              <TableBody>
                {sortedTryouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      {tryouts.length === 0
                        ? "Belum ada tryout. Buat tryout pertama."
                        : "Tidak ada tryout yang sesuai filter."}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedTryouts.map((tryout) => (
                    <TableRow key={tryout.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/tryouts/${tryout.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-700 hover:underline"
                        >
                          {tryout.title}
                        </Link>
                      </TableCell>
                      <TableCell>{tryout.durationMinutes}</TableCell>
                      <TableCell>{tryout.packageName || "-"}</TableCell>
                      <TableCell>{tryout.categoryName || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            tryout.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {tryout.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/admin/tryouts/${tryout.id}/edit`}>
                            <Button variant="secondary" className="text-xs px-3 py-1.5">
                              Edit
                            </Button>
                          </Link>
                          <Link href={`/admin/tryouts/${tryout.id}/questions`}>
                            <Button variant="ghost" className="text-xs px-3 py-1.5">
                              Soal
                            </Button>
                          </Link>
                          <Button
                            variant="danger"
                            className="text-xs px-3 py-1.5"
                            onClick={() => handleDelete(tryout.id, tryout.title)}
                            disabled={deleteTryout.isPending}
                          >
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
