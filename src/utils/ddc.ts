export interface DdcItem {
  code: string
  name: string
  classGroup: string
  keywords: string[]
}

export const DDC_CATALOG: DdcItem[] = [
  // ── 000 KARYA UMUM & ILMU KOMPUTER ──────────────────────────────────────────
  { code: '004', name: 'Komputer & Pengolahan Data', classGroup: '000 - Karya Umum & Komputer', keywords: ['komputer', 'hardware', 'it', 'perangkat keras', 'sistem komputer'] },
  { code: '004.6', name: 'Teknik Jaringan Komputer & Telekomunikasi (TJKT/TKJ)', classGroup: '000 - Karya Umum & Komputer', keywords: ['jaringan', 'tkj', 'tjkt', 'mikrotik', 'cisco', 'lan', 'wan', 'nirkabel', 'routing', 'switch', 'router', 'telekomunikasi', 'fiber optik', 'server'] },
  { code: '005.1', name: 'Algoritma & Pemrograman Dasar', classGroup: '000 - Karya Umum & Komputer', keywords: ['algoritma', 'logika pemrograman', 'flowchart', 'struktur data', 'dasar pemrograman'] },
  { code: '005.13', name: 'Bahasa Pemrograman & Rekayasa Perangkat Lunak (PPLG/RPL)', classGroup: '000 - Karya Umum & Komputer', keywords: ['pemrograman', 'rpl', 'pplg', 'coding', 'scratch', 'web', 'php', 'laravel', 'python', 'javascript', 'java', 'html', 'css', 'c++', 'frontend', 'backend', 'mobile', 'android', 'flutter', 'react', 'vue'] },
  { code: '005.7', name: 'Basis Data & Sistem Informasi', classGroup: '000 - Karya Umum & Komputer', keywords: ['database', 'basis data', 'sql', 'mysql', 'postgresql', 'oracle', 'data warehouse', 'sistem informasi'] },
  { code: '005.8', name: 'Keamanan Siber & Jaringan', classGroup: '000 - Karya Umum & Komputer', keywords: ['keamanan siber', 'cyber security', 'kriptografi', 'ethical hacking', 'firewall'] },
  { code: '006.3', name: 'Kecerdasan Buatan & Machine Learning', classGroup: '000 - Karya Umum & Komputer', keywords: ['kecerdasan buatan', 'ai', 'artificial intelligence', 'machine learning', 'deep learning'] },
  { code: '006.6', name: 'Grafika Komputer & Animasi', classGroup: '000 - Karya Umum & Komputer', keywords: ['animasi', 'grafika', '3d', 'blender', 'rendering', 'cgi'] },
  { code: '020', name: 'Ilmu Perpustakaan & Informasi', classGroup: '000 - Karya Umum & Komputer', keywords: ['perpustakaan', 'katalogisasi', 'informasi', 'pustakawan', 'slims'] },
  { code: '030', name: 'Ensiklopedia Umum & Referensi', classGroup: '000 - Karya Umum & Komputer', keywords: ['ensiklopedia', 'referensi umum', 'almanak', 'pengetahuan umum'] },
  { code: '070', name: 'Jurnalistik & Media Massa', classGroup: '000 - Karya Umum & Komputer', keywords: ['jurnalistik', 'pers', 'wartawan', 'berita', 'media massa', 'majalah', 'penyiaran'] },

  // ── 100 FILSAFAT & PSIKOLOGI ────────────────────────────────────────────────
  { code: '150', name: 'Psikologi Umum', classGroup: '100 - Filsafat & Psikologi', keywords: ['psikologi', 'kejiwaan', 'mental', 'perilaku', 'jiwa'] },
  { code: '153.2', name: 'Kreativitas, Daya Cipta & Berpikir Kritis', classGroup: '100 - Filsafat & Psikologi', keywords: ['kreativitas', 'daya cipta', 'berpikir kritis', 'critical thinking', 'logika berpikir'] },
  { code: '153.8', name: 'Motivasi, Kemauan & Kebiasaan Positif', classGroup: '100 - Filsafat & Psikologi', keywords: ['motivasi', 'kebiasaan', 'atomic habits', 'daya tahan', 'kemauan', 'grit', 'disiplin'] },
  { code: '158.1', name: 'Pengembangan Diri & Psikologi Terapan', classGroup: '100 - Filsafat & Psikologi', keywords: ['self improvement', 'pengembangan diri', 'sukses', 'kepribadian', 'filosofi teras', 'mark manson', 'bodo amat', 'berani tidak disukai', 'public speaking', 'komunikasi interpersonal'] },
  { code: '170', name: 'Etika & Filsafat Moral', classGroup: '100 - Filsafat & Psikologi', keywords: ['etika', 'moral', 'akhlak filsafat', 'budi pekerti filsafat'] },

  // ── 200 AGAMA ──────────────────────────────────────────────────────────────
  { code: '297', name: 'Pendidikan Agama Islam & Budi Pekerti (PAI)', classGroup: '200 - Agama', keywords: ['agama islam', 'islam', 'pendidikan agama', 'pai', 'muslim', 'keislaman', 'budi pekerti islam'] },
  { code: '297.1', name: 'Al-Qur\'an, Hadits & Ilmu Tafsir', classGroup: '200 - Agama', keywords: ['al-quran', 'quran', 'hadits', 'hadis', 'tafsir', 'tajwid'] },
  { code: '297.2', name: 'Aqidah & Teologi Islam (Tauhid)', classGroup: '200 - Agama', keywords: ['aqidah', 'akidah', 'tauhid', 'iman', 'rukun iman'] },
  { code: '297.3', name: 'Ibadah & Fiqih Islam', classGroup: '200 - Agama', keywords: ['fiqih', 'fiqh', 'ibadah', 'syariat', 'sholat', 'zakat', 'puasa', 'haji'] },
  { code: '297.5', name: 'Akhlak & Tasawuf Islam', classGroup: '200 - Agama', keywords: ['akhlak', 'tasawuf', 'moral islam', 'akhlak terpuji'] },
  { code: '297.9', name: 'Tarikh & Sejarah Kebudayaan Islam (SKI)', classGroup: '200 - Agama', keywords: ['ski', 'sejarah islam', 'tarikh', 'sirah nabawiyah', 'khulafaur rasyidin'] },
  { code: '230', name: 'Agama Kristen Protestan', classGroup: '200 - Agama', keywords: ['kristen', 'protestan', 'alkitab', 'injil'] },
  { code: '282', name: 'Agama Katolik', classGroup: '200 - Agama', keywords: ['katolik', 'roma'] },
  { code: '294.5', name: 'Agama Hindu', classGroup: '200 - Agama', keywords: ['hindu', 'weda'] },
  { code: '294.3', name: 'Agama Buddha', classGroup: '200 - Agama', keywords: ['buddha', 'tripitaka'] },

  // ── 300 ILMU-ILMU SOSIAL & PENDIDIKAN ───────────────────────────────────────
  { code: '300', name: 'Ilmu Pengetahuan Sosial (IPS)', classGroup: '300 - Ilmu Sosial', keywords: ['ips', 'ilmu sosial', 'studi sosial'] },
  { code: '301', name: 'Sosiologi & Interaksi Masyarakat', classGroup: '300 - Ilmu Sosial', keywords: ['sosiologi', 'sosial', 'interaksi sosial', 'masyarakat', 'struktur sosial'] },
  { code: '312', name: 'Kependudukan & Demografi', classGroup: '300 - Ilmu Sosial', keywords: ['demografi', 'kependudukan', 'sensus', 'statistik penduduk'] },
  { code: '320', name: 'Pendidikan Pancasila & Kewarganegaraan (PPKn)', classGroup: '300 - Ilmu Sosial', keywords: ['ppkn', 'kewarganegaraan', 'pancasila', 'politik', 'uud 1945', 'warganegara', 'konstitusi'] },
  { code: '330', name: 'Ekonomi Umum & Bisnis', classGroup: '300 - Ilmu Sosial', keywords: ['ekonomi', 'koperasi', 'makro ekonomi', 'mikro ekonomi', 'pasar', 'uang'] },
  { code: '332.024', name: 'Manajemen Keuangan & Finansial Pribadi', classGroup: '300 - Ilmu Sosial', keywords: ['keuangan pribadi', 'finansial', 'rich dad', 'investasi', 'melek finansial', 'kiyosaki', 'cashflow'] },
  { code: '338.04', name: 'Produk Kreatif & Kewirausahaan (PKK)', classGroup: '300 - Ilmu Sosial', keywords: ['kewirausahaan', 'pkk', 'produk kreatif', 'wirausaha', 'entrepreneur', 'bisnis mandiri', 'projek kreatif'] },
  { code: '340', name: 'Ilmu Hukum & Perundang-undangan', classGroup: '300 - Ilmu Sosial', keywords: ['hukum', 'undang-undang', 'pasal', 'pidana', 'perdata', 'ketenagakerjaan'] },
  { code: '350', name: 'Administrasi Publik & Pemerintahan', classGroup: '300 - Ilmu Sosial', keywords: ['administrasi negara', 'administrasi publik', 'pemerintahan', 'kebijakan publik'] },
  { code: '371.26', name: 'Evaluasi Pembelajaran & Tes Standar (TKA/AKM/Ujian)', classGroup: '300 - Ilmu Sosial', keywords: ['tka', 'siaga tka', 'erlangga x-press', 'akm', 'asesmen nasional', 'bank soal', 'ujian', 'utbk', 'snbt', 'tes kemampuan akademik'] },
  { code: '371.3', name: 'Buku Teks Pembelajaran & Panduan Belajar', classGroup: '300 - Ilmu Sosial', keywords: ['buku teks', 'kurikulum merdeka', 'fase e', 'fase f', 'metode pembelajaran', 'buku panduan guru', 'buku siswa'] },
  { code: '373', name: 'Pendidikan Menengah Kejuruan (SMK)', classGroup: '300 - Ilmu Sosial', keywords: ['pendidikan smk', 'sekolah menengah kejuruan', 'vokasi', 'kejuruan'] },

  // ── 400 BAHASA & LINGUISTIK ─────────────────────────────────────────────────
  { code: '403', name: 'Kamus Bahasa & Istilah', classGroup: '400 - Bahasa', keywords: ['kamus', 'glosarium', 'leksikon', 'thesaurus', 'dictionary'] },
  { code: '410', name: 'Bahasa Indonesia & Linguistik', classGroup: '400 - Bahasa', keywords: ['bahasa indonesia', 'cerdas cergas', 'tata bahasa', 'ejaan', 'kbbi', 'linguistik', 'eyd', 'puebi'] },
  { code: '420', name: 'Bahasa Inggris', classGroup: '400 - Bahasa', keywords: ['bahasa inggris', 'english', 'grammar', 'vocabulary', 'toefl', 'splash smart', 'work in progress'] },
  { code: '492.7', name: 'Bahasa Arab', classGroup: '400 - Bahasa', keywords: ['bahasa arab', 'arab', 'nahwu', 'shorof', 'mufradat'] },
  { code: '495.6', name: 'Bahasa Jepang', classGroup: '400 - Bahasa', keywords: ['bahasa jepang', 'jepang', 'nihongo', 'jlpt', 'kanji', 'hiragana', 'katakana'] },
  { code: '499.2232', name: 'Bahasa Daerah / Bahasa Sunda', classGroup: '400 - Bahasa', keywords: ['bahasa sunda', 'basa sunda', 'sunda', 'panggelar', 'tatakrama sunda', 'rancage'] },

  // ── 500 SAINS MURNI & MATEMATIKA ───────────────────────────────────────────
  { code: '500', name: 'Projek IPAS (Ilmu Pengetahuan Alam & Sosial)', classGroup: '500 - Sains & Matematika', keywords: ['projek ipas', 'ipas', 'ipa', 'sains', 'ilmu pengetahuan alam'] },
  { code: '510', name: 'Matematika', classGroup: '500 - Sains & Matematika', keywords: ['matematika', 'aljabar', 'kalkulus', 'geometri', 'trigonometri', 'tka matematika', 'hitung', 'matematika smk'] },
  { code: '519', name: 'Statistika & Peluang', classGroup: '500 - Sains & Matematika', keywords: ['statistika', 'statistik', 'peluang', 'probabilitas', 'data science'] },
  { code: '530', name: 'Fisika', classGroup: '500 - Sains & Matematika', keywords: ['fisika', 'mekanika', 'listrik fisika', 'termodinamika', 'optik', 'magnet', 'gelombang'] },
  { code: '540', name: 'Kimia Dasar & Terapan', classGroup: '500 - Sains & Matematika', keywords: ['kimia', 'senyawa', 'larutan', 'stoikiometri', 'reaksi kimia', 'unsur'] },
  { code: '550', name: 'Geologi & Ilmu Kebumian', classGroup: '500 - Sains & Matematika', keywords: ['geologi', 'bumi', 'batuan', 'meteorologi', 'iklim'] },
  { code: '570', name: 'Biologi & Ilmu Hayati', classGroup: '500 - Sains & Matematika', keywords: ['biologi', 'anatomi', 'ekologi', 'sel', 'genetika', 'tumbuhan', 'hewan', 'keanekaragaman hayati'] },

  // ── 600 TEKNOLOGI, REKAYASA & KEJURUAN SMK ─────────────────────────────────
  { code: '610', name: 'Kesehatan & Keperawatan', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['kesehatan', 'p3k', 'keperawatan', 'farmasi', 'obat', 'medis'] },
  { code: '613.7', name: 'Pendidikan Jasmani, Olahraga & Kesehatan (PJOK)', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['pjok', 'penjas', 'penjasorkes', 'pendidikan jasmani', 'kebugaran', 'olahraga'] },
  { code: '620', name: 'Teknik & Rekayasa Umum', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['teknik', 'rekayasa', 'gambar teknik', 'mekanikal', 'mesin umum'] },
  { code: '621.3', name: 'Teknik Ketenagalistrikan & Elektronika (TITL)', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['listrik', 'elektronika', 'arus kuat', 'instalasi penerangan', 'instalasi tenaga', 'titl', 'komponen elektronika', 'plc', 'sensor'] },
  { code: '629.2', name: 'Teknik Kendaraan Ringan & Otomotif (TKR/TO)', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['otomotif', 'tkr', 'teknik otomotif', 'mesin mobil', 'chassis', 'sasis', 'kelistrikan mobil', 'injeksi', 'tune up', 'rem', 'suspensi'] },
  { code: '629.287', name: 'Teknik & Bisnis Sepeda Motor (TBSM)', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['sepeda motor', 'tbsm', 'tune up motor', 'cvt', 'mesin motor', 'injeksi motor'] },
  { code: '630', name: 'Pertanian, Agribisnis & Peternakan', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['pertanian', 'agribisnis', 'budidaya', 'tanaman', 'peternakan', 'perikanan'] },
  { code: '641', name: 'Tata Boga & Seni Kuliner', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['tata boga', 'kuliner', 'memasak', 'resep masakan', 'pastry', 'bakery', 'tata hidang', 'restoran'] },
  { code: '646', name: 'Tata Busana & Desain Mode', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['tata busana', 'busana', 'pola pakaian', 'menjahit', 'desain mode', 'tekstil'] },
  { code: '650', name: 'Bisnis & Manajemen Perkantoran Umum', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['bisnis', 'manajemen', 'manajemen bisnis', 'administrasi umum'] },
  { code: '651', name: 'Manajemen Perkantoran & Layanan Bisnis (MPLB/OTKP)', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['manajemen perkantoran', 'layanan bisnis', 'mplb', 'otkp', 'administrasi perkantoran', 'kearsipan', 'arsip', 'keprotokolan', 'humas', 'korespondensi', 'tata kelola perkantoran', 'tata usaha'] },
  { code: '657', name: 'Akuntansi & Keuangan Lembaga (AKL)', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['akuntansi', 'akl', 'keuangan lembaga', 'myob', 'keuangan', 'buku besar', 'jurnal', 'laporan keuangan', 'pajak', 'spreadsheet', 'perpajakan', 'akuntansi dasar', 'perbankan dasar'] },
  { code: '658.8', name: 'Pemasaran & Bisnis Ritel (BR/BDP)', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['pemasaran', 'marketing', 'bisnis daring', 'bisnis online', 'ritel', 'retail', 'penjualan', 'digital marketing', 'administrasi transaksi', 'bdp'] },
  { code: '659.1', name: 'Periklanan & Promosi', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['periklanan', 'iklan', 'promosi', 'branding'] },
  { code: '690', name: 'Konstruksi Bangunan & Gambar Teknik (DPIB)', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['konstruksi', 'bangunan', 'dpib', 'arsitektur', 'autocad', 'gambar bangunan'] },

  // ── 700 SENI, DESAIN & OLAHRAGA ─────────────────────────────────────────────
  { code: '700', name: 'Kesenian & Seni Budaya', classGroup: '700 - Seni & Olahraga', keywords: ['seni', 'seni budaya', 'kebudayaan', 'kesenian', 'seni rupa'] },
  { code: '741.5', name: 'Komik, Cerita Bergambar & Manga', classGroup: '700 - Seni & Olahraga', keywords: ['komik', 'manga', 'karikatur', 'cergam', 'strip'] },
  { code: '741.6', name: 'Desain Komunikasi Visual & Grafis (DKV)', classGroup: '700 - Seni & Olahraga', keywords: ['desain komunikasi visual', 'dkv', 'desain grafis', 'multimedia', 'photoshop', 'coreldraw', 'illustrator', 'tipografi', 'poster', 'nirmana'] },
  { code: '770', name: 'Fotografi, Videografi & Sinematografi', classGroup: '700 - Seni & Olahraga', keywords: ['fotografi', 'videografi', 'kamera', 'sinematografi', 'editing video', 'pencahayaan'] },
  { code: '780', name: 'Seni Musik & Instrumen', classGroup: '700 - Seni & Olahraga', keywords: ['musik', 'lagu', 'instrumen', 'gitar', 'piano', 'harmoni', 'vokal'] },
  { code: '792', name: 'Teater & Seni Pertunjukan', classGroup: '700 - Seni & Olahraga', keywords: ['teater', 'drama panggung', 'seni tari', 'tari tradisional'] },
  { code: '796', name: 'Olahraga & Atletik', classGroup: '700 - Seni & Olahraga', keywords: ['olahraga', 'sepakbola', 'voli', 'basket', 'futsal', 'badminton', 'bulutangkis', 'atletik', 'senam'] },

  // ── 800 SASTRA, NOVEL & FIKSI ───────────────────────────────────────────────
  { code: '808', name: 'Teknik Menulis & Retorika', classGroup: '800 - Sastra & Fiksi', keywords: ['menulis', 'kepenulisan', 'retorika', 'mengarang', 'pidato'] },
  { code: '811', name: 'Puisi & Sajak Indonesia', classGroup: '800 - Sastra & Fiksi', keywords: ['puisi', 'sajak', 'antologi puisi', 'pantun', 'syair'] },
  { code: '812', name: 'Naskah Drama & Lakon Indonesia', classGroup: '800 - Sastra & Fiksi', keywords: ['drama', 'naskah drama', 'lakon', 'skenario'] },
  { code: '813', name: 'Sastra, Novel & Fiksi Indonesia', classGroup: '800 - Sastra & Fiksi', keywords: ['novel', 'fiksi', 'cerpen', 'roman', 'antologi cerita', 'laskar pelangi', 'tere liye', 'andrea hirata', 'bumi', 'bulan', 'hujan', 'matahari', 'bintang', 'komet', 'pulang', 'pergi', 'yang telah lama pergi', 'cantik itu luka', 'gadis kretek', 'laut bercerita', 'guru aini'] },
  { code: '823', name: 'Novel & Sastra Fiksi Terjemahan', classGroup: '800 - Sastra & Fiksi', keywords: ['novel terjemahan', 'fiksi asing', 'fiksi terjemahan', 'harry potter', 'sherlock holmes', 'agatha christie', 'keigo higashino', 'rumus kebenaran musim panas', 'midsummer', 'haruki murakami'] },
  { code: '899.2232', name: 'Sastra Sunda & Cerita Dongeng (Carpon)', classGroup: '800 - Sastra & Fiksi', keywords: ['carpon', 'sastra sunda', 'dongeng sunda', 'guguritan', 'wawacan', 'basa sunda cerita'] },

  // ── 900 SEJARAH & GEOGRAFI ──────────────────────────────────────────────────
  { code: '900', name: 'Sejarah Dunia & Peradaban', classGroup: '900 - Sejarah & Geografi', keywords: ['sejarah dunia', 'peradaban dunia', 'perang dunia'] },
  { code: '910', name: 'Geografi & Atlas Dunia', classGroup: '900 - Sejarah & Geografi', keywords: ['geografi', 'atlas', 'peta', 'benua', 'samudra', 'penjelajahan', 'bentang alam'] },
  { code: '920', name: 'Biografi, Otobiografi & Kisah Tokoh', classGroup: '900 - Sejarah & Geografi', keywords: ['biografi', 'otobiografi', 'kisah tokoh', 'memoar', 'profil tokoh', 'riwayat hidup'] },
  { code: '959.8', name: 'Sejarah Indonesia & Kemerdekaan', classGroup: '900 - Sejarah & Geografi', keywords: ['sejarah indonesia', 'sejarah nasional', 'kemerdekaan', 'perjuangan', 'soekarno', 'pahlawan', 'orde baru', 'reformasi', 'kerajaan nusantara'] },
]

