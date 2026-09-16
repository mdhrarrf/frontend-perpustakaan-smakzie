import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { bookService } from "@/api/book.service"
import type { BookItem, BookItemsResponse } from "@/api/book.service"
import { Button } from "@/components/ui/Button"
import { Card, CardHeader, CardBody } from "@/components/ui/Card"
import { ArrowLeft, Printer, CheckSquare, Square, Eye } from "lucide-react"
import Barcode from "react-barcode"

function truncateTitle(title: string, maxLen = 34): string {
  if (!title) return ""
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen).trim() + "..."
}

function parseCallNumber(
  itemCallNumber?: string,
  biblioCallNumber?: string,
  classification?: string,
  author?: string,
  title?: string
): string[] {
  const raw = (itemCallNumber && itemCallNumber !== "AUTO" ? itemCallNumber : "") ||
              (biblioCallNumber && biblioCallNumber !== "AUTO" ? biblioCallNumber : "")

  if (raw) {
    const trimmed = raw.trim()
    const parts = trimmed.split(/\s+/)
    if (parts.length >= 2) {
      return parts
    }
    if (parts.length === 1 && parts[0] && !/^\d+(\.\d+)?$/.test(parts[0])) {
      return [parts[0]]
    }
  }

  // Fallback pembagian standar Cutter SLiMS: Klasifikasi / 3 Huruf Pengarang / 1 Huruf Judul
  const classNum = (raw ? raw : "") || classification || "000"

  let authorCutter = ""
  if (author) {
    const cleanAuthor = author.replace(/[^a-zA-Z]/g, "")
    if (cleanAuthor.length > 0) {
      authorCutter = cleanAuthor.slice(0, 3).toUpperCase()
    }
  }

  let titleCutter = ""
  if (title) {
    const cleanTitle = title.replace(/^[^a-zA-Z]+/, "")
    if (cleanTitle.length > 0) {
      titleCutter = cleanTitle.charAt(0).toLowerCase()
    }
  }

  const lines = [classNum, authorCutter, titleCutter].filter(Boolean)
  return lines.length > 0 ? lines : ["—"]
}

