import * as React from "react"
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  LayoutDashboard,
  ShoppingBag,
  Users,
  Shirt,
  TrendingUp,
  FileText,
  Plus,
  Moon,
  Sun,
  Laptop,
  Search
} from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/Components/ui/command"
import { router } from "@inertiajs/react"
import { useTheme } from "@/Components/ThemeProvider"

export function GlobalCommandPalette() {
  const [open, setOpen] = React.useState(false)
  const { setTheme } = useTheme()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
        {/* Tombol Trigger Visual di Header (Opsional, tapi bagus untuk UX) */}
        <button 
            onClick={() => setOpen(true)}
            className="hidden md:flex items-center gap-2 border rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mr-2"
        >
            <Search className="h-3.5 w-3.5" />
            <span className="text-xs">Cari...</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
            </kbd>
        </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Ketik perintah atau cari..." />
        <CommandList>
          <CommandEmpty>Tidak ada hasil.</CommandEmpty>
          
          <CommandGroup heading="Halaman">
            <CommandItem onSelect={() => runCommand(() => router.visit(route('dashboard')))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.visit(route('transactions.index')))}>
              <ShoppingBag className="mr-2 h-4 w-4" />
              <span>Transaksi</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.visit(route('customers.index')))}>
              <Users className="mr-2 h-4 w-4" />
              <span>Pelanggan</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.visit(route('services.index')))}>
              <Shirt className="mr-2 h-4 w-4" />
              <span>Layanan</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.visit(route('reports.index')))}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Laporan</span>
            </CommandItem>
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Aksi Cepat">
            <CommandItem onSelect={() => runCommand(() => router.visit(route('transactions.create')))}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Buat Transaksi Baru</span>
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.visit(route('settings.index')))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Pengaturan Aplikasi</span>
            </CommandItem>
          </CommandGroup>
          
          <CommandSeparator />

          <CommandGroup heading="Tema">
            <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light Mode</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark Mode</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
              <Laptop className="mr-2 h-4 w-4" />
              <span>System</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