/**
 * Cari DdcItem berdasarkan kode persis
 */
export function getDdcItem(code?: string): DdcItem | undefined {
  if (!code) return undefined
  const clean = code.trim().split(/\s+/)[0]
  return DDC_CATALOG.find((item) => item.code === clean)
}

/**
 * Cari item DDC berdasarkan query (kode, nama, atau kata kunci)
 */
export function searchDdc(query: string, limit = 8): DdcItem[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    return DDC_CATALOG.slice(0, limit)
  }

  const results: { item: DdcItem; score: number }[] = []

  for (const item of DDC_CATALOG) {
    let score = 0
    const codeLower = item.code.toLowerCase()
    const nameLower = item.name.toLowerCase()

    if (codeLower === q) {
      score = 100
    } else if (codeLower.startsWith(q)) {
      score = 80
    } else if (codeLower.includes(q)) {
      score = 60
    } else if (nameLower.includes(q)) {
      score = 50
    } else {
      const matchKeyword = item.keywords.some((k) => k.includes(q) || q.includes(k))
      if (matchKeyword) {
        score = 40
      }
    }

    if (score > 0) {
      results.push({ item, score })
    }
  }

  results.sort((a, b) => b.score - a.score)
  return results.slice(0, limit).map((r) => r.item)
}

