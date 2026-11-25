import { CameraPresetId, DeviceId, DeviceSpec } from '../types/twin';

export const TEAM_IDENTITY = {
  groupName: 'KELOMPOK 1',
  projectTitle: 'Sistem Public Address (PA) Bandara & Sensor Monitoring',
  subtitle: 'Simulasi Digital Twin 3D Ruang Operator & Zona Pengumuman Terminal',
  members: [
    'MUH.ABHYAN PRASETYA',
    'IKAL ANRI SAPUTRA',
    'WINDA ZALZABILA',
  ],
};

export const CAMERA_PRESETS: Record<
  CameraPresetId,
  {
    id: CameraPresetId;
    label: string;
    position: [number, number, number];
    target: [number, number, number];
    focusDevice?: DeviceId;
  }
> = {
  overview: {
    id: 'overview',
    label: 'Overview Ruangan',
    position: [6.4, 4.3, 6.2],
    target: [-0.1, 1.45, -0.35],
  },
  speaker: {
    id: 'speaker',
    label: 'Speaker Plafon',
    position: [3.2, 2.55, 2.7],
    target: [1.8, 3.38, 1.2],
    focusDevice: 'speaker',
  },
  console: {
    id: 'console',
    label: 'Meja Mixer & Mic',
    position: [-0.25, 2.05, 1.15],
    target: [-0.45, 0.92, -1.05],
    focusDevice: 'mixer',
  },
  temp_sensor: {
    id: 'temp_sensor',
    label: 'Sensor Suhu',
    position: [1.85, 1.48, -0.25],
    target: [0.95, 0.94, -1.25],
    focusDevice: 'temp_sensor',
  },
  air_sensor: {
    id: 'air_sensor',
    label: 'Sensor Udara',
    position: [-1.15, 2.85, -0.85],
    target: [-2.35, 2.55, -2.55],
    focusDevice: 'air_sensor',
  },
  current_sensor: {
    id: 'current_sensor',
    label: 'Sensor Arus',
    position: [0.65, 2.45, -0.85],
    target: [-0.55, 2.15, -2.52],
    focusDevice: 'current_sensor',
  },
};

