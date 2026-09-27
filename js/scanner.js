// ===== SCANNER DE CODE-BARRES (livres) =====
// Utilise la détection de codes-barres intégrée au navigateur (Chrome sur Android) :
// le bouton n'apparaît que si l'appareil sait le faire.
let scanStream = null;
let scanTimer = null;

function scannerAvailable() {
  return 'BarcodeDetector' in window && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

async function openScanner() {
  const overlay = document.getElementById('scanner');
  const video = document.getElementById('scanner-video');
  const status = document.getElementById('scanner-status');
  status.textContent = t('scanHint');
  overlay.classList.add('active');
  try {
    scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    video.srcObject = scanStream;
    await video.play();
  } catch (e) {
    status.textContent = t('scanError');
    return;
  }
  const supported = await BarcodeDetector.getSupportedFormats();
  const formats = ['ean_13', 'ean_8', 'upc_a', 'upc_e'].filter(f => supported.includes(f));
  const detector = new BarcodeDetector({ formats: formats.length ? formats : ['ean_13'] });
  const tick = async () => {
    if (!scanStream) return;
    try {
      const codes = await detector.detect(video);
      const code = codes.map(c => c.rawValue).find(v => /^\d{8,13}$/.test(v));
      if (code) { onBarcode(code); return; }
    } catch (e) { /* image pas encore prête */ }
    scanTimer = setTimeout(tick, 250);
  };
  tick();
}

function closeScanner() {
  clearTimeout(scanTimer);
  if (scanStream) scanStream.getTracks().forEach(track => track.stop());
  scanStream = null;
  document.getElementById('scanner-video').srcObject = null;
  document.getElementById('scanner').classList.remove('active');
}

// Un code trouvé : on le recherche comme un ISBN
function onBarcode(code) {
  if (navigator.vibrate) navigator.vibrate(80);
  closeScanner();
  const input = document.getElementById('f-lookup');
  input.value = code;
  runLookup(code);
}
