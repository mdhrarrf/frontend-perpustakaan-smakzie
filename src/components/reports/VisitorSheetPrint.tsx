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
// 25 baris per halaman menjamin 1 lembar F4 pas sempurna dan blok tanda tangan tidak akan pernah loncat ke page 2
const ROWS_PER_PAGE = 25

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

// Vector Phone Icon resmi (telepon kantor hitam sesuai kop surat asli)
const PhoneIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    className="inline-block w-[10px] h-[10px] mx-1 text-black fill-current align-baseline"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20 4H4c-1.1 0-2 .9-2 2v1c0 1.1.9 2 2 2h.6l1.6 9c.16.89.93 1.54 1.83 1.54h7.94c.9 0 1.67-.65 1.83-1.54l1.6-9h.6c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 12.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5zm0-5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z" />
  </svg>
)

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

  // Format Bulan
  const monthText = isPrintBlank
    ? '___________________ 20__'
    : `${(MONTH_NAMES[month - 1] || '').toUpperCase()} ${year}`

  // Format Minggu Ke Otomatis
  let weekRoman = ''
  if (week && week >= 1 && week <= 5) {
    weekRoman = ROMAN_WEEKS[week]
  } else if (!isPrintBlank && visitors.length > 0) {
    const firstDate = new Date(visitors[0].visited_at)
    if (!isNaN(firstDate.getTime())) {
      const autoW = Math.min(5, Math.ceil(firstDate.getDate() / 7))
      weekRoman = ROMAN_WEEKS[autoW] || ''
    }
  } else if (!isPrintBlank) {
    const now = new Date()
    if (now.getFullYear() === year && (now.getMonth() + 1) === month) {
      const autoW = Math.min(5, Math.ceil(now.getDate() / 7))
      weekRoman = ROMAN_WEEKS[autoW] || ''
    }
  }

  const weekDisplayText = isPrintBlank
    ? '____'
    : (weekRoman || 'I')

  // Titimangsa Tanggal
  const currentDateCity = dateCityText || 'Cianjur, _________________ 20___'

  // Pisahkan visitors menjadi halaman-halaman (masing-masing 20 baris)
  const totalPages = isPrintBlank ? 1 : Math.max(1, Math.ceil(visitors.length / ROWS_PER_PAGE))
  const pages = []
  for (let p = 0; p < totalPages; p++) {
    const pageVisitors = isPrintBlank ? [] : visitors.slice(p * ROWS_PER_PAGE, (p + 1) * ROWS_PER_PAGE)
    pages.push(pageVisitors)
  }

  return (
    <div
      className="print-visitor-document text-black select-none w-full"
      style={{ fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif' }}
    >
      <div className="flex flex-col items-center gap-8 print:gap-0">
        {pages.map((pageRows, pageIdx) => {
          const emptyRowsCount = Math.max(0, ROWS_PER_PAGE - pageRows.length)
          const emptyRows = Array.from({ length: emptyRowsCount })
          const startNo = pageIdx * ROWS_PER_PAGE + 1
          const endNo = startNo + pageRows.length - 1

          return (
            <div key={pageIdx} className="w-full flex flex-col items-center">
              {/* Header Pemisah Halaman di Web Preview agar terlihat jelas per lembar */}
              <div className="no-print mb-2 flex items-center justify-between w-[215.9mm] px-1 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  📄 Lembar Fisik {pageIdx + 1} dari {totalPages}
                </span>
                <span className="text-slate-400">
                  {pageRows.length > 0 ? `Data Baris ${startNo} - ${endNo}` : 'Lembar Blanko Kosong'} (Kertas F4 / Folio)
                </span>
              </div>

              {/* Kontainer Lembar Kertas F4 Individual */}
              <div
                className="sheet-page bg-white shadow-lg border border-slate-300 print:shadow-none print:border-none relative mx-auto"
                style={{
                  width: '215.9mm',
                  minHeight: '330mm',
                  padding: '10mm 14mm 10mm 14mm',
                  boxSizing: 'border-box',
                  pageBreakAfter: pageIdx < pages.length - 1 ? 'always' : 'auto',
                  breakAfter: pageIdx < pages.length - 1 ? 'page' : 'auto',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid',
                }}
              >
                {/* ── 1. KOP SURAT RESMI PEMPROV JABAR & SMKN 1 CIANJUR (LOGO PRESISI & TENGAH) ── */}
                <div className="sheet-kop-header w-full pb-1 mb-1">
                  <div className="flex items-center justify-between gap-2 w-full">
                    {/* Logo Pemda Jawa Barat (Kiri) - Vertically Centered */}
                    <div className="w-[96px] flex-shrink-0 flex items-center justify-center">
                      <img
                        src="/report-assets/logo-jabar.png"
                        alt="Logo Jawa Barat"
                        className="w-[92px] h-auto object-contain max-h-[110px]"
                      />
                    </div>

                    {/* Teks Kop Tengah */}
                    <div className="flex-1 text-center px-1 leading-[1.22] text-black">
                      <h2 className="text-[10pt] font-bold tracking-wide uppercase">
                        PEMERINTAH DAERAH PROVINSI JAWA BARAT
                      </h2>
                      <h2 className="text-[10pt] font-bold tracking-wide uppercase">
                        DINAS PENDIDIKAN
                      </h2>
                      <h2 className="text-[10pt] font-bold tracking-wide uppercase">
                        CABANG DINAS PENDIDIKAN WILAYAH VI
                      </h2>
                      <h1 className="text-[14.5pt] font-black tracking-wider uppercase my-0.5">
                        SMK NEGERI 1 CIANJUR
                      </h1>
                      <p className="text-[7.2pt] font-bold tracking-tight text-black">
                        BIDANG STUDI KEAHLIAN BISNIS MANAJEMEN & TEKNOLOGI INFORMASI DAN KOMUNIKASI
                      </p>
                      <p className="text-[7.8pt] text-black">
                        Kampus I : Jalan Siliwangi No. 41 <PhoneIcon /> (0263) 261265
                      </p>
                      <p className="text-[7.8pt] text-black">
                        Kampus 2 : Jalan Pangeran Hidayatullah No. 67 <PhoneIcon /> (0263) 261949
                      </p>
                      <p className="text-[7.8pt] text-black">
                        Fax (0263) 272561 – Cianjur – 43212
                      </p>
                      <p className="text-[7.2pt] text-black">
                        Facebook : <span className="underline">https://www.facebook.com/SMKN1CIANJUR/</span> Instagram : <span className="underline">https://www.instagram.com/smakzie/</span>
                      </p>
                      <p className="text-[7.2pt] text-black">
                        Twitter : <span className="underline">https://twitter.com/CianjurSMKN?lang=en</span> Website: <span className="underline">http://www.smkn1cianjur.sch.id</span> E-mail :
                      </p>
                      <p className="text-[7.2pt] text-black">
                        <span className="underline">info@smkn1cianjur.sch.id</span>
                      </p>
                      <p
                        className="text-[9pt] italic text-black mt-0.5"
                        style={{ fontFamily: '"Brush Script MT", "Segoe Script", "Dancing Script", cursive, "Times New Roman", Times, serif' }}
                      >
                        “The Right Place To Get Succes For The Future”
                      </p>
                    </div>

                    {/* Logo SMKN 1 Cianjur (Kanan) - Vertically Centered */}
                    <div className="w-[84px] flex-shrink-0 flex items-center justify-center">
                      <img
                        src="/report-assets/logo-smakzie-kop.png"
                        alt="Logo SMKN 1 Cianjur"
                        className="w-[80px] h-auto object-contain max-h-[105px]"
                      />
                    </div>
                  </div>

                  {/* Garis Ganda Pemisah Kop (Garis tebal atas 2.5px, garis tipis bawah 1px) */}
                  <div className="w-full mt-2">
                    <div className="border-t-[2.5px] border-black"></div>
                    <div className="border-t border-black mt-[1.5px]"></div>
                  </div>
                </div>

                {/* Logo SMK Bisa - Hebat di Sebelah Kanan Bawah Kop */}
                <div className="flex justify-end pr-1 -mt-1 mb-1">
                  <img
                    src="/report-assets/logo-smk-bisa.png"
                    alt="SMK Bisa Hebat"
                    className="h-[28px] object-contain"
                  />
                </div>

                {/* ── 2. JUDUL DOKUMEN & TAHUN PELAJARAN ── */}
                <div className="text-center mb-2 text-black">
                  <h2 className="text-[12.5pt] font-black tracking-wider uppercase underline decoration-1 underline-offset-2">
                    DAFTAR PENGUNJUNG PERPUSTAKAAN
                  </h2>
                  <h3 className="text-[11pt] font-bold tracking-wide uppercase mt-0.5">
                    TAHUN PELAJARAN : {schoolYearText}
                  </h3>
                </div>

                {/* ── 3. METADATA BULAN & MINGGU ── */}
                <div className="text-[10pt] font-bold space-y-0.5 mb-2 text-black">
                  <div className="flex items-center">
                    <span className="w-24 inline-block font-bold">BULAN</span>
                    <span>: {monthText}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-24 inline-block font-bold">MINGGU KE</span>
                    <span>
                      : <strong className="font-black underline px-1">{weekDisplayText}</strong> (I/II/III/IV/V) *)
                    </span>
                  </div>
                </div>

                {/* ── 4. TABEL UTAMA (LEGA, RAPIH, TANPA KOLOM TANDA TANGAN, TANPA WAKTU & KETERANGAN) ── */}
                <div className="sheet-table relative w-full border border-black mb-3">
                  {/* Watermark Logo SMKN 1 Cianjur di Latar Belakang Tabel */}
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
                    style={{ zIndex: 0 }}
                  >
                    <img
                      src="/report-assets/watermark-smakzie.png"
                      alt="Watermark"
                      className="w-[360px] opacity-[0.14] object-contain select-none"
                    />
                  </div>

                  <table className="relative z-10 w-full border-collapse text-[9pt] leading-tight text-black">
                    <thead>
                      <tr className="border-b border-black text-center font-bold bg-white/75">
                        <th rowSpan={2} className="border-r border-black py-1.5 px-1 w-[36px]">
                          No.<br />Urt.
                        </th>
                        <th rowSpan={2} className="border-r border-black py-1.5 px-2 w-[120px]">
                          Hari / Tanggal
                        </th>
                        <th rowSpan={2} className="border-r border-black py-1.5 px-3 text-left">
                          Nama Pengunjung
                        </th>
                        <th rowSpan={2} className="border-r border-black py-1.5 px-2 w-[110px]">
                          Kelas /<br />Jurusan
                        </th>
                        <th colSpan={3} className="py-1 px-1 w-[180px]">
                          KEPENTINGAN
                        </th>
                      </tr>
                      <tr className="border-b border-black text-center font-bold bg-white/75">
                        <th className="border-r border-black py-1 px-1 w-[56px]">BACA</th>
                        <th className="border-r border-black py-1 px-1 w-[60px]">PINJAM</th>
                        <th className="py-1 px-1 w-[64px]">KEMBALI</th>
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
                            <td className="border-r border-black text-center px-1 text-[8.5pt]">
                              {rowNo}
                            </td>
                            <td className="border-r border-black px-2 text-center whitespace-nowrap text-[8pt]">
                              {formatIndoDate(v.visited_at)}
                            </td>
                            <td className="border-r border-black px-2.5 font-medium truncate max-w-[260px] text-[8.5pt]">
                              {v.nama}
                            </td>
                            <td className="border-r border-black text-center px-2 text-[8pt] truncate max-w-[110px]">
                              {v.kelas || '—'}
                            </td>
                            <td className="border-r border-black text-center font-bold text-xs">
                              {isBaca ? '✓' : ''}
                            </td>
                            <td className="border-r border-black text-center font-bold text-xs">
                              {isPinjam ? '✓' : ''}
                            </td>
                            <td className="text-center font-bold text-xs">
                              {isKembali ? '✓' : ''}
                            </td>
                          </tr>
                        )
                      })}

                      {/* Empty Padding Rows up to exactly 25 rows per page */}
                      {emptyRows.map((_, i) => {
                        const rowNo = pageRows.length + startNo + i
                        return (
                          <tr key={`empty-${i}`} className="border-b border-black h-[21px]">
                            <td className="border-r border-black text-center px-1 text-gray-400 text-[8.5pt]">
                              {rowNo}
                            </td>
                            <td className="border-r border-black px-2"></td>
                            <td className="border-r border-black px-2.5"></td>
                            <td className="border-r border-black px-2"></td>
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── 5. TANDA TANGAN RESMI (DIJAMIN PAS DI HALAMAN YANG SAMA) ── */}
                <div
                  className="sheet-signatures w-full mt-2.5 text-[9.5pt] leading-snug flex justify-between items-start text-black"
                  style={{
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid',
                  }}
                >
                  {/* Kolom Kiri: Kepala Perpustakaan */}
                  <div className="w-[45%] text-left pl-2">
                    <p className="font-normal">Mengetahui:</p>
                    <p className="font-normal">Kepala Perpustakaan,</p>
                    <div className="h-[42px]"></div>
                    <p className="font-bold text-black uppercase tracking-wide">{kepalaPerpusName}</p>
                    <p className="text-[9pt] text-black tracking-normal">{kepalaPerpusNip}</p>
                  </div>

                  {/* Kolom Kanan: Koordinator Pengelola Perpustakaan */}
                  <div className="w-[48%] text-left pl-6">
                    <p className="font-normal">{currentDateCity}</p>
                    <p className="font-normal">Koordinator Pengelola Perpustakaan</p>
                    <p className="font-normal">Kampus 1 dan 2,</p>
                    <div className="h-[28px]"></div>
                    <p className="font-bold text-black uppercase tracking-wide">{koordinatorName}</p>
                    <p className="text-[9pt] text-black tracking-normal">{koordinatorNip}</p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