export function PrintLabelsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const { data, isLoading } = useQuery<BookItemsResponse>({
    queryKey: ["book-items", id],
    queryFn: () => bookService.getItems(Number(id)),
    enabled: !!id,
  })

  useEffect(() => {
    if (data?.items) {
      setSelected(new Set(data.items.map((i: BookItem) => i.item_id)))
    }
  }, [data])

  function toggleItem(itemId: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  function toggleAll() {
    if (!data) return
    if (selected.size === data.items.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(data.items.map((i: BookItem) => i.item_id)))
    }
  }

  const selectedItems = data?.items.filter((i: BookItem) => selected.has(i.item_id)) ?? []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-60">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    )
  }

  if (!data) return <div className="text-center py-20 text-slate-400">Data buku tidak ditemukan.</div>

  return (
    <div className="space-y-6">
      {/* ─── HEADER & CONTROLS (TIDAK DICETAK) ─── */}
      <div className="print:hidden space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Cetak Label Barcode</h1>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {data.judul} · <span className="font-semibold text-slate-700">{selectedItems.length}</span> dari {data.items.length} eksemplar dipilih
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => window.print()}
              disabled={selectedItems.length === 0}
              className="gap-2 shadow-sm"
            >
              <Printer size={16} />
              Cetak {selectedItems.length} Label
            </Button>
          </div>
        </div>

        {/* ─── PILIH EKSEMPLAR ─── */}
        <Card>
          <CardHeader className="py-3 px-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <button
              onClick={toggleAll}
              className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-primary-600 transition-colors"
            >
              {selected.size === data.items.length
                ? <CheckSquare size={18} className="text-primary-600" />
                : <Square size={18} className="text-slate-400" />
              }
              Pilih Semua Eksemplar ({data.items.length})
            </button>
            <span className="text-xs text-slate-500">
              Pilih eksemplar yang akan dicetak
            </span>
          </CardHeader>
          <CardBody className="p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {data.items.map((item: BookItem) => {
                const isChecked = selected.has(item.item_id)
                return (
                  <label
                    key={item.item_id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isChecked
                        ? "bg-primary-50/60 border-primary-300 text-slate-900 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleItem(item.item_id)}
                      className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs font-bold truncate">{item.item_code}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {item.call_number && item.call_number !== "AUTO" ? item.call_number : "Rak: Umum"}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>
          </CardBody>
        </Card>

        {/* ─── LABEL PREVIEW SECTION HEADER ─── */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-slate-500" />
            <h2 className="text-base font-bold text-slate-800">Pratinjau Lembar Label</h2>
          </div>
          <span className="text-xs text-slate-500">
            Format 2 kolom per baris (10cm × 5cm) · Standar SLiMS
          </span>
        </div>
      </div>

      {/* ─── CONTAINER PREVIEW & PRINT ─── */}
      <div className="preview-and-print-container">
        {/* Style scoped untuk print dan screen preview */}
        <style>{`
          /* Screen preview container */
          @media screen {
            .preview-sheet {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 1rem;
              padding: 1.5rem;
              box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
            }
            .slims-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
              gap: 1.25rem;
            }
            .slims-label-card {
              background: #ffffff;
              border: 1.5px solid #000000;
              border-radius: 0px;
              height: 200px;
              display: flex;
              flex-direction: row;
              overflow: hidden;
              box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
              box-sizing: border-box;
            }
            .slims-barcode-col {
              width: 36%;
              height: 100%;
              border-right: 1px solid #000000;
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
              overflow: hidden;
              background: #ffffff;
              box-sizing: border-box;
            }
            .slims-barcode-rotator {
              transform: rotate(-90deg);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              width: 180px;
              text-align: center;
              flex-shrink: 0;
            }
            .slims-barcode-title {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 7.5pt;
              color: #000000;
              line-height: 1.15;
              max-width: 175px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              margin-bottom: 2px;
            }
            .slims-barcode-svg {
              display: flex;
              justify-content: center;
              align-items: center;
              width: 100%;
            }
            .slims-barcode-digits {
              font-family: "Courier New", Courier, monospace;
              font-size: 9pt;
              font-weight: bold;
              color: #000000;
              letter-spacing: 0.6pt;
              line-height: 1;
              margin-top: 2px;
            }
            .slims-label-col {
              width: 64%;
              height: 100%;
              display: flex;
              flex-direction: column;
              background: #ffffff;
              box-sizing: border-box;
            }
            .slims-label-header {
              background-color: #CCCCCC;
              padding: 6px 8px;
              text-align: center;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 8.5pt;
              font-weight: bold;
              color: #000000;
              letter-spacing: 0.3pt;
              text-transform: uppercase;
              line-height: 1.2;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .slims-label-callnumber {
              flex: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              padding: 8px;
              gap: 2px;
            }
            .slims-call-line {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 15pt;
              font-weight: bold;
              color: #000000;
              line-height: 1.25;
            }
          }

          /* Print styles */
          @media print {
            body {
              background: #ffffff !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .print\\:hidden, header, nav, aside, footer {
              display: none !important;
            }
            @page {
              size: A4 portrait;
              margin: 8mm 6mm;
            }
            .preview-sheet {
              background: transparent !important;
              border: none !important;
              padding: 0 !important;
              box-shadow: none !important;
            }
            .slims-grid {
              display: grid !important;
              grid-template-columns: repeat(2, 96mm) !important;
              gap: 4mm 6mm !important;
              justify-content: center !important;
            }
            .slims-label-card {
              width: 96mm !important;
              height: 48mm !important;
              border: 1px solid #000000 !important;
              border-radius: 0 !important;
              display: flex !important;
              flex-direction: row !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              box-sizing: border-box !important;
              overflow: hidden !important;
              background: #ffffff !important;
            }
            .slims-barcode-col {
              width: 35mm !important;
              height: 48mm !important;
              border-right: 1px solid #000000 !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              overflow: hidden !important;
              box-sizing: border-box !important;
              background: #ffffff !important;
            }
            .slims-barcode-rotator {
              transform: rotate(-90deg) !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              justify-content: center !important;
              width: 44mm !important;
              text-align: center !important;
            }
            .slims-barcode-title {
              font-family: Arial, Helvetica, sans-serif !important;
              font-size: 5.5pt !important;
              line-height: 1.1 !important;
              max-width: 42mm !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              color: #000000 !important;
              margin-bottom: 0.8mm !important;
            }
            .slims-barcode-svg {
              display: flex !important;
              justify-content: center !important;
              align-items: center !important;
              width: 100% !important;
            }
            .slims-barcode-digits {
              font-family: "Courier New", Courier, monospace !important;
              font-size: 7.5pt !important;
              font-weight: bold !important;
              color: #000000 !important;
              letter-spacing: 0.5pt !important;
              line-height: 1 !important;
              margin-top: 0.8mm !important;
            }
            .slims-label-col {
              width: 61mm !important;
              height: 48mm !important;
              display: flex !important;
              flex-direction: column !important;
              box-sizing: border-box !important;
              background: #ffffff !important;
            }
            .slims-label-header {
              background-color: #CCCCCC !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              height: 7mm !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              font-family: Arial, Helvetica, sans-serif !important;
              font-size: 7.5pt !important;
              font-weight: bold !important;
              color: #000000 !important;
              letter-spacing: 0.2pt !important;
              text-transform: uppercase !important;
              text-align: center !important;
              padding: 0 2mm !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
            }
            .slims-label-callnumber {
              flex: 1 !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              justify-content: center !important;
              text-align: center !important;
              padding: 2mm !important;
              gap: 1mm !important;
            }
            .slims-call-line {
              font-family: Arial, Helvetica, sans-serif !important;
              font-size: 13pt !important;
              font-weight: bold !important;
              color: #000000 !important;
              line-height: 1.25 !important;
            }
          }
        `}</style>

        <div className="preview-sheet">
          {selectedItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">Tidak ada eksemplar yang dipilih.</p>
              <p className="text-xs mt-1">Silakan centang satu atau beberapa eksemplar di atas untuk melihat pratinjau dan mencetak.</p>
            </div>
          ) : (
            <div className="slims-grid">
              {selectedItems.map((item: BookItem) => {
                const callLines = parseCallNumber(
                  item.call_number,
                  data.call_number,
                  data.lokasi_rak,
                  data.penulis,
                  data.judul
                )

                return (
                  <div key={item.item_id} className="slims-label-card">
                    {/* SISI KIRI: Barcode & Judul (Rotasi -90°) */}
                    <div className="slims-barcode-col">
                      <div className="slims-barcode-rotator">
                        <div className="slims-barcode-title" title={data.judul}>
                          {truncateTitle(data.judul)}
                        </div>

                        <div className="slims-barcode-svg">
                          <Barcode
                            value={item.item_code}
                            width={1.15}
                            height={28}
                            margin={0}
                            displayValue={false}
                            format="CODE128"
                          />
                        </div>

                        <div className="slims-barcode-digits">
                          {item.item_code}
                        </div>
                      </div>
                    </div>

                    {/* SISI KANAN: Header Perpustakaan & Nomor Panggil */}
                    <div className="slims-label-col">
                      <div className="slims-label-header">
                        PERPUSTAKAAN SMKN 1 CIANJUR
                      </div>

                      <div className="slims-label-callnumber">
                        {callLines.map((line, idx) => (
                          <div key={idx} className="slims-call-line">
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