/**
 * Deteksi kode klasifikasi DDC secara akurat berdasarkan judul buku dan nama kategori.
 * Selalu mengembalikan kode DDC yang tepat tanpa pernah menghasilkan '000'.
 */
export function detectDdcFromTitle(title?: string, categoryName?: string): { code: string; name: string } {
  const t = (title ?? '').toLowerCase().trim()
  const cat = (categoryName ?? '').toLowerCase().trim()

  // 1. EVALUASI BERDASARKAN JUDUL SPESIFIK & MATA PELAJARAN / KEJURUAN
  if (t) {
    // ── Evaluasi Belajar, Ujian & TKA SMK ──
    if (/(siaga tka|erlangga x-press|tes kemampuan akademik|asesmen nasional|akm|bank soal|siap un|snbt|utbk|soal ujian)/i.test(t)) {
      return { code: '371.26', name: 'Evaluasi Pembelajaran & Tes Standar (TKA/AKM)' }
    }

    // ── Bahasa Asing & Daerah ──
    if (/(bahasa jepang|jlpt|nihongo|kanji|hiragana|katakana)/i.test(t)) {
      return { code: '495.6', name: 'Bahasa Jepang' }
    }
    if (/(bahasa sunda|basa sunda|panggelar|rancage|tatakrama sunda|carpon|guguritan|wawacan)/i.test(t)) {
      return { code: '499.2232', name: 'Bahasa & Sastra Sunda' }
    }
    if (/(bahasa inggris|english|splash smart|work in progress|grammar|toefl|ielts|vocabulary)/i.test(t)) {
      return { code: '420', name: 'Bahasa Inggris' }
    }
    if (/(bahasa arab|nahwu|shorof|mufradat)/i.test(t)) {
      return { code: '492.7', name: 'Bahasa Arab' }
    }
    if (/(bahasa indonesia|cerdas cergas|bersastra indonesia|tata bahasa indonesia|tatabahasa)/i.test(t)) {
      return { code: '410', name: 'Bahasa Indonesia' }
    }

    // ── Kejuruan: Manajemen Perkantoran & Layanan Bisnis (MPLB / OTKP) ──
    if (/(manajemen perkantoran|layanan bisnis|mplb|otkp|administrasi perkantoran|kearsipan|keprotokolan|korespondensi|tata kelola perkantoran|tata usaha)/i.test(t)) {
      return { code: '651', name: 'Manajemen Perkantoran & Layanan Bisnis (MPLB)' }
    }

    // ── Kejuruan: Pemasaran & Bisnis Ritel (BR / BDP) ──
    if (/(pemasaran|marketing|bisnis online|bisnis daring|ritel|retail|administrasi transaksi|penjualan|sales)/i.test(t)) {
      return { code: '658.8', name: 'Pemasaran & Bisnis Ritel' }
    }

    // ── Kejuruan: Akuntansi & Keuangan Lembaga (AKL) ──
    if (/(akuntansi|keuangan lembaga|akl|myob|spreadsheet|buku besar|jurnal penyesuaian|perpajakan|administrasi pajak|perbankan dasar)/i.test(t)) {
      return { code: '657', name: 'Akuntansi & Keuangan Lembaga (AKL)' }
    }

    // ── Kejuruan: Teknik Jaringan Komputer & Telekomunikasi (TJKT / TKJ) ──
    if (/(jaringan komputer|telekomunikasi|tjkt|tkj|mikrotik|cisco|lan|wan|router|routing|switching|server|nirkabel|fiber optik|komunikasi data)/i.test(t)) {
      return { code: '004.6', name: 'Teknik Jaringan Komputer & Telekomunikasi (TJKT)' }
    }

    // ── Kejuruan: Pengembangan Perangkat Lunak & Gim (PPLG / RPL) ──
    if (/(rekayasa perangkat lunak|perangkat lunak|pplg|rpl|pemrograman|coding|scratch|web|php|laravel|python|javascript|react|vue|java|c\+\+|html|css|basis data|database|sql|mysql|aplikasi mobile|android|flutter)/i.test(t)) {
      return { code: '005.13', name: 'Pengembangan Perangkat Lunak & Gim (PPLG)' }
    }

    // ── Kejuruan: Teknik Otomotif (TKR / TO) & TBSM ──
    if (/(sepeda motor|tbsm|tune up motor|mesin motor|cvt|kelistrikan motor)/i.test(t)) {
      return { code: '629.287', name: 'Teknik & Bisnis Sepeda Motor (TBSM)' }
    }
    if (/(otomotif|teknik kendaraan ringan|tkr|mesin otomotif|chassis|sasis|kelistrikan kendaraan|injeksi|tune up|rem|suspensi)/i.test(t)) {
      return { code: '629.2', name: 'Teknik Kendaraan Ringan & Otomotif (TKR)' }
    }

    // ── Kejuruan: Teknik Ketenagalistrikan & Elektronika (TITL) ──
    if (/(ketenagalistrikan|instalasi penerangan|instalasi tenaga|titl|elektronika industri|motor listrik|plc|sensor|arus kuat)/i.test(t)) {
      return { code: '621.3', name: 'Teknik Ketenagalistrikan & Elektronika (TITL)' }
    }

    // ── Kejuruan: Desain Komunikasi Visual (DKV) & Multimedia ──
    if (/(desain komunikasi visual|dkv|desain grafis|multimedia|photoshop|coreldraw|illustrator|tipografi|nirmana|videografi|fotografi|animasi)/i.test(t)) {
      return { code: '741.6', name: 'Desain Komunikasi Visual (DKV)' }
    }

    // ── Kejuruan: Tata Boga & Kuliner ──
    if (/(tata boga|kuliner|pengolahan makanan|pastry|bakery|tata hidang|restoran|resep masakan|memasak)/i.test(t)) {
      return { code: '641', name: 'Tata Boga & Seni Kuliner' }
    }

    // ── Kejuruan: Tata Busana ──
    if (/(tata busana|busana|pola pakaian|menjahit|desain mode|tekstil)/i.test(t)) {
      return { code: '646', name: 'Tata Busana & Desain Mode' }
    }

    // ── Kejuruan: Konstruksi & Bangunan (DPIB) ──
    if (/(konstruksi|bangunan|dpib|arsitektur|autocad|gambar bangunan|permodelan bangunan)/i.test(t)) {
      return { code: '690', name: 'Konstruksi Bangunan (DPIB)' }
    }

    // ── Kejuruan: Produk Kreatif & Kewirausahaan (PKK) ──
    if (/(produk kreatif|kewirausahaan|pkk|projek kreatif|entrepreneur|wirausaha)/i.test(t)) {
      return { code: '338.04', name: 'Produk Kreatif & Kewirausahaan (PKK)' }
    }

    // ── Agama Islam & Budi Pekerti ──
    if (/(agama islam|pendidikan agama dan budi pekerti|pai|al-qur|hadis|hadits|fiqih|fiqh|akidah|tauhid|akhlak|tarikh|sejarah kebudayaan islam|ski|syariat)/i.test(t)) {
      return { code: '297', name: 'Pendidikan Agama Islam & Budi Pekerti (PAI)' }
    }

    // ── Pendidikan Pancasila & Kewarganegaraan (PPKn) ──
    if (/(pendidikan pancasila|pancasila dan kewarganegaraan|ppkn|kewarganegaraan|uud 1945|konstitusi)/i.test(t)) {
      return { code: '320', name: 'Pendidikan Pancasila & Kewarganegaraan (PPKn)' }
    }

    // ── Matematika & Statistika ──
    if (/(statistika|statistik|peluang|probabilitas)/i.test(t)) {
      return { code: '519', name: 'Statistika & Peluang' }
    }
    if (/(matematika|kalkulus|aljabar|trigonometri|geometri|tka matematika)/i.test(t)) {
      return { code: '510', name: 'Matematika' }
    }

    // ── Sains & Projek IPAS ──
    if (/(projek ipas|ipas|ilmu pengetahuan alam dan sosial)/i.test(t)) {
      return { code: '500', name: 'Projek IPAS' }
    }
    if (/(fisika|mekanika|termodinamika)/i.test(t)) {
      return { code: '530', name: 'Fisika' }
    }
    if (/(kimia|larutan|senyawa|stoikiometri)/i.test(t)) {
      return { code: '540', name: 'Kimia Dasar & Terapan' }
    }
    if (/(biologi|anatomi|genetika|sel|ekologi)/i.test(t)) {
      return { code: '570', name: 'Biologi & Ilmu Hayati' }
    }

    // ── PJOK & Olahraga ──
    if (/(penjas|penjasorkes|pjok|pendidikan jasmani|kebugaran jasmani|olahraga|sepakbola|futsal|voli|basket|badminton)/i.test(t)) {
      return { code: '613.7', name: 'PJOK / Pendidikan Jasmani' }
    }

    // ── Seni Budaya ──
    if (/(seni budaya|seni rupa|seni musik|seni tari|seni teater)/i.test(t)) {
      return { code: '700', name: 'Seni Budaya' }
    }

    // ── Sejarah & Geografi ──
    if (/(sejarah indonesia|kemerdekaan|proklamasi|soekarno|pahlawan nasional)/i.test(t)) {
      return { code: '959.8', name: 'Sejarah Indonesia' }
    }
    if (/(geografi|atlas|peta dunia)/i.test(t)) {
      return { code: '910', name: 'Geografi & Atlas Dunia' }
    }

    // ── Pengembangan Diri & Finansial Pribadi ──
    if (/(rich dad poor dad|kiyosaki|keuangan pribadi|investasi|psikologi uang)/i.test(t)) {
      return { code: '332.024', name: 'Manajemen Keuangan & Finansial Pribadi' }
    }
    if (/(atomic habits|filosofi teras|sebuah seni untuk bersikap bodo amat|berani tidak disukai|berani gagal|power of habit|mindset|daya cipta|pengembangan diri)/i.test(t)) {
      return { code: '158.1', name: 'Pengembangan Diri & Psikologi Terapan' }
    }
    if (/(psikologi|kejiwaan|mental health)/i.test(t)) {
      return { code: '150', name: 'Psikologi Umum' }
    }
    if (/(biografi|otobiografi|memoar|kisah hidup|riwayat hidup)/i.test(t)) {
      return { code: '920', name: 'Biografi & Kisah Tokoh' }
    }

    // ── Sastra, Novel & Fiksi ──
    if (/(rumus kebenaran musim panas|midsummer|keigo higashino|harry potter|sherlock holmes|agatha christie|novel terjemahan|fiksi terjemahan)/i.test(t)) {
      return { code: '823', name: 'Novel & Sastra Fiksi Terjemahan' }
    }
    if (/(puisi|antologi puisi|sajak|pantun)/i.test(t)) {
      return { code: '811', name: 'Puisi & Sajak Indonesia' }
    }
    if (/(naskah drama|lakon)/i.test(t)) {
      return { code: '812', name: 'Naskah Drama Indonesia' }
    }
    if (
      /(novel|fiksi|cerpen|roman|antologi cerita)/i.test(t) ||
      /(tere liye|andrea hirata|pramoedya|habiburrahman|ika natassa|boy candra|dee lestari|raditya dika|leila s chudori|fiersa besari)/i.test(t) ||
      /(matahari|bumi|bulan|bintang|komet|hujan|pulang|pergi|yang telah lama pergi|cantik itu luka|gadis kretek|laut bercerita|laskar pelangi|guru aini|sang pemimpi|negeri 5 menara|perahu kertas|filosofi kopi|5 cm|dilan|milea|mariposa|selamat tinggal|si anak|tentang kamu|rindu)/i.test(t)
    ) {
      return { code: '813', name: 'Sastra, Novel & Fiksi Indonesia' }
    }
  }

  // 2. SAFETY NET BERDASARKAN KATEGORI KOLEKSI
  if (cat) {
    if (/(fiksi|novel|sastra|cerpen|roman)/i.test(cat)) {
      return { code: '813', name: 'Sastra, Novel & Fiksi Indonesia' }
    }
    if (/(agama|pai|islam)/i.test(cat)) {
      return { code: '297', name: 'Pendidikan Agama Islam & Budi Pekerti (PAI)' }
    }
    if (/(mplb|perkantoran|otkp|layanan bisnis)/i.test(cat)) {
      return { code: '651', name: 'Manajemen Perkantoran & Layanan Bisnis (MPLB)' }
    }
    if (/(akl|akuntansi|keuangan)/i.test(cat)) {
      return { code: '657', name: 'Akuntansi & Keuangan Lembaga (AKL)' }
    }
    if (/(pemasaran|bdp|ritel|bisnis daring)/i.test(cat)) {
      return { code: '658.8', name: 'Pemasaran & Bisnis Ritel' }
    }
    if (/(pplg|rpl|informatika|pemrograman|komputer)/i.test(cat)) {
      return { code: '005.13', name: 'Pengembangan Perangkat Lunak & Gim (PPLG)' }
    }
    if (/(tjkt|tkj|jaringan|telekomunikasi)/i.test(cat)) {
      return { code: '004.6', name: 'Teknik Jaringan Komputer & Telekomunikasi (TJKT)' }
    }
    if (/(tkr|otomotif|to)/i.test(cat)) {
      return { code: '629.2', name: 'Teknik Kendaraan Ringan & Otomotif (TKR)' }
    }
    if (/(tbsm|sepeda motor)/i.test(cat)) {
      return { code: '629.287', name: 'Teknik & Bisnis Sepeda Motor (TBSM)' }
    }
    if (/(titl|listrik|elektronika)/i.test(cat)) {
      return { code: '621.3', name: 'Teknik Ketenagalistrikan & Elektronika (TITL)' }
    }
    if (/(dkv|desain|multimedia|grafis)/i.test(cat)) {
      return { code: '741.6', name: 'Desain Komunikasi Visual (DKV)' }
    }
    if (/(kuliner|boga|tata boga)/i.test(cat)) {
      return { code: '641', name: 'Tata Boga & Seni Kuliner' }
    }
    if (/(busana|tata busana)/i.test(cat)) {
      return { code: '646', name: 'Tata Busana & Desain Mode' }
    }
    if (/(paket|buku teks|pembelajaran|pelajaran)/i.test(cat)) {
      return { code: '371.3', name: 'Buku Teks Pembelajaran & Panduan Belajar' }
    }
    if (/(referensi|kamus|ensiklopedia)/i.test(cat)) {
      return { code: '030', name: 'Ensiklopedia Umum & Referensi' }
    }
    if (/(karya umum|umum)/i.test(cat)) {
      return { code: '004', name: 'Komputer & Pengolahan Data' }
    }
  }

  // 3. DEFAULT AMAN STANDAR PERPUSTAKAAN SEKOLAH (BUKAN 000!)
  return { code: '371.3', name: 'Buku Pembelajaran & Referensi SMK' }
}

