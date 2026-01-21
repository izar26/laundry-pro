"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table"
import { Button } from "@/Components/ui/button"
import { Input } from "@/Components/ui/input"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { router, Link } from "@inertiajs/react"
import { Skeleton } from "@/Components/ui/skeleton"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pagination?: any
  searchKey?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pagination,
  searchKey,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const [searchValue, setSearchValue] = React.useState(params.get('search') || "")
  const [isLoading, setIsLoading] = React.useState(false)

  // Deteksi navigasi Inertia (loading state)
  React.useEffect(() => {
    const removeStart = router.on('start', (event) => {
        // Jangan tampilkan skeleton jika preserveState aktif (toggle/delete)
        // ATAU jika URL tujuan sama dengan URL saat ini (biasanya hash change atau refresh parsial)
        const isSameUrl = event.detail.visit.url.pathname === window.location.pathname;
        
        if (!event.detail.visit.preserveState && !isSameUrl) {
            setIsLoading(true);
        }
        // Khusus search (isSameUrl tapi param beda), kita handle di logic search
    })
    const removeFinish = router.on('finish', () => setIsLoading(false))
    return () => {
      removeStart()
      removeFinish()
    }
  }, [])

  React.useEffect(() => {
    if (searchKey) {
        const timer = setTimeout(() => {
            if (searchValue !== (params.get('search') || "")) {
                router.get(
                    window.location.pathname, 
                    { search: searchValue, page: 1 },
                    { preserveState: true, replace: true }
                )
            }
        }, 500)
        return () => clearTimeout(timer)
    }
  }, [searchValue, searchKey])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters },
    manualPagination: true,
  })

  return (
    <div>
      {searchKey && (
        <div className="py-4">
            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Cari data..."
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    className="pl-9"
                />
            </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
               Array.from({ length: 5 }).map((_, index) => (
                 <TableRow key={index}>
                    {columns.map((col, i) => (
                        <TableCell key={i}>
                            <Skeleton className="h-6 w-full" />
                        </TableCell>
                    ))}
                 </TableRow>
               ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {pagination && (
          <div className="flex items-center justify-between py-4 px-2">
            <div className="flex-1 text-sm text-muted-foreground">
                Halaman <span className="font-medium text-foreground">{pagination.current_page}</span> dari <span className="font-medium text-foreground">{pagination.last_page}</span> 
                <span className="ml-1 text-xs">({pagination.total} total data)</span>
            </div>
            <div className="flex items-center space-x-2">
                {/* Tombol Sebelumnya */}
                {pagination.prev_page_url ? (
                    <Button variant="outline" size="sm" asChild>
                        <Link href={pagination.prev_page_url} preserveState>
                            <ChevronLeft className="h-4 w-4 mr-2" /> Sebelumnya
                        </Link>
                    </Button>
                ) : (
                    <Button variant="outline" size="sm" disabled>
                        <ChevronLeft className="h-4 w-4 mr-2" /> Sebelumnya
                    </Button>
                )}

                {/* Tombol Selanjutnya */}
                {pagination.next_page_url ? (
                    <Button variant="outline" size="sm" asChild>
                        <Link href={pagination.next_page_url} preserveState>
                            Selanjutnya <ChevronRight className="h-4 w-4 ml-2" />
                        </Link>
                    </Button>
                ) : (
                    <Button variant="outline" size="sm" disabled>
                        Selanjutnya <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                )}
            </div>
          </div>
      )}
    </div>
  )
}