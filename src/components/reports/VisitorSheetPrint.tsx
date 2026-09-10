import React from 'react'
import type { Visitor } from '@/api/report.service'

interface VisitorSheetPrintProps {
  visitors: Visitor[]
  year: number
  month: number
  week?: number | null
  schoolYear?: string
  dateCityText?: string
  kepalaPerpusName?: string
  kepalaPerpusNip?: string
  koordinatorName?: string
  koordinatorNip?: string
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const ROMAN_WEEKS = ['', 'I', 'II', 'III', 'IV', 'V']
const ROWS_PER_PAGE = 23

function formatIndoDate(dateStr: string) {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const dayName = days[d.getDay()]
    const dateNum = String(d.getDate()).padStart(2, '0')
    const monthNum = String(d.getMonth() + 1).padStart(2, '0')
    const yearNum = d.getFullYear()
    return `${dayName}, ${dateNum}/${monthNum}/${yearNum}`
  } catch {
    return dateStr
  }
}

export const VisitorSheetPrint: React.FC<VisitorSheetPrintProps> = ({
  visitors,
  year,
  month,
  week,
  schoolYear = '2026/2027',
  dateCityText,
  kepalaPerpusName = 'RUBAETUL ADAWIYAH, S.Pd.',
  kepalaPerpusNip = 'NIP. 19800424 201407 2 003',
  koordinatorName = 'ROSSY RAKHMATU’LAILA, SH.',
  koordinatorNip = 'NIP. 19830121 202521 2 054',
}) => {
  const monthName = MONTH_NAMES[month - 1] || '___________________'
  const weekRoman = week ? ROMAN_WEEKS[week] || String(week) : '____'

  // Chunk visitors into pages of 23 rows each
  const totalPages = Math.max(1, Math.ceil(visitors.length / ROWS_PER_PAGE))
  const pages = []
  for (let p = 0; p < totalPages; p++) {
    const pageVisitors = visitors.slice(p * ROWS_PER_PAGE, (p + 1) * ROWS_PER_PAGE)
    pages.push(pageVisitors)
  }

  const currentDateCity = dateCityText || `Cianjur, ${new Date().getDate()} ${MONTH_NAMES[new Date().getMonth()]} ${new Date().getFullYear()}`

  return (
    <div className="print-visitor-document font-sans text-black bg-white select-none">
      {pages.map((pageRows, pageIdx) => {
        // Pad to exactly 23 rows
        const emptyRowsCount = Math.max(0, ROWS_PER_PAGE - pageRows.length)
        const emptyRows = Array.from({ length: emptyRowsCount })
        const startNo = pageIdx * ROWS_PER_PAGE + 1

        return (
          <div
            key={pageIdx}
            className="sheet-page relative mx-auto bg-white"
            style={{
              width: '215.9mm',
              minHeight: '355.6mm',
              padding: '12mm 15mm 12mm 15mm',
              boxSizing: 'border-box',
              pageBreakAfter: pageIdx < pages.length - 1 ? 'always' : 'auto',
              breakAfter: pageIdx < pages.length - 1 ? 'page' : 'auto',
            }}
          >
            {/* ── KOP SURAT RESMI ── */}
            <header className="relative w-full border-b-[2.5px] border-black pb-2 mb-1">
              {/* Logo Pemda Jawa Barat (Kiri) */}
              <div className="absolute left-0 top-0 w-[68px] flex items-center justify-center">
                <img
                  src="/report-assets/logo-jabar.png"
                  alt="Logo Jawa Barat"
                  className="w-full object-contain max-h-[86px]"
                />
              </div>

              {/* Logo SMKN 1 Cianjur (Kanan) */}
              <div className="absolute right-0 top-0 w-[70px] flex items-center justify-center">
                <img
                  src="/report-assets/logo-smakzie-kop.png"
                  alt="Logo SMKN 1 Cianjur"
                  className="w-full object-contain max-h-[86px]"
                />
              </div>

              {/* Teks Kop Tengah */}
              <div className="text-center px-16 leading-tight">
                <h2 className="text-[13px] font-bold tracking-wide font-arial uppercase">
                  PEMERINTAH DAERAH PROVINSI JAWA BARAT
                </h2>
                <h2 className="text-[13px] font-bold tracking-wide font-arial uppercase">
                  DINAS PENDIDIKAN
                </h2>
                <h2 className="text-[13px] font-bold tracking-wide font-arial uppercase">
                  CABANG DINAS PENDIDIKAN WILAYAH VI
                </h2>
                <h1 className="text-[19px] font-extrabold tracking-wider font-arial uppercase my-0.5">
                  SMK NEGERI 1 CIANJUR
                </h1>
                <p className="text-[9.5px] font-semibold text-gray-900 tracking-tight">
                  BIDANG STUDI KEAHLIAN BISNIS MANAJEMEN & TEKNOLOGI INFORMASI DAN KOMUNIKASI
                </p>
                <p className="text-[10px] text-gray-800">
                  Kampus I : Jalan Siliwangi No. 41 &#9742; (0263) 261265
                </p>
                <p className="text-[10px] text-gray-800">
                  Kampus 2 : Jalan Pangeran Hidayatullah No. 67 &#9742; (0263) 261949
                </p>
                <p className="text-[10px] text-gray-800">
                  Fax (0263) 272561 – Cianjur – 43212
                </p>
                <p className="text-[8.5px] text-gray-700">
                  Facebook : https://www.facebook.com/SMKN1CIANJUR/ Instagram : https://www.instagram.com/smakzie/
                </p>
                <p className="text-[8.5px] text-gray-700">
                  Twitter : https://twitter.com/CianjurSMKN?lang=en Website: http://www.smkn1cianjur.sch.id E-mail : info@smkn1cianjur.sch.id
                </p>
                <p className="text-[11px] italic font-serif text-gray-800 mt-0.5">
                  “The Right Place To Get Succes For The Future”
                </p>
              </div>
            </header>

            {/* Garis Ganda Pemisah Kop (Garis tipis bawah) */}
            <div className="w-full border-t border-black mb-3"></div>

            {/* Badge SMK BISA - HEBAT di kanan atas */}
            <div className="flex justify-end -mt-2 mb-1">
              <img
                src="/report-assets/logo-smk-bisa.png"
                alt="SMK BISA HEBAT"
                className="w-[125px] object-contain"
              />
            </div>

            {/* Judul Dokumen */}
            <div className="text-center mb-3">
              <h2 className="text-[16px] font-extrabold tracking-wide uppercase font-sans">
                DAFTAR PENGUNJUNG PERPUSTAKAAN
              </h2>
              <p className="text-[12px] font-bold tracking-wider">
                TAHUN PELAJARAN : {schoolYear}
              </p>
            </div>

            {/* Keterangan Periode (Bulan & Minggu) */}
            <div className="text-[11px] font-bold space-y-0.5 mb-2">
              <div className="flex">
                <span className="w-24 inline-block">BULAN</span>
                <span>: {monthName} {year}</span>
              </div>
              <div className="flex">
                <span className="w-24 inline-block">MINGGU KE</span>
                <span>: {weekRoman} (I/II/III/IV/V) *)</span>
              </div>
            </div>

            {/* ── TABEL UTAMA DENGAN WATERMARK ── */}
            <div className="relative w-full border border-black mb-4">
              {/* Watermark Logo SMKN 1 Cianjur di Latar Belakang Tabel */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
                style={{ zIndex: 0 }}
              >
                <img
                  src="/report-assets/watermark-smakzie.png"
                  alt="Watermark"
                  className="w-[360px] opacity-[0.22] object-contain"
                />
              </div>

              {/* Tabel */}
              <table className="relative z-10 w-full border-collapse text-[10px] leading-tight">
                <thead>
                  <tr className="border-b border-black text-center font-bold bg-white/75">
                    <th rowSpan={2} className="border-r border-black py-1 px-1 w-[32px]">
                      No.<br />Urt.
                    </th>
                    <th rowSpan={2} className="border-r border-black py-1 px-2 w-[88px]">
                      Hari/Tanggal
                    </th>
                    <th rowSpan={2} className="border-r border-black py-1 px-2">
                      Nama Pengunjung
                    </th>
                    <th rowSpan={2} className="border-r border-black py-1 px-1 w-[78px]">
                      Kelas/<br />Jurusan
                    </th>
                    <th colSpan={3} className="border-r border-black py-1 px-1">
                      KEPENTINGAN
                    </th>
                    <th rowSpan={2} className="py-1 px-2 w-[82px]">
                      Tanda<br />Tangan
                    </th>
                  </tr>
                  <tr className="border-b border-black text-center font-bold bg-white/75">
                    <th className="border-r border-black py-1 px-1 w-[46px]">BACA</th>
                    <th className="border-r border-black py-1 px-1 w-[50px]">PINJAM</th>
                    <th className="border-r border-black py-1 px-1 w-[54px]">KEMBALI</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((v, i) => {
                    const rowNo = startNo + i
                    const isBaca = v.keperluan === 'baca'
                    const isPinjam = v.keperluan === 'pinjam'
                    const isKembali = v.keperluan === 'kembali'
                    return (
                      <tr key={v.id || i} className="border-b border-black h-[21px]">
                        <td className="border-r border-black text-center px-1">
                          {rowNo}
                        </td>
                        <td className="border-r border-black px-1.5 whitespace-nowrap text-[9px]">
                          {formatIndoDate(v.visited_at)}
                        </td>
                        <td className="border-r border-black px-2 font-medium truncate max-w-[160px]">
                          {v.nama}
                        </td>
                        <td className="border-r border-black text-center px-1 text-[9px] truncate max-w-[75px]">
                          {v.kelas || '-'}
                        </td>
                        <td className="border-r border-black text-center font-bold text-sm">
                          {isBaca ? '✓' : ''}
                        </td>
                        <td className="border-r border-black text-center font-bold text-sm">
                          {isPinjam ? '✓' : ''}
                        </td>
                        <td className="border-r border-black text-center font-bold text-sm">
                          {isKembali ? '✓' : ''}
                        </td>
                        <td className="px-2 text-center text-[8px] text-gray-500">
                          {rowNo % 2 !== 0 ? (
                            <div className="text-left">{rowNo}. ................</div>
                          ) : (
                            <div className="text-right">{rowNo}. ................</div>
                          )}
                        </td>
                      </tr>
                    )
                  })}

                  {/* Empty Padding Rows up to 23 rows */}
                  {emptyRows.map((_, i) => {
                    const rowNo = pageRows.length + startNo + i
                    return (
                      <tr key={`empty-${i}`} className="border-b border-black h-[21px]">
                        <td className="border-r border-black text-center px-1 text-gray-400">
                          {rowNo}
                        </td>
                        <td className="border-r border-black px-1.5"></td>
                        <td className="border-r border-black px-2"></td>
                        <td className="border-r border-black px-1"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="px-2 text-[8px] text-gray-400">
                          {rowNo % 2 !== 0 ? (
                            <div className="text-left">{rowNo}. ................</div>
                          ) : (
                            <div className="text-right">{rowNo}. ................</div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* ── TANDA TANGAN RESMI ── */}
            <div className="w-full mt-3 text-[11px] leading-snug flex justify-between items-start font-serif">
              {/* Kolom Kiri: Kepala Perpustakaan */}
              <div className="w-[45%] text-left">
                <p>Mengetahui:</p>
                <p className="font-medium">Kepala Perpustakaan,</p>
                <div className="h-[52px]"></div>
                <p className="font-bold underline">{kepalaPerpusName}</p>
                <p className="font-medium">{kepalaPerpusNip}</p>
              </div>

              {/* Kolom Kanan: Koordinator Pengelola */}
              <div className="w-[48%] text-left pl-6">
                <p>{currentDateCity}</p>
                <p className="font-medium">Koordinator Pengelola Perpustakaan</p>
                <p className="font-medium">Kampus 1 dan 2,</p>
                <div className="h-[36px]"></div>
                <p className="font-bold underline">{koordinatorName}</p>
                <p className="font-medium">{koordinatorNip}</p>
              </div>
            </div>

            {/* Halaman info if multi-page */}
            {totalPages > 1 && (
              <div className="text-right text-[9px] text-gray-500 mt-2 font-sans">
                Halaman {pageIdx + 1} dari {totalPages}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
export default VisitorSheetPrint
