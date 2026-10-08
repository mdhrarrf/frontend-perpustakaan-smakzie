export interface DdcItem {
  code: string
  name: string
  classGroup: string
  keywords: string[]
}

export const DDC_CATALOG: DdcItem[] = [
  // 000 Karya Umum & Komputer
  { code: '004', name: 'Komputer & Pengolahan Data', classGroup: '000 - Karya Umum & Komputer', keywords: ['komputer', 'hardware', 'it', 'perangkat keras', 'sistem komputer'] },
  { code: '004.6', name: 'Komunikasi Data & Jaringan Komputer', classGroup: '000 - Karya Umum & Komputer', keywords: ['jaringan', 'tkj', 'mikrotik', 'cisco', 'lan', 'wan', 'nirkabel', 'routing', 'switch'] },
  { code: '005.1', name: 'Algoritma & Pemrograman Dasar', classGroup: '000 - Karya Umum & Komputer', keywords: ['algoritma', 'logika pemrograman', 'flowchart', 'struktur data'] },
  { code: '005.13', name: 'Bahasa Pemrograman & Rekayasa Perangkat Lunak', classGroup: '000 - Karya Umum & Komputer', keywords: ['pemrograman', 'rpl', 'pplg', 'coding', 'web', 'php', 'laravel', 'python', 'javascript', 'java', 'html', 'css', 'c++', 'frontend', 'backend'] },
  { code: '005.7', name: 'Basis Data & Sistem Informasi', classGroup: '000 - Karya Umum & Komputer', keywords: ['database', 'basis data', 'sql', 'mysql', 'postgresql', 'oracle', 'data warehouse'] },
  { code: '006.6', name: 'Grafika Komputer & Animasi', classGroup: '000 - Karya Umum & Komputer', keywords: ['animasi', 'grafika', '3d', 'blender', 'rendering', 'cgi'] },
  { code: '020', name: 'Ilmu Perpustakaan & Informasi', classGroup: '000 - Karya Umum & Komputer', keywords: ['perpustakaan', 'katalogisasi', 'informasi', 'pustakawan'] },
  { code: '030', name: 'Ensiklopedia Umum & Referensi', classGroup: '000 - Karya Umum & Komputer', keywords: ['ensiklopedia', 'referensi umum', 'almanak'] },
  { code: '070', name: 'Jurnalistik & Media Massa', classGroup: '000 - Karya Umum & Komputer', keywords: ['jurnalistik', 'pers', 'wartawan', 'berita', 'media massa', 'majalah'] },

  // 100 Filsafat & Psikologi
  { code: '150', name: 'Psikologi Umum', classGroup: '100 - Filsafat & Psikologi', keywords: ['psikologi', 'kejiwaan', 'mental', 'perilaku'] },
  { code: '153.2', name: 'Kreativitas, Daya Cipta & Motivasi', classGroup: '100 - Filsafat & Psikologi', keywords: ['motivasi', 'kreativitas', 'daya cipta', 'pola pikir', 'mindset', 'inspirasi'] },
  { code: '158', name: 'Pengembangan Diri & Psikologi Terapan', classGroup: '100 - Filsafat & Psikologi', keywords: ['self improvement', 'pengembangan diri', 'sukses', 'kepemimpinan', 'public speaking', 'komunikasi'] },
  { code: '170', name: 'Etika & Moralitas', classGroup: '100 - Filsafat & Psikologi', keywords: ['etika', 'moral', 'akhlak filsafat', 'budi pekerti'] },

  // 200 Agama
  { code: '297', name: 'Agama Islam (Umum & Pendidikan)', classGroup: '200 - Agama', keywords: ['agama islam', 'islam', 'pendidikan agama', 'pai', 'muslim', 'keislaman'] },
  { code: '297.1', name: 'Al-Qur\'an, Hadits & Tafsir', classGroup: '200 - Agama', keywords: ['al-quran', 'quran', 'hadits', 'tafsir', 'tajwid'] },
  { code: '297.2', name: 'Aqidah & Teologi Islam', classGroup: '200 - Agama', keywords: ['aqidah', 'tauhid', 'iman', 'rukun iman'] },
  { code: '297.3', name: 'Ibadah & Fiqih Islam', classGroup: '200 - Agama', keywords: ['fiqih', 'ibadah', 'syariat', 'sholat', 'zakat', 'puasa', 'haji'] },
  { code: '297.5', name: 'Akhlak & Tasawuf Islam', classGroup: '200 - Agama', keywords: ['akhlak', 'tasawuf', 'moral islam', 'budi pekerti islam'] },
  { code: '297.6', name: 'Tarikh & Sejarah Kebudayaan Islam (SKI)', classGroup: '200 - Agama', keywords: ['ski', 'sejarah islam', 'nabi', 'rasul', 'khulafaur rasyidin'] },
  { code: '200', name: 'Agama Kristen, Katolik & Lainnya', classGroup: '200 - Agama', keywords: ['kristen', 'katolik', 'alkitab', 'hindu', 'buddha', 'konghucu'] },

  // 300 Ilmu Sosial
  { code: '300', name: 'Sosiologi & Ilmu Sosial', classGroup: '300 - Ilmu Sosial', keywords: ['sosiologi', 'sosial', 'interaksi sosial', 'masyarakat'] },
  { code: '312', name: 'Kependudukan & Demografi', classGroup: '300 - Ilmu Sosial', keywords: ['demografi', 'kependudukan', 'sensus', 'statistik penduduk'] },
  { code: '320', name: 'Pancasila & Kewarganegaraan (PPKn)', classGroup: '300 - Ilmu Sosial', keywords: ['ppkn', 'kewarganegaraan', 'pancasila', 'politik', 'uud 1945', 'kewarganegaraan'] },
  { code: '330', name: 'Ekonomi Umum & Koperasi', classGroup: '300 - Ilmu Sosial', keywords: ['ekonomi', 'koperasi', 'makro ekonomi', 'mikro ekonomi', 'pasar'] },
  { code: '332', name: 'Keuangan & Perbankan', classGroup: '300 - Ilmu Sosial', keywords: ['bank', 'perbankan', 'uang', 'investasi', 'keuangan'] },
  { code: '338.04', name: 'Kewirausahaan & Ekonomi Kreatif (PKK)', classGroup: '300 - Ilmu Sosial', keywords: ['kewirausahaan', 'pkk', 'produk kreatif', 'wirausaha', 'entrepreneur', 'bisnis mandiri'] },
  { code: '340', name: 'Ilmu Hukum & Perundang-undangan', classGroup: '300 - Ilmu Sosial', keywords: ['hukum', 'undang-undang', 'pasal', 'pidana', 'perdata'] },
  { code: '350', name: 'Administrasi Publik & Pemerintahan', classGroup: '300 - Ilmu Sosial', keywords: ['administrasi negara', 'administrasi publik', 'pemerintahan'] },
  { code: '370', name: 'Pendidikan & Ilmu Keguruan', classGroup: '300 - Ilmu Sosial', keywords: ['pendidikan', 'guru', 'sekolah', 'pedagogi', 'kurikulum'] },
  { code: '371.3', name: 'Metode & Strategi Pembelajaran', classGroup: '300 - Ilmu Sosial', keywords: ['metode belajar', 'pembelajaran', 'didaktik', 'media pembelajaran'] },

  // 400 Bahasa
  { code: '410', name: 'Bahasa Indonesia & Linguistik', classGroup: '400 - Bahasa', keywords: ['bahasa indonesia', 'tata bahasa', 'ejaan', 'kbbi', 'linguistik'] },
  { code: '420', name: 'Bahasa Inggris', classGroup: '400 - Bahasa', keywords: ['bahasa inggris', 'english', 'grammar', 'vocabulary', 'toefl', 'splash smart'] },
  { code: '492.7', name: 'Bahasa Arab', classGroup: '400 - Bahasa', keywords: ['bahasa arab', 'arab', 'nahwu', 'shorof', 'mufradat'] },
  { code: '495.6', name: 'Bahasa Jepang', classGroup: '400 - Bahasa', keywords: ['bahasa jepang', 'jepang', 'nihongo', 'jlpt', 'kanji', 'hiragana', 'katakana'] },
  { code: '499.2232', name: 'Bahasa Daerah / Bahasa Sunda', classGroup: '400 - Bahasa', keywords: ['bahasa sunda', 'basa sunda', 'sunda', 'panggelar', 'tatakrama sunda'] },
  { code: '403', name: 'Kamus Bahasa & Istilah', classGroup: '400 - Bahasa', keywords: ['kamus', 'glosarium', 'leksikon', 'thesaurus'] },

  // 500 Sains Murni & Matematika
  { code: '500', name: 'Sains Umum & IPA Terpadu', classGroup: '500 - Sains & Matematika', keywords: ['ipa', 'sains', 'ilmu pengetahuan alam'] },
  { code: '510', name: 'Matematika', classGroup: '500 - Sains & Matematika', keywords: ['matematika', 'aljabar', 'kalkulus', 'geometri', 'trigonometri', 'tka matematika', 'hitung'] },
  { code: '519', name: 'Statistika & Probabilitas', classGroup: '500 - Sains & Matematika', keywords: ['statistika', 'statistik', 'peluang', 'data spasial'] },
  { code: '530', name: 'Fisika', classGroup: '500 - Sains & Matematika', keywords: ['fisika', 'mekanika', 'listrik fisika', 'termodinamika', 'optik', 'magnet'] },
  { code: '540', name: 'Kimia', classGroup: '500 - Sains & Matematika', keywords: ['kimia', 'senyawa', 'larutan', 'stoikiometri', 'reaksi kimia'] },
  { code: '550', name: 'Geologi & Ilmu Kebumian', classGroup: '500 - Sains & Matematika', keywords: ['geologi', 'bumi', 'batuan', 'meteorologi', 'iklim'] },
  { code: '570', name: 'Biologi & Ilmu Hayati', classGroup: '500 - Sains & Matematika', keywords: ['biologi', 'anatomi', 'ekologi', 'sel', 'genetika', 'tumbuhan', 'hewan'] },

  // 600 Teknologi, Rekayasa & Kejuruan SMK
  { code: '610', name: 'Kesehatan & Kedokteran Dasar', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['kesehatan', 'p3k', 'keperawatan', 'farmasi', 'obat', 'medis'] },
  { code: '613.7', name: 'Kesehatan Jasmani & Kebugaran', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['kebugaran', 'senam', 'jasmani'] },
  { code: '620', name: 'Teknik & Rekayasa Umum', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['teknik', 'rekayasa', 'gambar teknik', 'mekanikal'] },
  { code: '621.3', name: 'Teknik Ketenagalistrikan & Elektronika', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['listrik', 'elektronika', 'arus kuat', 'instalasi listrik', 'komponen elektronika', 'titl'] },
  { code: '629.2', name: 'Teknik Kendaraan Ringan & Otomotif', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['otomotif', 'tkr', 'tbsm', 'sepeda motor', 'mobil', 'mesin mobil', 'chassis', 'kelistrikan mobil', 'injeksi'] },
  { code: '630', name: 'Pertanian, Agribisnis & Peternakan', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['pertanian', 'agribisnis', 'budidaya', 'tanaman', 'peternakan', 'perikanan'] },
  { code: '641', name: 'Tata Boga & Kuliner', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['tata boga', 'kuliner', 'memasak', 'resep masakan', 'pastry', 'roti'] },
  { code: '650', name: 'Manajemen Perkantoran & Bisnis (MPLB)', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['perkantoran', 'administrasi perkantoran', 'mplb', 'humas', 'keprotokolan'] },
  { code: '651', name: 'Kearsipan & Tata Usaha', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['kearsipan', 'arsip', 'surat menyurat', 'korespondensi'] },
  { code: '657', name: 'Akuntansi & Keuangan Lembaga (AKL)', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['akuntansi', 'akl', 'myob', 'keuangan', 'buku besar', 'jurnal', 'laporan keuangan', 'pajak', 'spreadsheet'] },
  { code: '658', name: 'Manajemen Usaha & Bisnis', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['manajemen', 'manajemen bisnis', 'organisasi'] },
  { code: '658.8', name: 'Pemasaran & Bisnis Ritel (BR / PM)', classGroup: '600 - Teknologi & Ilmu Terapan', keywords: ['pemasaran', 'marketing', 'bisnis online', 'ritel', 'penjualan', 'digital marketing', 'sales', 'bisnis daring'] },

  // 700 Seni, Desain & Olahraga
  { code: '700', name: 'Kesenian & Seni Budaya', classGroup: '700 - Seni & Olahraga', keywords: ['seni', 'seni budaya', 'kebudayaan', 'kesenian'] },
  { code: '741.5', name: 'Komik, Manga & Karikatur', classGroup: '700 - Seni & Olahraga', keywords: ['komik', 'manga', 'karikatur', 'cergam', 'strip'] },
  { code: '741.6', name: 'Desain Komunikasi Visual & Desain Grafis (DKV)', classGroup: '700 - Seni & Olahraga', keywords: ['desain grafis', 'dkv', 'desain', 'multimedia', 'photoshop', 'coreldraw', 'illustrator', 'tipografi', 'poster'] },
  { code: '770', name: 'Fotografi & Videografi', classGroup: '700 - Seni & Olahraga', keywords: ['fotografi', 'videografi', 'kamera', 'sinematografi', 'editing video'] },
  { code: '780', name: 'Seni Musik & Instrumen', classGroup: '700 - Seni & Olahraga', keywords: ['musik', 'lagu', 'instrumen', 'gitar', 'piano', 'harmoni'] },
  { code: '796', name: 'Olahraga & Penjasorkes', classGroup: '700 - Seni & Olahraga', keywords: ['olahraga', 'penjas', 'penjasorkes', 'pjok', 'sepakbola', 'voli', 'basket', 'futsal', 'badminton', 'atletik'] },

  // 800 Sastra & Novel Fiksi
  { code: '808', name: 'Teknik Menulis & Retorika', classGroup: '800 - Sastra & Fiksi', keywords: ['menulis', 'kepenulisan', 'retorika', 'mengarang', 'pidato'] },
  { code: '811', name: 'Puisi & Sajak Indonesia', classGroup: '800 - Sastra & Fiksi', keywords: ['puisi', 'sajak', 'antologi puisi', 'pantun', 'syair'] },
  { code: '812', name: 'Drama & Teater Indonesia', classGroup: '800 - Sastra & Fiksi', keywords: ['drama', 'teater', 'naskah drama', 'lakon'] },
  { code: '813', name: 'Novel & Fiksi Indonesia', classGroup: '800 - Sastra & Fiksi', keywords: ['novel', 'fiksi', 'cerpen', 'roman', 'laskar pelangi', 'tere liye', 'andrea hirata', 'bumi', 'bulan', 'hujan', 'matahari'] },
  { code: '823', name: 'Novel Fiksi Terjemahan', classGroup: '800 - Sastra & Fiksi', keywords: ['novel terjemahan', 'fiksi asing', 'harry potter', 'sherlock holmes'] },
  { code: '899.2232', name: 'Sastra Sunda & Carpon', classGroup: '800 - Sastra & Fiksi', keywords: ['carpon', 'sastra sunda', 'dongeng sunda', 'guguritan'] },

  // 900 Sejarah & Geografi
  { code: '910', name: 'Geografi Umum & Atlas', classGroup: '900 - Sejarah & Geografi', keywords: ['geografi', 'atlas', 'peta', 'benua', 'samudra', 'penjelajahan'] },
  { code: '920', name: 'Biografi & Kisah Tokoh', classGroup: '900 - Sejarah & Geografi', keywords: ['biografi', 'otobiografi', 'kisah tokoh', 'memoar', 'profil'] },
  { code: '959.8', name: 'Sejarah Indonesia', classGroup: '900 - Sejarah & Geografi', keywords: ['sejarah indonesia', 'sejarah', 'kemerdekaan', 'perjuangan', 'soekarno', 'pahlawan', 'orde baru'] },
  { code: '900', name: 'Sejarah Dunia & Peradaban', classGroup: '900 - Sejarah & Geografi', keywords: ['sejarah dunia', 'peradaban', 'perang dunia'] },
]