/**
 * Format Cutter Pengarang 3 huruf kapital standar SLiMS / Perpusnas
 */
export function cleanAuthorCutter(author?: string): string {
  if (!author || !author.trim() || author.trim().toLowerCase() === 'tidak diketahui') {
    return 'XXX'
  }

  const firstAuthor = author.split(/[,&]|(\s+dan\s+)/i)[0]
  const cleaned = firstAuthor
    .replace(/\b(drs|dra|prof|dr|ir|h|hj|s\.pd|m\.pd|s\.e|m\.m|m\.kom|m\.hum|s\.t|s\.si|m\.si|mf|dkk|et al)\b/gi, '')
    .replace(/\b(al-|el-)/gi, '')
    .replace(/[^a-zA-Z\s]/g, '')
    .trim()

  const words = cleaned.split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'XXX'

  const target = words.length > 1 && words[words.length - 1].length >= 2 ? words[words.length - 1] : words[0]
  return target.slice(0, 3).toUpperCase().padEnd(3, 'X')
}

/**
 * Format Cutter Judul 1 huruf kecil standar SLiMS / Perpusnas
 */
export function cleanTitleCutter(title?: string): string {
  if (!title) return 'x'
  const clean = title.replace(/^[^a-zA-Z]+/, '')
  return clean.length > 0 ? clean.charAt(0).toLowerCase() : 'x'
}

/**
 * Buat nomor panggil lengkap standar perpustakaan:
 * "[DDC] [Cutter Pengarang] [Cutter Judul]"
 */
export function formatCallNumber(classification: string, author?: string, title?: string): string {
  const cleanClass = classification.trim().split(/\s+/)[0] || '371.3'
  const finalClass = cleanClass === '000' ? '371.3' : cleanClass
  const authorCutter = cleanAuthorCutter(author)
  const titleCutter = cleanTitleCutter(title)

  return `${finalClass} ${authorCutter} ${titleCutter}`
}
