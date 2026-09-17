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
  isPrintBlank?: boolean
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
  schoolYear,
  dateCityText,
  kepalaPerpusName = 'RUBAETUL ADAWIYAH, S.Pd.',
  kepalaPerpusNip = 'NIP. 19800424 201407 2 003',
  koordinatorName = 'ROSSY RAKHMATU’LAILA, SH.',
  koordinatorNip = 'NIP. 19830121 202521 2 054',
  isPrintBlank = false,
}) => {
  // Format Tahun Pelajaran
  const schoolYearText = schoolYear || (isPrintBlank ? '20__ / 20__' : `${year} / ${year + 1}`)

  // Format Bulan & Minggu
  const monthText = isPrintBlank
    ? '___________________ 20__'
    : `${MONTH_NAMES[month - 1] || '___________________'} ${year}`

  const weekText = isPrintBlank
    ? '____'
    : (week ? ROMAN_WEEKS[week] || String(week) : '____')

  // Titimangsa Tanggal
  const currentDateCity = dateCityText || 'Cianjur, _________________ 20___'

  // Chunk visitors into pages of 23 rows each (or 1 page of 23 blank rows if isPrintBlank)
  const totalPages = isPrintBlank ? 1 : Math.max(1, Math.ceil(visitors.length / ROWS_PER_PAGE))
  const pages = []
  for (let p = 0; p < totalPages; p++) {
    const pageVisitors = isPrintBlank ? [] : visitors.slice(p * ROWS_PER_PAGE, (p + 1) * ROWS_PER_PAGE)
    pages.push(pageVisitors)
  }

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
              minHeight: '330mm',
              padding: '10mm 14mm 10mm 14mm',
              boxSizing: 'border-box',
              pageBreakAfter: pageIdx < pages.length - 1 ? 'always' : 'auto',
              breakAfter: pageIdx < pages.length - 1 ? 'page' : 'auto',
            }}
          >
            {/* ── KOP SURAT RESMI PEMPROV JABAR & SMKN 1 CIANJUR ── */}
            <header className="relative w-full pb-1 mb-1">
              {/* Logo Pemda Jawa Barat (Kiri) */}
              <div className="absolute left-0 top-1 w-[72px] flex items-center justify-center">
                <img
                  src="/report-assets/logo-jabar.png"
                  alt="Logo Jawa Barat"
                  className="w-full object-contain max-h-[90px]"
                />
              </div>

              {/* Logo SMKN 1 Cianjur (Kanan) */}
              <div className="absolute right-0 top-1 w-[74px] flex items-center justify-center">
                <img
                  src="/report-assets/logo-smakzie-kop.png"
                  alt="Logo SMKN 1 Cianjur"
                  className="w-full object-contain max-h-[90px]"
                />
              </div>

              {/* Teks Kop Tengah */}
              <div className="text-center px-16 leading-[1.25] text-black">
                <h2 className="text-[12.5px] font-bold tracking-wide uppercase font-sans">
                  PEMERINTAH DAERAH PROVINSI JAWA BARAT
                </h2>
                <h2 className="text-[12.5px] font-bold tracking-wide uppercase font-sans">
                  DINAS PENDIDIKAN
                </h2>
                <h2 className="text-[12.5px] font-bold tracking-wide uppercase font-sans">
                  CABANG DINAS PENDIDIKAN WILAYAH VI
                </h2>
                <h1 className="text-[18px] font-black tracking-wider uppercase font-sans my-0.5">
                  SMK NEGERI 1 CIANJUR
                </h1>
                <p className="text-[9px] font-bold tracking-tight text-black">
                  BIDANG STUDI KEAHLIAN BISNIS MANAJEMEN & TEKNOLOGI INFORMASI DAN KOMUNIKASI
                </p>
                <p className="text-[9.5px] text-black">
                  Kampus I : Jalan Siliwangi No. 41 ☎ (0263) 261265
                </p>
                <p className="text-[9.5px] text-black">
                  Kampus 2 : Jalan Pangeran Hidayatullah No. 67 ☎ (0263) 261949
                </p>
                <p className="text-[9.5px] text-black">
                  Fax (0263) 272561 – Cianjur – 43212
                </p>
                <p className="text-[8.5px] text-black">
                  Facebook : https://www.facebook.com/SMKN1CIANJUR/ Instagram : https://www.instagram.com/smakzie/
                </p>
                <p className="text-[8.5px] text-black">
                  Twitter : https://twitter.com/CianjurSMKN?lang=en Website: http://www.smkn1cianjur.sch.id E-mail : info@smkn1cianjur.sch.id
                </p>
                <p className="text-[10.5px] italic font-serif text-black mt-0.5">
                  “The Right Place To Get Succes For The Future”
                </p>
              </div>

              {/* Garis Ganda Pemisah Kop (Garis tebal atas 2.5px, garis tipis bawah 1px) */}
              <div className="w-full mt-2">
                <div className="border-t-[2.5px] border-black"></div>
                <div className="border-t border-black mt-[1.5px]"></div>
              </div>
            </header>

            {/* Badge Logo SMK BISA - HEBAT di kanan atas */}
            <div className="flex justify-end -mt-0.5 mb-1">
              <img
                src="/report-assets/logo-smk-bisa.png"
                alt="SMK BISA HEBAT"
                className="w-[125px] object-contain"
              />
            </div>

            {/* Judul Dokumen */}
            <div className="text-center mb-2">
              <h2 className="text-[15px] font-extrabold tracking-wide uppercase font-sans text-black">
                DAFTAR PENGUNJUNG PERPUSTAKAAN
              </h2>
              <p className="text-[12px] font-bold tracking-wider text-black">
                TAHUN PELAJARAN : {schoolYearText}
              </p>
            </div>

            {/* Keterangan Periode (Bulan & Minggu) */}
            <div className="text-[11px] font-bold space-y-0.5 mb-2 text-black">
              <div className="flex items-center">
                <span className="w-24 inline-block font-sans">BULAN</span>
                <span>: {monthText}</span>
              </div>
              <div className="flex items-center">
                <span className="w-24 inline-block font-sans">MINGGU KE</span>
                <span>: {weekText} (I/II/III/IV/V) *)</span>
              </div>
            </div>

            {/* ── TABEL UTAMA DENGAN WATERMARK PERPUSTAKAAN ── */}
            <div className="relative w-full border border-black mb-3">
              {/* Watermark Logo SMKN 1 Cianjur di Latar Belakang Tabel */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
                style={{ zIndex: 0 }}
              >
                <img
                  src="/report-assets/watermark-smakzie.png"
                  alt="Watermark"
                  className="w-[380px] opacity-[0.16] object-contain select-none"
                />
              </div>

              {/* Tabel Data Pengunjung */}
              <table className="relative z-10 w-full border-collapse text-[10px] leading-tight text-black">
                <thead>
                  <tr className="border-b border-black text-center font-bold bg-white/70">
                    <th rowSpan={2} className="border-r border-black py-1 px-1 w-[32px] font-sans">
                      No.<br />Urt.
                    </th>
                    <th rowSpan={2} className="border-r border-black py-1 px-1.5 w-[86px] font-sans">
                      Hari/Tanggal
                    </th>
                    <th rowSpan={2} className="border-r border-black py-1 px-2 font-sans">
                      Nama Pengunjung
                    </th>
                    <th rowSpan={2} className="border-r border-black py-1 px-1 w-[78px] font-sans">
                      Kelas/<br />Jurusan
                    </th>
                    <th colSpan={3} className="border-r border-black py-1 px-1 font-sans">
                      KEPENTINGAN
                    </th>
                    <th rowSpan={2} className="py-1 px-2 w-[85px] font-sans">
                      Tanda<br />Tangan
                    </th>
                  </tr>
                  <tr className="border-b border-black text-center font-bold bg-white/70">
                    <th className="border-r border-black py-1 px-1 w-[46px] font-sans">BACA</th>
                    <th className="border-r border-black py-1 px-1 w-[50px] font-sans">PINJAM</th>
                    <th className="border-r border-black py-1 px-1 w-[54px] font-sans">KEMBALI</th>
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
                        <td className="border-r border-black text-center px-1 font-sans">
                          {rowNo}
                        </td>
                        <td className="border-r border-black px-1.5 whitespace-nowrap text-[9px] font-sans">
                          {formatIndoDate(v.visited_at)}
                        </td>
                        <td className="border-r border-black px-2 font-medium truncate max-w-[160px] font-sans">
                          {v.nama}
                        </td>
                        <td className="border-r border-black text-center px-1 text-[9px] truncate max-w-[75px] font-sans">
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
                        <td className="px-2 text-center text-[8px] text-gray-700 font-sans">
                          {rowNo % 2 !== 0 ? (
                            <div className="text-left">{rowNo}. ................</div>
                          ) : (
                            <div className="text-right">{rowNo}. ................</div>
                          )}
                        </td>
                      </tr>
                    )
                  })}

                  {/* Empty Padding Rows up to exactly 23 rows */}
                  {emptyRows.map((_, i) => {
                    const rowNo = pageRows.length + startNo + i
                    return (
                      <tr key={`empty-${i}`} className="border-b border-black h-[21px]">
                        <td className="border-r border-black text-center px-1 text-gray-400 font-sans">
                          {rowNo}
                        </td>
                        <td className="border-r border-black px-1.5"></td>
                        <td className="border-r border-black px-2"></td>
                        <td className="border-r border-black px-1"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="px-2 text-[8px] text-gray-400 font-sans">
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
            <div className="w-full mt-2 text-[11px] leading-snug flex justify-between items-start font-sans text-black">
              {/* Kolom Kiri: Kepala Perpustakaan */}
              <div className="w-[45%] text-left pl-2">
                <p>Mengetahui:</p>
                <p>Kepala Perpustakaan,</p>
                <div className="h-[54px]"></div>
                <p className="font-bold text-black">{kepalaPerpusName}</p>
                <p className="text-[10.5px] text-black">{kepalaPerpusNip}</p>
              </div>

              {/* Kolom Kanan: Koordinator Pengelola */}
              <div className="w-[48%] text-left pl-4">
                <p>{currentDateCity}</p>
                <p>Koordinator Pengelola Perpustakaan</p>
                <p>Kampus 1 dan 2,</p>
                <div className="h-[38px]"></div>
                <p className="font-bold text-black">{koordinatorName}</p>
                <p className="text-[10.5px] text-black">{koordinatorNip}</p>
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
