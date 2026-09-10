import React from 'react'
import type { TextbookLoanForm } from '@/api/report.service'

interface TextbookLoanFormPrintProps {
  form: TextbookLoanForm
  schoolYear?: string
  dateCityText?: string
  koordinatorName?: string
  koordinatorNip?: string
  stafName?: string
  stafNip?: string
  copies?: number // 1 or 2 copies per page
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

function formatDate(dateStr?: string | null) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yy = d.getFullYear()
    return `${dd}/${mm}/${yy}`
  } catch {
    return dateStr
  }
}

export const TextbookLoanFormPrint: React.FC<TextbookLoanFormPrintProps> = ({
  form,
  schoolYear = '2026 / 2027',
  dateCityText,
  koordinatorName = 'ROSSY RAKHMATU’LAILA, SH',
  koordinatorNip = 'NIP. 198301212025212054',
  stafName = 'YUSMAN',
  stafNip = 'NIP. 197206252025211044',
  copies = 1,
}) => {
  const currentDateCity = dateCityText || `Cianjur, ${new Date().getDate()} ${MONTH_NAMES[new Date().getMonth()]} ${new Date().getFullYear()}`

  // Ensure at least 3 rows in the table
  const items = form.items || []
  const paddedRowsCount = Math.max(3, items.length)
  const rows = Array.from({ length: paddedRowsCount }).map((_, idx) => items[idx] || null)

  const renderSingleForm = (copyIndex: number) => (
    <div key={copyIndex} className="textbook-loan-form-slip relative bg-white pb-6">
      {/* ── HEADER KIRI & KANAN ── */}
      <div className="flex justify-between items-start mb-4">
        {/* Box Kiri: SMK Negeri 1 Cianjur */}
        <div
          className="border-[3px] border-double border-black px-4 py-2 text-center"
          style={{ width: '230px' }}
        >
          <p className="text-[12px] font-bold tracking-tight leading-snug">
            SMK Negeri 1 Cianjur
          </p>
          <p className="text-[9.5px] italic font-serif leading-snug text-gray-800">
            “The Right Place To Get Succes For The Future”
          </p>
        </div>

        {/* Box Kanan: No. Telp & Alamat */}
        <div
          className="border border-black px-3 py-1.5 text-[10.5px] leading-relaxed"
          style={{ width: '275px' }}
        >
          <div className="flex">
            <span className="w-24 shrink-0 font-medium">No. Telp./HP.</span>
            <span className="truncate">: {form.student.telepon || '___________________________________'}</span>
          </div>
          <div className="flex">
            <span className="w-24 shrink-0 font-medium">Alamat</span>
            <span className="truncate">: {form.student.alamat || '___________________________________'}</span>
          </div>
        </div>
      </div>

      {/* ── JUDUL FORMULIR ── */}
      <div className="text-center mb-3">
        <h2 className="text-[12.5px] font-bold tracking-wide uppercase font-sans">
          FORMULIR PEMINJAMAN BUKU TEKS PERPUSTAKAAN
        </h2>
        <p className="text-[12px] font-bold">
          Tahun Pelajaran : {schoolYear}
        </p>
      </div>

      {/* ── IDENTITAS SISWA ── */}
      <div className="text-[11px] space-y-1 mb-3 max-w-[500px]">
        <div className="flex">
          <span className="w-28 tracking-widest font-medium">N a m a</span>
          <span className="font-semibold">: {form.student.nama || '_____________________________'}</span>
        </div>
        <div className="flex">
          <span className="w-28 font-medium">Kelas/Komli.</span>
          <span>: {form.student.kelas || '____'} {form.student.komli || 'AKKUL/MPLB/PS/PPLG/TJKT._____'}</span>
        </div>
      </div>

      {/* ── TABEL PEMINJAMAN ── */}
      <table className="w-full border-collapse border border-black text-[10px] leading-tight mb-4">
        <thead>
          <tr className="border-b border-black text-center font-bold">
            <th className="border-r border-black py-1 px-1 w-[32px]">
              No.<br />Urt
            </th>
            <th className="border-r border-black py-1 px-1 w-[90px]">
              Code Buku/<br />Call Number
            </th>
            <th className="border-r border-black py-1 px-2">
              Judul Buku
            </th>
            <th className="border-r border-black py-1 px-1 w-[75px]">
              Tanggal<br />Pinjam
            </th>
            <th className="border-r border-black py-1 px-1 w-[85px]">
              Tanda tangan<br />Peminjam
            </th>
            <th className="border-r border-black py-1 px-1 w-[75px]">
              Tanggal<br />Kembali
            </th>
            <th className="py-1 px-1 w-[80px]">
              Paraf Petugas<br />Sirkulasi
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, idx) => {
            const rowNo = idx + 1
            if (!item) {
              return (
                <tr key={`pad-${idx}`} className="border-b border-black h-[26px]">
                  <td className="border-r border-black text-center text-gray-400">{rowNo}</td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td></td>
                </tr>
              )
            }
            return (
              <tr key={idx} className="border-b border-black h-[26px]">
                <td className="border-r border-black text-center">{rowNo}</td>
                <td className="border-r border-black px-1 font-mono text-[9px] text-center">
                  {item.call_number || item.code_buku || '-'}
                </td>
                <td className="border-r border-black px-2 font-medium">
                  {item.judul_buku}
                </td>
                <td className="border-r border-black text-center px-1 text-[9px]">
                  {formatDate(item.tanggal_pinjam)}
                </td>
                <td className="border-r border-black text-center text-[8px] text-gray-400">
                  ..........
                </td>
                <td className="border-r border-black text-center px-1 text-[9px]">
                  {item.tanggal_kembali ? formatDate(item.tanggal_kembali) : ''}
                </td>
                <td className="text-center text-[8px] text-gray-400">
                  {item.is_returned ? '✓' : ''}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* ── TANDA TANGAN ── */}
      <div className="w-full text-[10.5px] leading-snug flex justify-between items-start font-sans">
        {/* Kiri: Koordinator */}
        <div className="w-[45%] text-left">
          <p>Mengetahui :</p>
          <p className="font-medium">Koordinator Pengelola kampus 1 dan 2</p>
          <div className="h-[44px]"></div>
          <p className="font-bold">{koordinatorName}</p>
          <p className="font-medium">{koordinatorNip}</p>
        </div>

        {/* Kanan: Staf Pengelola */}
        <div className="w-[48%] text-left pl-6">
          <p>{currentDateCity}</p>
          <p className="font-medium">Staf Pengelola kampus 1,</p>
          <div className="h-[44px]"></div>
          <p className="font-bold">{stafName}</p>
          <p className="font-medium">{stafNip}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="print-textbook-document font-sans text-black bg-white select-none">
      <div
        className="sheet-page relative mx-auto bg-white"
        style={{
          width: '215.9mm',
          minHeight: '355.6mm',
          padding: '14mm 15mm 12mm 15mm',
          boxSizing: 'border-box',
        }}
      >
        {renderSingleForm(0)}

        {copies > 1 && (
          <>
            <div className="my-6 border-b-2 border-dashed border-gray-400 flex items-center justify-center">
              <span className="bg-white px-3 text-[10px] text-gray-500 uppercase tracking-widest font-mono -my-2.5">
                ✂ Potong Di Sini
              </span>
            </div>
            {renderSingleForm(1)}
          </>
        )}
      </div>
    </div>
  )
}
export default TextbookLoanFormPrint
