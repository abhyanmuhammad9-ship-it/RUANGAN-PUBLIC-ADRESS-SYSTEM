import * as THREE from 'three';

export interface ProceduralTextureSet {
  floorTex: THREE.CanvasTexture;
  ceilingGridTex: THREE.CanvasTexture;
  perforatedGrilleTex: THREE.CanvasTexture;
  mixerFaceplateTex: THREE.CanvasTexture;
  monitorLeftTex: THREE.CanvasTexture;
  monitorRightTex: THREE.CanvasTexture;
  gateSignTex: THREE.CanvasTexture;
  concourseWindowTex: THREE.CanvasTexture;
  pcbTex: THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  anisotropy: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

export function createProceduralTextures(
  maxAnisotropy: number,
): ProceduralTextureSet {
  // 1. Airport Technical Floor Tile Texture
  const [floorCanvas, fCtx] = makeCanvas(512, 512);
  fCtx.fillStyle = '#181E29';
  fCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1400; i++) {
    const x = (i * 73) % 512;
    const y = (i * 137) % 512;
    fCtx.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.08)';
    fCtx.fillRect(x, y, 2, 2);
  }
  fCtx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
  fCtx.lineWidth = 2;
  for (let p = 0; p <= 512; p += 128) {
    fCtx.beginPath();
    fCtx.moveTo(p, 0);
    fCtx.lineTo(p, 512);
    fCtx.stroke();
    fCtx.beginPath();
    fCtx.moveTo(0, p);
    fCtx.lineTo(512, p);
    fCtx.stroke();
  }
  const floorTex = finalizeTexture(floorCanvas, maxAnisotropy, 6, 4);

  // 2. Acoustic Ceiling Tile Grid Texture
  const [ceilCanvas, cCtx] = makeCanvas(512, 512);
  cCtx.fillStyle = '#1E2534';
  cCtx.fillRect(0, 0, 512, 512);
  cCtx.fillStyle = 'rgba(15, 23, 42, 0.45)';
  for (let x = 14; x < 512; x += 16) {
    for (let y = 14; y < 512; y += 16) {
      cCtx.fillRect(x, y, 3, 3);
    }
  }
  cCtx.strokeStyle = '#334155';
  cCtx.lineWidth = 6;
  cCtx.strokeRect(3, 3, 506, 506);
  cCtx.lineWidth = 3;
  cCtx.beginPath();
  cCtx.moveTo(256, 0);
  cCtx.lineTo(256, 512);
  cCtx.moveTo(0, 256);
  cCtx.lineTo(512, 256);
  cCtx.stroke();
  const ceilingGridTex = finalizeTexture(ceilCanvas, maxAnisotropy, 6, 4);

  // 3. Perforated Ceiling Speaker Grille Texture
  const [grilleCanvas, gCtx] = makeCanvas(512, 512);
  gCtx.fillStyle = '#E2E8F0';
  gCtx.fillRect(0, 0, 512, 512);
  gCtx.fillStyle = '#1E293B';
  for (let y = 24; y < 488; y += 18) {
    for (let x = 24; x < 488; x += 18) {
      const dx = x - 256;
      const dy = y - 256;
      if (dx * dx + dy * dy < 210 * 210) {
        gCtx.beginPath();
        gCtx.arc(x + ((y / 18) % 2 === 0 ? 0 : 9), y, 4.4, 0, Math.PI * 2);
        gCtx.fill();
      }
    }
  }
  gCtx.strokeStyle = '#94A3B8';
  gCtx.lineWidth = 10;
  gCtx.beginPath();
  gCtx.arc(256, 256, 240, 0, Math.PI * 2);
  gCtx.stroke();
  const perforatedGrilleTex = finalizeTexture(grilleCanvas, maxAnisotropy);

  // 4. 12-Channel Mixer Faceplate Texture
  const [mixCanvas, mCtx] = makeCanvas(1024, 512);
  mCtx.fillStyle = '#1A202C';
  mCtx.fillRect(0, 0, 1024, 512);
  // Header strip
  mCtx.fillStyle = '#0F172A';
  mCtx.fillRect(0, 0, 1024, 42);
  mCtx.fillStyle = '#22D3EE';
  mCtx.font = 'bold 18px sans-serif';
  mCtx.fillText('AIRPORT PA-12M · 12-CHANNEL ANALOG CONSOLE', 24, 27);
  // 12 Channel columns
  for (let ch = 0; ch < 12; ch++) {
    const x0 = 22 + ch * 64;
    mCtx.strokeStyle = 'rgba(148,163,184,0.22)';
    mCtx.lineWidth = 1.5;
    mCtx.strokeRect(x0, 54, 56, 434);
    mCtx.fillStyle = ch === 0 ? '#22D3EE' : '#94A3B8';
    mCtx.font = 'bold 13px monospace';
    mCtx.fillText(`CH ${ch + 1}`, x0 + 10, 74);
    // Fader scale ticks
    mCtx.strokeStyle = 'rgba(226,232,240,0.4)';
    for (let t = 0; t < 9; t++) {
      const ty = 305 + t * 19;
      mCtx.beginPath();
      mCtx.moveTo(x0 + 12, ty);
      mCtx.lineTo(x0 + 20, ty);
      mCtx.moveTo(x0 + 36, ty);
      mCtx.lineTo(x0 + 44, ty);
      mCtx.stroke();
    }
  }
  // Master section divider
  mCtx.fillStyle = '#141B26';
  mCtx.fillRect(800, 54, 202, 434);
  mCtx.strokeStyle = '#F59E0B';
  mCtx.lineWidth = 2;
  mCtx.strokeRect(800, 54, 202, 434);
  mCtx.fillStyle = '#F59E0B';
  mCtx.font = 'bold 14px monospace';
  mCtx.fillText('MASTER & GROUP', 835, 76);
  const mixerFaceplateTex = finalizeTexture(mixCanvas, maxAnisotropy);

  // 5. Left Operator Monitor Screen
  const [mon1Canvas, m1Ctx] = makeCanvas(512, 320);
  m1Ctx.fillStyle = '#090D16';
  m1Ctx.fillRect(0, 0, 512, 320);
  m1Ctx.strokeStyle = '#1E293B';
  m1Ctx.lineWidth = 2;
  m1Ctx.strokeRect(10, 10, 492, 300);
  m1Ctx.fillStyle = '#22D3EE';
  m1Ctx.font = 'bold 16px monospace';
  m1Ctx.fillText('TERMINAL PA ZONE MATRIX · GATE A12', 24, 38);
  m1Ctx.fillStyle = '#111827';
  m1Ctx.fillRect(24, 54, 464, 150);
  // Waveform graphic
  m1Ctx.strokeStyle = '#22D3EE';
  m1Ctx.lineWidth = 2.5;
  m1Ctx.beginPath();
  for (let x = 34; x < 476; x += 6) {
    const y = 128 + Math.sin(x * 0.08) * 32 * Math.cos(x * 0.021);
    if (x === 34) m1Ctx.moveTo(x, y);
    else m1Ctx.lineTo(x, y);
  }
  m1Ctx.stroke();
  m1Ctx.fillStyle = '#94A3B8';
  m1Ctx.font = '13px monospace';
  m1Ctx.fillText('LINE: 70V / 100V SUPERVISED   CHIME: READY', 24, 236);
  m1Ctx.fillStyle = '#10B981';
  m1Ctx.fillText('SPK-01 GENESIS · ZONE A12 ACTIVE', 24, 264);
  m1Ctx.fillStyle = '#F59E0B';
  m1Ctx.fillText('KELOMPOK 1 DIGITAL TWIN MONITOR', 24, 290);
  const monitorLeftTex = finalizeTexture(mon1Canvas, maxAnisotropy);

  // 6. Right Operator Monitor Screen
  const [mon2Canvas, m2Ctx] = makeCanvas(512, 320);
  m2Ctx.fillStyle = '#090D16';
  m2Ctx.fillRect(0, 0, 512, 320);
  m2Ctx.strokeStyle = '#1E293B';
  m2Ctx.lineWidth = 2;
  m2Ctx.strokeRect(10, 10, 492, 300);
  m2Ctx.fillStyle = '#F59E0B';
  m2Ctx.font = 'bold 16px monospace';
  m2Ctx.fillText('ENVIRONMENTAL & LINE TELEMETRY', 24, 38);
  const boxes = [
    { label: 'TEMP PSU', val: '36.5 C', color: '#22D3EE', x: 24 },
    { label: 'AIR / PM2.5', val: '22 ug', color: '#10B981', x: 184 },
    { label: 'LINE CURR', val: '1.45 A', color: '#F59E0B', x: 344 },
  ];
  boxes.forEach((b) => {
    m2Ctx.fillStyle = '#111827';
    m2Ctx.fillRect(b.x, 60, 144, 110);
    m2Ctx.strokeStyle = b.color;
    m2Ctx.strokeRect(b.x, 60, 144, 110);
    m2Ctx.fillStyle = '#94A3B8';
    m2Ctx.font = '12px monospace';
    m2Ctx.fillText(b.label, b.x + 12, 86);
    m2Ctx.fillStyle = '#F8FAFC';
    m2Ctx.font = 'bold 22px monospace';
    m2Ctx.fillText(b.val, b.x + 12, 134);
  });
  m2Ctx.fillStyle = '#64748B';
  m2Ctx.font = '13px monospace';
  m2Ctx.fillText('AIRFLOW: 2.4 m/s · SUPERVISION DC BLOCK OK', 24, 212);
  m2Ctx.fillText('MIXER +48V PHANTOM · XLR 5-PIN PTT SYNC', 24, 240);
  const monitorRightTex = finalizeTexture(mon2Canvas, maxAnisotropy);

  // 7. Airport Gate Sign Texture
  const [gateCanvas, gtCtx] = makeCanvas(512, 192);
  gtCtx.fillStyle = '#0F172A';
  gtCtx.fillRect(0, 0, 512, 192);
  gtCtx.fillStyle = '#F59E0B';
  gtCtx.fillRect(0, 0, 132, 192);
  gtCtx.fillStyle = '#0F172A';
  gtCtx.font = 'bold 58px sans-serif';
  gtCtx.fillText('A12', 14, 118);
  gtCtx.fillStyle = '#F8FAFC';
  gtCtx.font = 'bold 26px sans-serif';
  gtCtx.fillText('GATE A12 · TERMINAL', 156, 72);
  gtCtx.fillStyle = '#22D3EE';
  gtCtx.font = '18px monospace';
  gtCtx.fillText('ZONA PENGUMUMAN PUBLIK (PA)', 156, 114);
  gtCtx.fillStyle = '#94A3B8';
  gtCtx.font = '15px sans-serif';
  gtCtx.fillText('Boarding & Flight Information Audio Zone', 156, 148);
  const gateSignTex = finalizeTexture(gateCanvas, maxAnisotropy);

  // 8. Concourse Window Night/Terminal Backdrop
  const [winCanvas, wCtx] = makeCanvas(512, 256);
  const grad = wCtx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#090D16');
  grad.addColorStop(0.65, '#131C2E');
  grad.addColorStop(1, '#1A2438');
  wCtx.fillStyle = grad;
  wCtx.fillRect(0, 0, 512, 256);
  // Runway & terminal lights silhouette
  for (let i = 0; i < 24; i++) {
    wCtx.fillStyle = i % 3 === 0 ? '#F59E0B' : '#22D3EE';
    wCtx.beginPath();
    wCtx.arc(24 + i * 20, 195 + (i % 2) * 8, 2.5, 0, Math.PI * 2);
    wCtx.fill();
  }
  wCtx.fillStyle = 'rgba(148,163,184,0.16)';
  wCtx.fillRect(0, 208, 512, 48);
  // Glass mullion reflections
  wCtx.fillStyle = 'rgba(255,255,255,0.05)';
  wCtx.fillRect(60, 0, 22, 256);
  wCtx.fillRect(280, 0, 14, 256);
  const concourseWindowTex = finalizeTexture(winCanvas, maxAnisotropy);

  // 9. PCB Texture
  const [pcbCanvas, pCtx] = makeCanvas(256, 256);
  pCtx.fillStyle = '#0C3B2E';
  pCtx.fillRect(0, 0, 256, 256);
  pCtx.strokeStyle = '#1E7A5F';
  pCtx.lineWidth = 3;
  for (let i = 16; i < 240; i += 24) {
    pCtx.beginPath();
    pCtx.moveTo(16, i);
    pCtx.lineTo(180, i);
    pCtx.lineTo(220, i + 12);
    pCtx.stroke();
  }
  pCtx.fillStyle = '#D4AF37';
  for (let x = 24; x < 230; x += 32) {
    for (let y = 24; y < 230; y += 32) {
      pCtx.beginPath();
      pCtx.arc(x, y, 4, 0, Math.PI * 2);
      pCtx.fill();
    }
  }
  const pcbTex = finalizeTexture(pcbCanvas, maxAnisotropy);

  return {
    floorTex,
    ceilingGridTex,
    perforatedGrilleTex,
    mixerFaceplateTex,
    monitorLeftTex,
    monitorRightTex,
    gateSignTex,
    concourseWindowTex,
    pcbTex,
    dispose: () => {
      floorTex.dispose();
      ceilingGridTex.dispose();
      perforatedGrilleTex.dispose();
      mixerFaceplateTex.dispose();
      monitorLeftTex.dispose();
      monitorRightTex.dispose();
      gateSignTex.dispose();
      concourseWindowTex.dispose();
      pcbTex.dispose();
    },
  };
}