export const DEVICE_SPECS: Record<DeviceId, DeviceSpec> = {
  speaker: {
    id: 'speaker',
    code: 'PA-SPK-01',
    name: 'Genesis PA Ceiling Speaker',
    shortName: 'Speaker Plafon',
    locationLabel: 'Grid Plafon Akustik · Zona Pengumuman Gate A12',
    description:
      'Speaker plafon terdistribusi berbasis trafo penyesuai tegangan konstan (25V/70V/100V) dengan kapasitor pemblokir DC untuk supervisi jalur darurat bandara.',
    workingPrincipleTitle: 'Alur Kerja Konversi Sinyal 70V/100V ke Akustik',
    signalChain: [
      'Sinyal Audio 70V/100V dari Jalur Plafon',
      'Terminal Block & DC Blocking Capacitor (Line Supervision)',
      'Wattage Tap Selector Switch (1/4W, 1/2W, 1W, 2W)',
      '25V/70V/100V Line Matching Transformer',
      'Voice Coil & Permanent Magnet Assembly (Gaya Lorentz)',
      'Full-Range Speaker Cone + Mounting/Baffle',
      'Low-Profile Perforated Ceiling Grille -> Gelombang Suara Ruangan',
    ],
    cameraPosition: [3.2, 2.55, 2.7],
    cameraTarget: [1.8, 3.38, 1.2],
    components: [
      {
        id: 'grille',
        name: 'Low-Profile Perforated Ceiling Grille (Twist-Lock Cover)',
        role: 'Pelindung luar berlubang mikro dengan pengunci putar rata plafon.',
        principle:
          'Menyalurkan gelombang tekanan suara dengan atenuasi minimal sekaligus menyamarkan komponen internal agar menyatu dengan grid plafon akustik bandara.',
        specs: 'Baja perforated powder-coated · Sudut dispersi 130°',
      },
      {
        id: 'cone',
        name: 'Full-Range Speaker Cone',
        role: 'Diafragma kerucut untuk mendorong molekul udara menjadi gelombang bunyi.',
        principle:
          'Bergetar maju-mundur secara mekanis mengikuti osilasi voice coil untuk mereproduksi suara pengumuman vokal (300 Hz – 12 kHz) dengan kejelasan tinggi.',
        specs: 'Paper-composite cone 4" · Surround elastis · SPL 92 dB (1W/1m)',
      },
      {
        id: 'voice_coil',
        name: 'Voice Coil',
        role: 'Kumparan tembaga penggerak konversi elektromagnetik.',
        principle:
          'Menerima arus audio sekunder dari trafo; interaksi arus AC dengan medan magnet permanen menghasilkan Gaya Lorentz F = B·I·L yang menggerakkan cone.',
        specs: 'Impedansi nominal 8 Ω · Kawat tembaga berlapis enamel tahan panas',
      },
      {
        id: 'magnet',
        name: 'Permanent Magnet Assembly & Yoke',
        role: 'Penghasil fluks magnet statis pada celah udara voice coil.',
        principle:
          'Inti ferit berenergi tinggi dan yoke baja lunak memusatkan kerapatan fluks magnet (B) tepat di celah tempat voice coil bergerak.',
        specs: 'Ferrite Ring Magnet · Top & Back Steel Yoke Plate',
      },
      {
        id: 'transformer',
        name: '25V/70V/100V Line Matching Transformer',
        role: 'Menurunkan tegangan tinggi jalur distribusi ke impedansi rendah speaker.',
        principle:
          'Mengubah sinyal tegangan tinggi-arus rendah (70V/100V) menjadi tegangan rendah-arus tinggi untuk menggerakkan voice coil 8 Ω secara efisien tanpa rugi kabel panjang.',
        specs: 'Laminated Silicon-Steel Core · Multi-tap primer 25V/70V/100V',
      },
      {
        id: 'tap_switch',
        name: 'Wattage Tap Selector Switch',
        role: 'Pemilih daya keluaran speaker (1/4W, 1/2W, 1W, 2W).',
        principle:
          'Memilih lilitan primer trafo yang berbeda guna mengubah impedansi input speaker (Z = V²/P) sehingga volume tiap zona terminal dapat disesuaikan.',
        specs: '4-Posisi Selektor: 0.25W · 0.5W · 1W · 2W',
      },
      {
        id: 'terminal_block',
        name: 'Terminal Block & DC Blocking Capacitor (Line Supervision)',
        role: 'Koneksi kabel jalur dan pemisah arus DC pengawasan jalur.',
        principle:
          'Kapasitor seri memblokir tegangan uji DC dari panel pengawas agar tidak masuk ke trafo (mencegah short DC), sementara sinyal audio AC tetap lolos ke speaker.',
        specs: 'Screw Terminal 2-Way + Non-Polar Electrolytic Cap 22 µF / 250V',
      },
      {
        id: 'baffle',
        name: 'Mounting Bracket / Baffle Housing',
        role: 'Rumah pelindung belakang (backcan) dan klem penahan plafon.',
        principle:
          'Menciptakan ruang akustik tertutup di belakang cone untuk mencegah pembatalan fase gelombang serta menopang bobot unit pada grid plafon.',
        specs: 'Steel Fire-Rated Backcan · 3x Dog-Ear Ceiling Clamps',
      },
    ],
  },

  mic: {
    id: 'mic',
    code: 'PA-MIC-01',
    name: 'Mikrofon Paging Bandara',
    shortName: 'Mikrofon Paging',
    locationLabel: 'Meja Konsol Operator · Stasiun Pengumuman Utama',
    description:
      'Mikrofon paging leher angsa meja dengan tombol Push-To-Talk (PTT), generator nada bel (Chime), sirkuit preamp rendah derau, dan kontrol relay zona PA.',
    workingPrincipleTitle: 'Prinsip Kerja PTT, Chime Generator & Pinout XLR 5-Pin',
    signalChain: [
      'Gelombang Suara Operator -> Busa Pelindung (Windscreen)',
      'Kapsul Mikrofon (Konversi Tekanan Akustik -> Sinyal mV)',
      'Kabel Internal Terlindung di dalam Leher Angsa Fleksibel',
      'Sakelar PTT Ditekan -> Kontrol Relay Aktif & Memicu Chime Generator',
      'Sirkuit Preamp Menguatkan Sinyal + Mencampur Nada Chime',
      'Konektor Keluaran Multi-Pin (XLR 5-Pin: Hot+, Cold-, GND, PTT+, PTT-)',
      'Kabel Output Seimbang menuju Input Channel 1 Audio Mixer',
    ],
    cameraPosition: [-0.95, 1.55, 0.2],
    cameraTarget: [-1.05, 0.92, -1.05],
    components: [
      {
        id: 'windscreen',
        name: 'Busa Pelindung (Windscreen)',
        role: 'Peredam hembusan napas (pop) dan noise angin sekitar.',
        principle:
          'Struktur poliuretan sel terbuka memecah turbulensi udara berkecepatan tinggi sebelum menyentuh membran kapsul tanpa meredam frekuensi vokal.',
        specs: 'Open-cell Acoustic Foam · Redaman plosif -14 dB',
      },
      {
        id: 'capsule',
        name: 'Kapsul Mikrofon (Dinamis / Elektret Kondenser)',
        role: 'Transduser akustik ke sinyal listrik milivolt.',
        principle:
          'Diafragma bergetar mengikuti tekanan suara, mengubah kapasitansi elektret atau menginduksi kumparan untuk menghasilkan sinyal audio seimbang berpola cardioid.',
        specs: 'Cardioid Unidirectional · Sensitivitas -52 dBV/Pa · 100 Hz – 14 kHz',
      },
      {
        id: 'gooseneck',
        name: 'Leher Angsa Fleksibel (Gooseneck)',
        role: 'Penopang kapsul yang dapat diarahkan sesuai posisi operator.',
        principle:
          'Selongsong logam spiral bergelombang mempertahankan sudut posisi secara mekanis sekaligus menjadi saluran pelindung kabel audio internal.',
        specs: 'Panjang 380 mm · Baja fleksibel berlapis matte hitam',
      },
      {
        id: 'internal_shield_cable',
        name: 'Kabel Internal Terlindung',
        role: 'Penghantar sinyal sensitif bebas interferensi EMI/RFI.',
        principle:
          'Pasangan konduktor terpilin dengan anyaman pelindung tembaga (braided shield) menyalurkan sinyal mV dari kapsul menuju preamp di dudukan.',
        specs: 'Twisted-pair 28 AWG + 95% Copper Braid Shield',
      },
      {
        id: 'base',
        name: 'Dudukan Meja Pemberat',
        role: 'Fondasi kokoh meja operator dan rumah modul elektronik.',
        principle:
          'Bodi logam cor berdensitas tinggi dengan alas karet anti-getar mengisolasi getaran meja agar tidak masuk ke kapsul mikrofon.',
        specs: 'Die-cast Zinc Alloy · Berat 1.15 kg · Bantalan isolasi karet',
      },
      {
        id: 'ptt_switch',
        name: 'Sakelar Tekan Bicara (PTT Switch)',
        role: 'Pemicu utama pengaktifan jalur pengumuman.',
        principle:
          'Kontak sesaat/latch mengirim sinyal logika ke kontrol relay dan generator chime sekaligus membuka mute preamp mikrofon.',
        specs: 'Tactile Microswitch + LED Status Cyan/Amber',
      },
      {
        id: 'pcb',
        name: 'Papan Sirkuit Internal (Main PCB)',
        role: 'Platform integrasi daya, logika kontrol, dan jalur audio.',
        principle:
          'Menghubungkan subsistem preamp, chime, regulator tegangan, dan proteksi ESD dalam tata letak jalur ground terpisah (star ground).',
        specs: 'FR-4 Double-Layer PCB · Ground-plane terisolasi',
      },
      {
        id: 'preamp',
        name: 'Sirkuit Penguat Awal (Preamp)',
        role: 'Menguatkan sinyal lemah kapsul (mV) ke level mikrofon/line.',
        principle:
          'Penguat diferensial ber-noise rendah menaikkan level sinyal audio sekaligus menjaga keseimbangan impedansi untuk transmisi kabel seimbang.',
        specs: 'Low-Noise Op-Amp · Gain +26 dB · Phantom/DC 12-48V',
      },
      {
        id: 'chime_relay',
        name: 'Generator Nada Bel (Chime Generator) & Kontrol Relay',
        role: 'Pembangkit nada pembuka pengumuman dan sakelar jalur prioritas.',
        principle:
          'Saat PTT ditekan, relay menutup kontak kontrol zona PA dan IC Chime menghasilkan nada 2-tone/4-tone otomatis sebelum suara operator masuk.',
        specs: 'Dual-Tone Chime IC (523Hz / 659Hz) · Relay SPDT 24V',
      },
      {
        id: 'connector',
        name: 'Konektor Multi-Pin (XLR 5-Pin) & Kabel Output Seimbang',
        role: 'Antarmuka output audio balanced dan jalur kontrol PTT.',
        principle:
          'Pin 1: Ground/Shield · Pin 2: Audio Hot (+) · Pin 3: Audio Cold (-) · Pin 4: PTT Control (+) · Pin 5: PTT Return/Relay (-). Menolak derau melalui CMRR.',
        specs: 'XLR 5-Pin Male · Kabel Balanced 4-Core + Shield ke Mixer',
      },
    ],
  },

  mixer: {
    id: 'mixer',
    code: 'PA-MIX-12',
    name: '12-Channel Analog Audio Mixer',
    shortName: '12-Ch Audio Mixer',
    locationLabel: 'Meja Konsol Utama Operator · Pusat Routing Audio',
    description:
      'Konsol pencampur audio analog 12 saluran dengan preamp diskrit, EQ 3-band per saluran, LED meter bridge, catu daya internal +48V, dan bus routing menuju amplifier 70V/100V.',
    workingPrincipleTitle: '4 Tahap Pemrosesan Sinyal Audio Mixer 12-Channel',
    signalChain: [
      '1. Input Sinyal (Panel Belakang XLR Balanced / TRS 1/4")',
      '2. Preamp & Gain (Penguatan Level Mikrofon + Opsional +48V Phantom)',
      '3. Pemrosesan Saluran (EQ 3-Band Low/Mid/High, Aux Sends, Pan)',
      '4. Routing & Mixing (Channel Faders -> Summing Bus -> Main Mix Fader & LED Meter Bridge)',
    ],
    cameraPosition: [0.25, 1.95, 0.75],
    cameraTarget: [0.05, 0.9, -1.05],
    components: [
      {
        id: 'chassis',
        name: 'Chassis & Bodi Modular',
        role: 'Rangka baja kokoh dan pelindung interferensi elektromagnetik.',
        principle:
          'Menyatukan seluruh modul saluran secara mekanis dan berperan sebagai sangkar Faraday untuk menjaga rasio Signal-to-Noise tetap tinggi.',
        specs: 'Anodized Steel Chassis · Rack/Console Mountable',
      },
      {
        id: 'channel_strips',
        name: 'Modul Saluran Vertikal (Channel Strip Module 1–12)',
        role: 'Kontrol Gain/Preamp, EQ 3-band, Aux Sends, dan Pan per saluran.',
        principle:
          'Setiap strip memproses satu sumber input secara independen: mengatur sensitivitas preamp, membentuk kontur frekuensi vokal (EQ), dan mengirim sinyal ke bus Aux/Monitor.',
        specs: '12× Channel Strips · EQ ±15 dB (80Hz / 2.5kHz / 12kHz)',
      },
      {
        id: 'faders',
        name: 'Penggeser Saluran (Channel Faders)',
        role: 'Kontrol presisi level kontribusi tiap saluran ke Main Mix.',
        principle:
          'Potensiometer geser logaritmik (100 mm) mengatur atenuasi sinyal dari -∞ dB hingga +10 dB sebelum masuk ke summing amplifier utama.',
        specs: '12× 60mm/100mm Logarithmic Slide Faders',
      },
      {
        id: 'master_section',
        name: 'Bagian Master & Grup (Master Section Module)',
        role: 'Pengendali Main Mix Fader, Subgroup, Aux Returns, dan Control Room.',
        principle:
          'Menjumlahkan seluruh sinyal saluran aktif di summing bus, mengontrol level akhir Main Output (+4 dBu) menuju power amplifier 70V/100V.',
        specs: 'Main L/R Faders · Subgroup 1-2 · Headphone/CR Monitor',
      },
      {
        id: 'io_panel',
        name: 'Panel Input/Output Belakang (XLR & TRS 1/4")',
        role: 'Titik terminasi fisik kabel input mikrofon dan output master.',
        principle:
          'Menyediakan konektor XLR seimbang untuk mikrofon paging/gate dan TRS 1/4" untuk sumber line/rekaman serta output master ke amplifier.',
        specs: '12× XLR Mic In · 12× TRS Line In · Main XLR Out',
      },
      {
        id: 'meter_bridge',
        name: 'LED Meter Bridge & Indikator',
        role: 'Pemantau visual puncak sinyal (Peak/VU) secara real-time.',
        principle:
          'Rangkaian komparator memetakan amplitudo sinyal bus utama ke bar LED hijau (-20..0 dB), amber (+3..+6 dB), dan merah (Clip/Peak).',
        specs: 'Dual 12-Segment Peak/VU LED Bar · +48V & Power LEDs',
      },
      {
        id: 'psu',
        name: 'Catu Daya Internal (PSU + Phantom Power +48V)',
        role: 'Menyuplai tegangan DC simetris ±15V dan bias +48V.',
        principle:
          'Trafo toroidal dan regulator linear mengubah AC 220V menjadi rel daya rendah-riak untuk op-amp analog dan catu daya mikrofon kondenser.',
        specs: 'Internal Linear PSU ±15V DC · +48V Phantom Switchable',
      },
      {
        id: 'ribbon_cable',
        name: 'Jalur Kabel Pita & Konektor',
        role: 'Bus interkoneksi internal antar modul saluran dan bagian master.',
        principle:
          'Mengalirkan sinyal audio bus summing, rel daya PSU, dan sinyal kontrol LED meter antar PCB modular tanpa kabel berantakan.',
        specs: '26-Pin IDC Shielded Bus Ribbon Harness',
      },
    ],
  },

  temp_sensor: {
    id: 'temp_sensor',
    code: 'SEN-TMP-01',
    name: 'Sensor Suhu Peralatan PA',
    shortName: 'Sensor Suhu',
    locationLabel: 'Titik Panas PSU Mixer 12-Channel & Rak Amplifier',
    description:
      'Sensor suhu presisi yang ditempatkan di dekat catu daya internal 12-Channel Mixer dan area panas trafo untuk mendeteksi overheat sebelum terjadi kegagalan termal.',
    workingPrincipleTitle: 'Prinsip Pengukuran Termal & Deteksi Overheat',
    signalChain: [
      'Panas dari PSU Mixer / Amplifier -> Thermal Probe (Heat-Transfer Tip)',
      'Sensing Element (Thermistor NTC / RTD) Mengubah Resistansi terhadap Suhu',
      'Signal Conditioning PCB (Jembatan Wheatstone & Amplifier Presisi)',
      'Keluaran Tegangan / Data Digital (°C) ke Panel Monitoring & Alarm',
    ],
    cameraPosition: [1.85, 1.48, -0.25],
    cameraTarget: [0.95, 0.94, -1.25],
    components: [
      {
        id: 'casing',
        name: 'Outer Protective Casing / Enclosure',
        role: 'Pelindung mekanis bersirip pelepas panas dan indikator status.',
        principle:
          'Bodi aluminium anodisasi melindungi elektronika internal dari debu sekaligus menyediakan dudukan klem dekat bodi PSU mixer.',
        specs: 'IP65 Anodized Aluminum · LED Indikator Status Termal',
      },
      {
        id: 'sensing_element',
        name: 'Sensing Element (Thermistor NTC / RTD / IC Digital)',
        role: 'Elemen inti pengubah energi panas menjadi besaran listrik.',
        principle:
          'Perubahan suhu menggeser resistansi termistor NTC/RTD secara terkalibrasi (atau tegangan Vbe pada IC digital) dengan akurasi ±0.2°C.',
        specs: 'Pt1000 RTD / Precision NTC · Rentang -10°C s.d. +125°C',
      },
      {
        id: 'thermal_probe',
        name: 'Thermal Probe / Heat-Transfer Tip',
        role: 'Ujung konduktor termal yang menghadap sumber panas peralatan.',
        principle:
          'Selongsong tembaga/baja tahan karat berkonduktivitas tinggi mengalirkan panas dari bodi PSU mixer/trafo menuju elemen pengindera secara cepat.',
        specs: '316L Stainless & Copper Thermal Tip · Waktu respon < 1.8 s',
      },
      {
        id: 'conditioning_pcb',
        name: 'Internal Signal Conditioning PCB',
        role: 'Pengkondisi sinyal, linearisasi, dan komparator ambang alarm.',
        principle:
          'Mengonversi perubahan resistansi mikro menjadi sinyal terkalibrasi 4-20 mA / RS-485 bebas noise untuk dibaca sistem Digital Twin.',
        specs: '24-bit Sigma-Delta ADC · Proteksi Surge & Reverse Polarity',
      },
      {
        id: 'wiring_harness',
        name: 'Terminal / Connector & Wiring Harness',
        role: 'Koneksi kabel daya DC dan saluran telemetri menuju kontroler.',
        principle:
          'Kabel terlindung 3-inti menyalurkan daya 24V DC dan data suhu kontinu ke pusat pemantauan ruang operator.',
        specs: 'M12 / 3-Pin Industrial Terminal · Shielded Telemetry Cable',
      },
    ],
  },

  air_sensor: {
    id: 'air_sensor',
    code: 'SEN-AIR-01',
    name: 'Sensor Udara & Aliran Sirkulasi',
    shortName: 'Sensor Udara',
    locationLabel: 'Dinding Zona Peralatan & Saluran Sirkulasi Udara (HVAC)',
    description:
      'Sensor terintegrasi untuk memantau konsentrasi debu/partikulat (PM2.5/PM10), kualitas udara ruang peralatan, dan kecepatan aliran udara pendingin (airflow).',
    workingPrincipleTitle: 'Prinsip Hamburan Laser Partikulat & Anemometer Termal',
    signalChain: [
      'Udara Ruangan Masuk melalui Intake Louver & Micro-Fan',
      'Optical / Laser Particulate Element Mengukur Hamburan Cahaya Debu',
      'Thermal Anemometer Element Mengukur Laju Aliran Udara (m/s)',
      'Signal Processor PCB Mengirim Indeks Debu, IAQ & Status Ventilasi',
    ],
    cameraPosition: [-1.15, 2.85, -0.85],
    cameraTarget: [-2.35, 2.55, -2.55],
    components: [
      {
        id: 'intake_louver',
        name: 'Intake Louver / Sampling Chamber',
        role: 'Kisi masuk udara dan ruang gelap pengambilan sampel partikulat.',
        principle:
          'Mengarahkan aliran udara ruangan masuk ke ruang optik kedap cahaya luar agar pengukuran laser tidak terganggu lampu ruangan.',
        specs: 'Aerodynamic Slotted Louver · Light-Trap Optical Maze',
      },
      {
        id: 'laser_pm_element',
        name: 'Optical / Laser Particulate & Air Quality Element',
        role: 'Detektor partikulat debu (PM2.5/PM10) berbasis hamburan laser.',
        principle:
          'Dioda laser 650 nm menyinari partikel debu yang lewat; fotodioda membaca intensitas cahaya terhambur (Mie scattering) untuk menghitung massa debu (µg/m³).',
        specs: '650nm Laser Scattering · Rentang 0–500 µg/m³',
      },
      {
        id: 'airflow_element',
        name: 'Airflow / Thermal Anemometer Element',
        role: 'Pengukur kecepatan aliran udara pendingin ruang operator.',
        principle:
          'Filamen pemanas mikro didinginkan oleh aliran udara; laju pendinginan sebanding dengan kecepatan angin (m/s) sehingga kipas macet atau ventilasi tersumbat langsung terdeteksi.',
        specs: 'MEMS Thermal Mass Flow · Rentang 0.05 – 8.0 m/s',
      },
      {
        id: 'micro_fan',
        name: 'Micro-Fan / Passive Convection Guide',
        role: 'Penarik sampel udara konstan melewati sensor optik.',
        principle:
          'Kipas mikro DC berumur panjang memastikan laju sampling udara stabil melintasi berkas laser dan elemen anemometer.',
        specs: 'Brushless Micro-Blower 5V · Kecepatan Proporsional Airflow',
      },
      {
        id: 'processor_pcb',
        name: 'Signal Processor PCB & Output Interface',
        role: 'Pemroses algoritma partikulat dan antarmuka telemetri.',
        principle:
          'Mikrokontroler menyaring pulsa hamburan cahaya dan sinyal termal menjadi pembacaan µg/m³ dan m/s serta memicu peringatan pembersihan/ventilasi.',
        specs: 'ARM MCU DSP · Modbus RTU / Analog Output Interface',
      },
    ],
  },

  current_sensor: {
    id: 'current_sensor',
    code: 'SEN-CUR-01',
    name: 'Sensor Arus Jalur Distribusi PA',
    shortName: 'Sensor Arus',
    locationLabel: 'Jalur Conduit Kabel 70V/100V & Catu Daya Rak Amplifier',
    description:
      'Sensor arus induktif/Hall-effect yang terpasang pada jalur distribusi 70V/100V menuju Genesis Ceiling Speaker untuk memantau beban pengumuman, overload, perubahan tap, atau putusnya kabel.',
    workingPrincipleTitle: 'Prinsip Induksi Toroid & Efek Hall Terisolasi',
    signalChain: [
      'Arus Beban Jalur 70V/100V Mengalir Melalui Primary Conductor Feedthrough',
      'Medan Magnet Terkonsentrasi di Inti Ferrite Toroid (Hukum Ampere)',
      'Elemen Hall Effect / Kumparan Sekunder Menghasilkan Tegangan Proporsional',
      'Isolation & Conditioning PCB Mengirim Data Arus (A) & Deteksi Gangguan Jalur',
    ],
    cameraPosition: [0.65, 2.45, -0.85],
    cameraTarget: [-0.55, 2.15, -2.52],
    components: [
      {
        id: 'sensing_core',
        name: 'Current Sensing Core (Ferrite Toroid / Hall Core)',
        role: 'Inti magnetik pemusat fluks di sekeliling konduktor utama.',
        principle:
          'Menangkap medan magnet melingkar dari arus beban pada jalur 70V/100V tanpa memotong atau mengganggu sambungan fisik kabel audio.',
        specs: 'Split-Core High-Permeability Ferrite · Bandwidth DC–20 kHz',
      },
      {
        id: 'feedthrough',
        name: 'Primary Conductor Feedthrough',
        role: 'Konduktor jalur distribusi 70V/100V yang melewati lubang sensor.',
        principle:
          'Kabel daya/audio berinsulasi tinggi membawa arus menuju speaker plafon; besar arus menentukan kerapatan fluks magnet di dalam inti toroid.',
        specs: '16 AWG Flame-Retardant Line · Isolasi 600V RMS',
      },
      {
        id: 'hall_element',
        name: 'Hall Effect / Secondary Winding Element',
        role: 'Transduser fluks magnet menjadi tegangan sinyal terukur.',
        principle:
          'Chip Efek Hall di celah inti (dibantu lilitan sekunder kompensasi) menghasilkan tegangan keluaran linear baik untuk arus AC audio maupun DC supervisi.',
        specs: 'Closed-Loop Hall IC · Akurasi ±0.5% FS',
      },
      {
        id: 'isolation_pcb',
        name: 'Amplifier & Isolation / Conditioning PCB',
        role: 'Penguat sinyal True-RMS dan isolasi galvanik tegangan tinggi.',
        principle:
          'Memisahkan rangkaian telemetri tegangan rendah dari jalur speaker 100V (isolasi >2.5 kV) serta menghitung arus RMS untuk mendeteksi short-circuit atau open-line.',
        specs: 'Galvanic Isolation 3 kV · True-RMS Converter & Fault Comparator',
      },
      {
        id: 'output_terminals',
        name: 'Output Terminals & Signal Cable',
        role: 'Terminal keluaran sinyal monitoring arus menuju panel alarm.',
        principle:
          'Menyalurkan sinyal 0–10V / 4–20mA atau data digital arus jalur secara kontinu ke sistem pengawas ruang operator.',
        specs: 'Pluggable Phoenix Terminal · Kabel Twisted-Shielded',
      },
    ],
  },
};