/**
 * Cari item DDC berdasarkan query (kode, nama, atau kata kunci)
 */
export function searchDdc(query: string, limit = 8): DdcItem[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    // Kembalikan kategori paling populer SMK jika kosong
    return DDC_CATALOG.slice(0, limit)
  }

  const results: { item: DdcItem; score: number }[] = []

  for (const item of DDC_CATALOG) {
    let score = 0
    const codeLower = item.code.toLowerCase()
    const nameLower = item.name.toLowerCase()

    if (codeLower === q) {
      score = 100 // exact match code
    } else if (codeLower.startsWith(q)) {
      score = 80 // starts with code
    } else if (codeLower.includes(q)) {
      score = 60
    } else if (nameLower.includes(q)) {
      score = 50 // name contains query
    } else {
      const matchKeyword = item.keywords.some(k => k.includes(q) || q.includes(k))
      if (matchKeyword) {
        score = 40
      }
    }

    if (score > 0) {
      results.push({ item, score })
    }
  }

  results.sort((a, b) => b.score - a.score)
  return results.slice(0, limit).map(r => r.item)
}

/**
 * Deteksi rekomendasi kode DDC cerdas berdasarkan judul buku
 */
export function detectDdcFromTitle(title?: string): { code: string; name: string } | null {
  if (!title || !title.trim()) return null
  const t = title.toLowerCase()

  // 1. Pemrograman & Komputer (RPL / PPLG / TKJ)
  if (/(pemrograman|coding|web|php|laravel|python|javascript|react|vue|java|c\+\+|html|css|rpl|pplg)/i.test(t)) {
    return { code: '005.13', name: 'Bahasa Pemrograman & RPL' }
  }
  if (/(jaringan|mikrotik|cisco|lan|wan|router|switch|tkj|server|nirkabel)/i.test(t)) {
    return { code: '004.6', name: 'Jaringan Komputer & TKJ' }
  }
  if (/(database|basis data|sql|mysql|oracle)/i.test(t)) {
    return { code: '005.7', name: 'Basis Data & SQL' }
  }
  if (/(komputer|perangkat keras|hardware|perakitan)/i.test(t)) {
    return { code: '004', name: 'Komputer & Pengolahan Data' }
  }

  // 2. Bahasa
  if (/(bahasa jepang|jlpt|nihongo|kanji)/i.test(t)) {
    return { code: '495.6', name: 'Bahasa Jepang' }
  }
  if (/(bahasa inggris|english|grammar|vocabulary|toefl|splash smart)/i.test(t)) {
    return { code: '420', name: 'Bahasa Inggris' }
  }
  if (/(basa sunda|bahasa sunda|panggelar|tatakrama)/i.test(t)) {
    return { code: '499.2232', name: 'Bahasa Sunda' }
  }
  if (/(bahasa indonesia|cerdas cergas|bersastra indonesia|tata bahasa)/i.test(t)) {
    return { code: '410', name: 'Bahasa Indonesia' }
  }
  if (/(bahasa arab|nahwu|shorof)/i.test(t)) {
    return { code: '492.7', name: 'Bahasa Arab' }
  }

  // 3. Sains MIPA
  if (/(matematika|kalkulus|aljabar|trigonometri|geometri|tka matematika)/i.test(t)) {
    return { code: '510', name: 'Matematika' }
  }
  if (/(fisika)/i.test(t)) {
    return { code: '530', name: 'Fisika' }
  }
  if (/(kimia)/i.test(t)) {
    return { code: '540', name: 'Kimia' }
  }
  if (/(biologi|ipa|ilmu pengetahuan alam)/i.test(t)) {
    return { code: '570', name: 'Biologi & IPA' }
  }

  // 4. Agama & Kewarganegaraan
  if (/(agama islam|pendidikan agama|pai|fiqih|akhlak|syariat|al-qur|hadits|muslim|tauhid)/i.test(t)) {
    return { code: '297', name: 'Pendidikan Agama Islam' }
  }
  if (/(pancasila|kewarganegaraan|ppkn)/i.test(t)) {
    return { code: '320', name: 'PPKn & Kewarganegaraan' }
  }

  // 5. Kejuruan SMK: Otomotif, Akuntansi, MPLB, Bisnis, Desain
  if (/(sepeda motor|tbsm|otomotif|tkr|mobil|mesin kendaraan|chassis|kelistrikan otomotif)/i.test(t)) {
    return { code: '629.2', name: 'Teknik Kendaraan Ringan & Otomotif' }
  }
  if (/(akuntansi|myob|keuangan|buku besar|jurnal|laporan keuangan|pajak|spreadsheet)/i.test(t)) {
    return { code: '657', name: 'Akuntansi & Keuangan (AKL)' }
  }
  if (/(pemasaran|marketing|bisnis online|ritel|penjualan|bisnis daring)/i.test(t)) {
    return { code: '658.8', name: 'Pemasaran & Bisnis Ritel' }
  }
  if (/(administrasi perkantoran|perkantoran|mplb|humas|keprotokolan|kearsipan)/i.test(t)) {
    return { code: '650', name: 'Manajemen Perkantoran (MPLB)' }
  }
  if (/(kewirausahaan|produk kreatif|pkk|entrepreneur|bisnis mandiri)/i.test(t)) {
    return { code: '338.04', name: 'Kewirausahaan (PKK)' }
  }
  if (/(desain grafis|dkv|photoshop|coreldraw|illustrator|tipografi|poster)/i.test(t)) {
    return { code: '741.6', name: 'Desain Komunikasi Visual (DKV)' }
  }
  if (/(fotografi|videografi|sinematografi)/i.test(t)) {
    return { code: '770', name: 'Fotografi & Videografi' }
  }
  if (/(listrik|elektronika|arus kuat|titl|instalasi penerangan)/i.test(t)) {
    return { code: '621.3', name: 'Teknik Ketenagalistrikan & Elektronika' }
  }
  if (/(tata boga|kuliner|memasak|pastry|roti)/i.test(t)) {
    return { code: '641', name: 'Tata Boga & Kuliner' }
  }

  // 6. Kesenian & Olahraga
  if (/(olahraga|penjas|penjasorkes|pjok|sepakbola|voli|futsal|badminton)/i.test(t)) {
    return { code: '796', name: 'Olahraga & Penjasorkes' }
  }
  if (/(seni budaya|seni rupa|seni musik)/i.test(t)) {
    return { code: '700', name: 'Kesenian & Seni Budaya' }
  }

  // 7. Sastra / Novel / Fiksi
  if (/(novel|fiksi|cerpen|roman|antologi cerita)/i.test(t) ||
      /(laskar pelangi|bumi manusia|tere liye|andrea hirata|ayah|bintang|bulan|matahari|hujan|pulang|pergi|i l y)/i.test(t)) {
    return { code: '813', name: 'Novel & Fiksi Indonesia' }
  }
  if (/(puisi|antologi sajak|pantun)/i.test(t)) {
    return { code: '811', name: 'Puisi Indonesia' }
  }

  // 8. Sejarah & Pengembangan Diri
  if (/(sejarah|sejarah indonesia|kemerdekaan|proklamasi)/i.test(t)) {
    return { code: '959.8', name: 'Sejarah Indonesia' }
  }
  if (/(psikologi|motivasi|daya cipta|mindset|berani gagal|atomic habits)/i.test(t)) {
    return { code: '153.2', name: 'Motivasi & Daya Cipta' }
  }

  return null
}
