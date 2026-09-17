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

function formatIndoTime(dateStr: string) {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '-'
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  } catch {
    return '-'
  }
}

// Vector Phone Icon (bukan emoji)
const PhoneIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    className="inline-block w-2.5 h-2.5 mx-1 text-black fill-current align-baseline"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-2.2 2.2a15.053 15.053 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.57 3.9c0-.55-.45-1-1-1H4.07c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.52c0-.55-.45-1-1.06-1z" />
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
    // Deteksi otomatis minggu dari tanggal record pertama
    const firstDate = new Date(visitors[0].visited_at)
    if (!isNaN(firstDate.getTime())) {
      const autoW = Math.min(5, Math.ceil(firstDate.getDate() / 7))
      weekRoman = ROMAN_WEEKS[autoW] || ''
    }
  } else if (!isPrintBlank) {
    // Default ke minggu aktif bulan ini
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

  // Chunk visitors into pages of 25 rows each
  const totalPages = isPrintBlank ? 1 : Math.max(1, Math.ceil(visitors.length / ROWS_PER_PAGE))
  const pages = []
  for (let p = 0; p < totalPages; p++) {
    const pageVisitors = isPrintBlank ? [] : visitors.slice(p * ROWS_PER_PAGE, (p + 1) * ROWS_PER_PAGE)
    pages.push(pageVisitors)
  }

  return (
    <div
      className="print-visitor-document text-black bg-white select-none"
      style={{ fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif' }}
    >
      {pages.map((pageRows, pageIdx) => {
        // Pad to exactly 25 rows
        const emptyRowsCount = Math.max(0, ROWS_PER_PAGE - pageRows.length)
        const emptyRows = Array.from({ length: emptyRowsCount })
        const startNo = pageIdx * ROWS_PER_PAGE + 1

        return (
          <div
            key={pageIdx}
            className="sheet-page relative mx-auto bg-white flex flex-col justify-between"
            style={{
              width: '215.9mm',
              height: '330mm',
              minHeight: '330mm',
              maxHeight: '330mm',
              padding: '10mm 14mm 10mm 14mm',
              boxSizing: 'border-box',
              pageBreakAfter: pageIdx < pages.length - 1 ? 'always' : 'auto',
              breakAfter: pageIdx < pages.length - 1 ? 'page' : 'auto',
              fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
            }}
          >
            {/* ── BAGIAN ATAS: KOP SURAT & JUDUL LAPORAN ── */}
            <div>
              {/* Kop Surat Resmi Pemprov Jabar & SMKN 1 Cianjur */}
              {/* Catatan: Menggunakan div sheet-kop-header, BUKAN tag header agar tidak terkena display:none saat print */}
              <div className="sheet-kop-header relative w-full pb-1 mb-1">
                {/* Logo Pemda Jawa Barat (Kiri) */}
                <div className="absolute left-0 top-1 w-[68px] flex items-center justify-center">
                  <img
                    src="/report-assets/logo-jabar.png"
                    alt="Logo Jawa Barat"
                    className="w-full object-contain max-h-[88px]"
                  />
                </div>

                {/* Logo SMKN 1 Cianjur (Kanan) */}
                <div className="absolute right-0 top-1 w-[70px] flex items-center justify-center">
                  <img
                    src="/report-assets/logo-smakzie-kop.png"
                    alt="Logo SMKN 1 Cianjur"
                    className="w-full object-contain max-h-[88px]"
                  />
                </div>

                {/* Teks Kop Tengah */}
                <div className="text-center px-16 leading-[1.25] text-black">
                  <h2 className="text-[11pt] font-bold tracking-wide uppercase">
                    PEMERINTAH DAERAH PROVINSI JAWA BARAT
                  </h2>
                  <h2 className="text-[11pt] font-bold tracking-wide uppercase">
                    DINAS PENDIDIKAN
                  </h2>
                  <h2 className="text-[11pt] font-bold tracking-wide uppercase">
                    CABANG DINAS PENDIDIKAN WILAYAH VI
                  </h2>
                  <h1 className="text-[15pt] font-black tracking-wider uppercase my-0.5">
                    SMK NEGERI 1 CIANJUR
                  </h1>
                  <p className="text-[7.5pt] font-bold tracking-tight text-black">
                    BIDANG STUDI KEAHLIAN BISNIS MANAJEMEN & TEKNOLOGI INFORMASI DAN KOMUNIKASI
                  </p>
                  <p className="text-[8pt] text-black">
                    Kampus I : Jalan Siliwangi No. 41 <PhoneIcon /> (0263) 261265
                  </p>
                  <p className="text-[8pt] text-black">
                    Kampus 2 : Jalan Pangeran Hidayatullah No. 67 <PhoneIcon /> (0263) 261949
                  </p>
                  <p className="text-[8pt] text-black">
                    Fax (0263) 272561 – Cianjur – 43212
                  </p>
                  <p className="text-[7.5pt] text-black">
                    Facebook : https://www.facebook.com/SMKN1CIANJUR/ Instagram : https://www.instagram.com/smakzie/
                  </p>
                  <p className="text-[7.5pt] text-black">
                    Twitter : https://twitter.com/CianjurSMKN?lang=en Website: http://www.smkn1cianjur.sch.id E-mail : info@smkn1cianjur.sch.id
                  </p>
                  <p
                    className="text-[9pt] italic text-black mt-0.5"
                    style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
                  >
                    “The Right Place To Get Succes For The Future”
                  </p>
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

              {/* Judul Dokumen & Tahun Pelajaran */}
              <div className="text-center mb-2 text-black">
                <h2 className="text-[12.5pt] font-black tracking-wider uppercase underline decoration-1 underline-offset-2">
                  DAFTAR PENGUNJUNG PERPUSTAKAAN
                </h2>
                <h3 className="text-[11pt] font-bold tracking-wide uppercase mt-0.5">
                  TAHUN PELAJARAN : {schoolYearText}
                </h3>
              </div>

              {/* Keterangan Periode (Bulan & Minggu) */}
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
            </div>

            {/* ── BAGIAN TENGAH: TABEL UTAMA DENGAN WATERMARK ── */}
            <div className="relative w-full border border-black mb-1">
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

              {/* Tabel Data Pengunjung */}
              <table className="relative z-10 w-full border-collapse text-[8.5pt] leading-tight text-black">
                <thead>
                  <tr className="border-b border-black text-center font-bold bg-white/70">
                    <th rowSpan={2} className="border-r border-black py-1 px-1 w-[32px]">
                      No.<br />Urt.
                    </th>
                    <th rowSpan={2} className="border-r border-black py-1 px-1.5 w-[92px]">
                      Hari / Tanggal
                    </th>
                    <th rowSpan={2} className="border-r border-black py-1 px-1 w-[46px]">
                      Waktu
                    </th>
                    <th rowSpan={2} className="border-r border-black py-1 px-1 w-[72px]">
                      NIS
                    </th>
                    <th rowSpan={2} className="border-r border-black py-1 px-2 text-left">
                      Nama Pengunjung
                    </th>
                    <th rowSpan={2} className="border-r border-black py-1 px-1 w-[80px]">
                      Kelas /<br />Jurusan
                    </th>
                    <th colSpan={3} className="border-r border-black py-1 px-1">
                      KEPENTINGAN
                    </th>
                    <th rowSpan={2} className="py-1 px-2 w-[115px] text-left">
                      Keterangan
                    </th>
                  </tr>
                  <tr className="border-b border-black text-center font-bold bg-white/70">
                    <th className="border-r border-black py-1 px-1 w-[42px]">BACA</th>
                    <th className="border-r border-black py-1 px-1 w-[46px]">PINJAM</th>
                    <th className="border-r border-black py-1 px-1 w-[52px]">KEMBALI</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((v, i) => {
                    const rowNo = startNo + i
                    const isBaca = v.keperluan === 'baca'
                    const isPinjam = v.keperluan === 'pinjam'
                    const isKembali = v.keperluan === 'kembali'
                    return (
                      <tr key={v.id || i} className="border-b border-black h-[21.5px]">
                        <td className="border-r border-black text-center px-1">
                          {rowNo}
                        </td>
                        <td className="border-r border-black px-1 text-center whitespace-nowrap text-[8pt]">
                          {formatIndoDate(v.visited_at)}
                        </td>
                        <td className="border-r border-black px-1 text-center text-[8pt] font-mono">
                          {formatIndoTime(v.visited_at)}
                        </td>
                        <td className="border-r border-black px-1 text-center text-[8pt] font-mono">
                          {v.nis || '—'}
                        </td>
                        <td className="border-r border-black px-2 font-medium truncate max-w-[155px]">
                          {v.nama}
                        </td>
                        <td className="border-r border-black text-center px-1 text-[8pt] truncate max-w-[78px]">
                          {v.kelas || '—'}
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
                        <td className="px-1.5 text-[8pt] text-gray-700 truncate max-w-[115px]">
                          {v.notes || '—'}
                        </td>
                      </tr>
                    )
                  })}

                  {/* Empty Padding Rows up to exactly 25 rows */}
                  {emptyRows.map((_, i) => {
                    const rowNo = pageRows.length + startNo + i
                    return (
                      <tr key={`empty-${i}`} className="border-b border-black h-[21.5px]">
                        <td className="border-r border-black text-center px-1 text-gray-400">
                          {rowNo}
                        </td>
                        <td className="border-r border-black px-1"></td>
                        <td className="border-r border-black px-1"></td>
                        <td className="border-r border-black px-1"></td>
                        <td className="border-r border-black px-2"></td>
                        <td className="border-r border-black px-1"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="px-1.5"></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* ── BAGIAN BAWAH: TANDA TANGAN RESMI (SIMETRIS & ANCHORED DI BAWAH) ── */}
            <div
              className="w-full mt-auto pt-2 text-[10.5pt] leading-snug flex justify-between items-start text-black"
              style={{ fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif' }}
            >
              {/* Kolom Kiri: Kepala Perpustakaan */}
              <div className="w-[45%] text-left pl-2">
                <p className="font-normal">Mengetahui:</p>
                <p className="font-normal">Kepala Perpustakaan,</p>
                <div className="h-[54px]"></div>
                <p className="font-bold text-black uppercase tracking-wide">{kepalaPerpusName}</p>
                <p className="text-[10pt] text-black tracking-normal">{kepalaPerpusNip}</p>
              </div>

              {/* Kolom Kanan: Koordinator Pengelola Perpustakaan */}
              <div className="w-[48%] text-left pl-6">
                <p className="font-normal">{currentDateCity}</p>
                <p className="font-normal">Koordinator Pengelola Perpustakaan</p>
                <p className="font-normal">Kampus 1 dan 2,</p>
                <div className="h-[38px]"></div>
                <p className="font-bold text-black uppercase tracking-wide">{koordinatorName}</p>
                <p className="text-[10pt] text-black tracking-normal">{koordinatorNip}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
