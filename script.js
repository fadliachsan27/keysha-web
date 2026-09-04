// Kelopak bunga jatuh perlahan di background
(function initPetals(){
  var host = document.getElementById('petals');
  var syms = ['🌸', '💜', '🤍'];
  for (var i = 0; i < 14; i++){
    var s = document.createElement('span');
    s.className = 'petal';
    s.textContent = syms[i % syms.length];
    s.style.left = (Math.random() * 100) + 'vw';
    s.style.fontSize = (14 + Math.random() * 12) + 'px';
    s.style.animationDuration = (9 + Math.random() * 8) + 's';
    s.style.animationDelay = (Math.random() * 10) + 's';
    host.appendChild(s);
  }
})();

// Musik latar -> langsung nyala pelan (fade-in) begitu web dibuka, bisa dimatikan
// kapan saja lewat tombol mengambang
var playMusicSoftly = (function initMusic(){
  var audio = document.getElementById('bgMusic');
  var toggle = document.getElementById('musicToggle');
  var icon = document.getElementById('musicIcon');
  var TARGET_VOLUME = 0.45;
  var fadeTimer = null;

  if (!audio || !toggle) return function(){};

  audio.volume = 0;

  function fadeTo(target, duration){
    clearInterval(fadeTimer);
    var start = audio.volume;
    var startTime = Date.now();
    fadeTimer = setInterval(function(){
      var t = Math.min(1, (Date.now() - startTime) / duration);
      audio.volume = start + (target - start) * t;
      if (t >= 1) clearInterval(fadeTimer);
    }, 40);
  }

  function setPlayingUI(isPlaying){
    toggle.classList.toggle('playing', isPlaying);
    toggle.classList.remove('prompt');
    toggle.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
    toggle.setAttribute('aria-label', isPlaying ? 'Jeda musik' : 'Putar musik');
    icon.textContent = isPlaying ? '🎶' : '🎵';
  }

  function start(){
    if (!audio.paused) return;
    var playPromise = audio.play();
    if (playPromise && playPromise.then){
      playPromise.then(function(){
        fadeTo(TARGET_VOLUME, 2200);
        setPlayingUI(true);
      }).catch(function(){
        // autoplay diblokir browser -> tunggu sentuhan pertama di layar
        toggle.classList.add('prompt');
      });
    } else {
      fadeTo(TARGET_VOLUME, 2200);
      setPlayingUI(true);
    }
  }

  toggle.addEventListener('click', function(){
    if (audio.paused){
      start();
    } else {
      fadeTo(0, 500);
      setTimeout(function(){ audio.pause(); }, 520);
      setPlayingUI(false);
    }
  });

  // Coba nyalakan langsung begitu halaman terbuka
  start();

  // Kalau diblokir browser, sentuhan/klik pertama di mana saja akan
  // otomatis menyalakan musik (tanpa perlu tap tombolnya secara khusus)
  function tryStartOnFirstTouch(){
    start();
    document.removeEventListener('pointerdown', tryStartOnFirstTouch);
    document.removeEventListener('touchstart', tryStartOnFirstTouch);
    document.removeEventListener('click', tryStartOnFirstTouch);
    document.removeEventListener('keydown', tryStartOnFirstTouch);
  }
  document.addEventListener('pointerdown', tryStartOnFirstTouch);
  document.addEventListener('touchstart', tryStartOnFirstTouch);
  document.addEventListener('click', tryStartOnFirstTouch);
  document.addEventListener('keydown', tryStartOnFirstTouch);

  return start;
})();

// Confetti ringan pakai canvas, dipakai saat verifikasi nama berhasil
var fireConfetti = (function initConfetti(){
  var canvas = document.getElementById('confettiCanvas');
  if (!canvas) return function(){};
  var ctx = canvas.getContext('2d');
  var colors = ['#c9a8e0', '#e6b3d6', '#7c4fa0', '#f1e9fa', '#b48fd6'];
  var particles = [];
  var running = false;

  function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function spawn(count){
    for (var i = 0; i < count; i++){
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 60,
        y: canvas.height * 0.35,
        vx: (Math.random() - 0.5) * 9,
        vy: -Math.random() * 9 - 4,
        size: 5 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        gravity: 0.22 + Math.random() * 0.08,
        life: 0
      });
    }
  }

  function tick(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(function(p){
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      p.life++;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    });
    particles = particles.filter(function(p){ return p.y < canvas.height + 40 && p.life < 260; });

    if (particles.length > 0){
      requestAnimationFrame(tick);
    } else {
      running = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  return function fire(){
    spawn(90);
    if (!running){
      running = true;
      requestAnimationFrame(tick);
    }
  };
})();

// Berpindah halaman dengan tirai ungu, dipakai di semua transisi halaman
function goToPage(hidePage, showPage){
  var curtain = document.getElementById('curtain');
  curtain.classList.add('swipe-in');

  setTimeout(function(){
    hidePage.classList.remove('active');
    showPage.classList.add('active');
    window.scrollTo(0, 0);
  }, 700);

  setTimeout(function(){
    curtain.classList.remove('swipe-in');
    curtain.classList.add('swipe-out');
  }, 900);

  setTimeout(function(){
    curtain.classList.remove('swipe-out');
  }, 1650);
}

// Gerbang verifikasi nama -> hanya nama lengkap "Keysha Aulia Salsabila" yang boleh lanjut
(function initGate(){
  var FULL_NAME = 'keysha aulia salsabila';

  var pageGate = document.getElementById('pageGate');
  var pageTanya = document.getElementById('pageTanya');
  var form = document.getElementById('gateForm');
  var input = document.getElementById('gateInput');
  var errorOverlay = document.getElementById('gateErrorOverlay');
  var incompleteOverlay = document.getElementById('gateIncompleteOverlay');
  if (!pageGate || !form) return;

  pageGate.classList.add('active');

  var errorTimer = null;
  var incompleteTimer = null;

  function showOverlay(overlay, timerRef, setTimerRef){
    clearTimeout(timerRef);
    overlay.classList.add('show');
    var t = setTimeout(function(){
      overlay.classList.remove('show');
    }, 3000);
    setTimerRef(t);
    form.classList.remove('gate-shake');
    void form.offsetWidth;
    form.classList.add('gate-shake');
    input.focus();
    input.select();
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    // rapikan spasi berlebih supaya "Keysha   Aulia Salsabila" tetap terhitung benar
    var name = (input.value || '').trim().toLowerCase().replace(/\s+/g, ' ');

    if (name === FULL_NAME){
      goToPage(pageGate, pageTanya);

      // musik latar mulai diputar pelan (masih dalam gestur klik user, jadi diizinkan browser)
      playMusicSoftly();

      // rayakan verifikasi berhasil: confetti + buket bunga muncul sebentar
      var bouquet = document.getElementById('bouquetPop');
      setTimeout(function(){
        fireConfetti();
        if (bouquet) bouquet.classList.add('show');
      }, 750);
      setTimeout(function(){
        fireConfetti();
      }, 1250);
      setTimeout(function(){
        if (bouquet) bouquet.classList.remove('show');
      }, 3200);
    } else if (name.length > 0 && FULL_NAME.indexOf(name) === 0){
      // nama yang diketik cocok sebagai awalan nama lengkap, tapi belum selesai
      // (mis. cuma "keysha" atau "keysha aulia") -> tegur lembut, bukan diusir
      showOverlay(incompleteOverlay, incompleteTimer, function(t){ incompleteTimer = t; });
    } else {
      // sama sekali bukan namanya -> popup "kamu siapa"
      showOverlay(errorOverlay, errorTimer, function(t){ errorTimer = t; });
    }
  });
})();

// Kuis "Apakah kamu sayang aku?" -> pindah ke halaman utama dengan transisi tirai
(function initQuiz(){
  var yes = document.getElementById('btnYes');
  var no = document.getElementById('btnNo');
  var back = document.getElementById('btnBack');
  var revealNo = document.getElementById('revealNo');
  var pageTanya = document.getElementById('pageTanya');
  var pageMain = document.getElementById('pageMain');

  yes.addEventListener('click', function(){
    goToPage(pageTanya, pageMain);

    // surat semangat otomatis terbuka begitu sampai di halaman ini,
    // masih bisa dibuka ulang lewat amplop di atas kapan saja
    setTimeout(function(){
      openEnvelopeSheet();
    }, 1900);
  });

  back.addEventListener('click', function(){
    goToPage(pageMain, pageTanya);
    revealNo.classList.remove('show');
  });

  var grumpy = document.getElementById('grumpyOverlay');
  var grumpyTimer = null;

  no.addEventListener('click', function(){
    revealNo.classList.add('show');

    // tampilkan ekspresi kesal selama 2 detik
    clearTimeout(grumpyTimer);
    grumpy.classList.add('show');
    grumpyTimer = setTimeout(function(){
      grumpy.classList.remove('show');
    }, 2000);
  });
})();

// Galeri -> klik foto untuk lihat versi penuh (lightbox)
(function initLightbox(){
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxCaption = document.getElementById('lightboxCaption');
  var closeBtn = document.getElementById('lightboxClose');
  if (!lightbox || !lightboxImg) return;

  function openLightbox(src, caption){
    lightboxImg.src = src;
    lightboxImg.alt = caption || '';
    if (lightboxCaption) lightboxCaption.textContent = caption || '';
    lightbox.classList.add('show');
  }
  function closeLightbox(){
    lightbox.classList.remove('show');
  }

  // Delegasi klik: menangkap klik pada foto mana pun di galeri, termasuk
  // yang ditambahkan atau dimuat belakangan.
  document.addEventListener('click', function(e){
    var btn = e.target.closest ? e.target.closest('.photo-btn') : null;
    if (btn){
      e.preventDefault();
      openLightbox(btn.getAttribute('data-full'), btn.getAttribute('data-caption'));
      return;
    }
    if (e.target === closeBtn || (closeBtn && closeBtn.contains(e.target))){
      closeLightbox();
      return;
    }
    if (e.target === lightbox){
      closeLightbox();
    }
  });

  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') closeLightbox();
  });
})();

// Tombol "Kejutan" -> pesan manis acak tiap diklik
(function initSurprise(){
  var btn = document.getElementById('btnSurprise');
  var quoteEl = document.getElementById('surpriseQuote');
  if (!btn || !quoteEl) return;

  var quotes = [
    'Senyum kamu itu obat capek paling manjur buat aku.',
    'Sejauh apapun kamu belajar bahasa Jepang, hatiku tetap paling gampang kamu baca.',
    'Kamu itu paket lengkap: lucu, ceria, dan bikin kangen tiap detik.',
    'Ganbatte hari ini juga, aku selalu di belakangmu, bukan di belakang punggungmu doang 😆',
    'Kalau kangen jadi mata uang, aku udah jadi jutawan gara-gara kamu.',
    'Terima kasih sudah selalu ceria, itu salah satu alasan aku betah di dekat kamu.',
    'Semoga hari kamu secerah senyum yang selalu kamu kasih ke aku.',
    'Belajar boleh pelan-pelan, tapi sayang aku ke kamu jalan terus tanpa jeda.',
    'Kamu nggak perlu sempurna, karena buat aku kamu udah cukup lebih dari cukup.',
    'Satu hal yang aku yakin banget: aku pilih kamu, hari ini dan besok-besok.'
  ];
  var lastIndex = -1;

  btn.addEventListener('click', function(){
    var index;
    do {
      index = Math.floor(Math.random() * quotes.length);
    } while (index === lastIndex && quotes.length > 1);
    lastIndex = index;

    quoteEl.textContent = quotes[index];
    quoteEl.classList.remove('pop');
    void quoteEl.offsetWidth;
    quoteEl.classList.add('pop');
  });
})();

// Amplop yang menggantung -> ditarik turun dulu, baru surat pesan semangat terbuka
var openEnvelopeSheet = function(){};
(function initEnvelope(){
  var hang = document.querySelector('.envelope-hang');
  var envelope = document.getElementById('envelopeBtn');
  var sheet = document.getElementById('sheetSemangat');
  var backdrop = document.getElementById('sheetBackdrop');
  var closeBtn = document.getElementById('sheetClose');
  var busy = false;

  function openSheet(){
    if (busy || sheet.classList.contains('open')) return;
    busy = true;
    envelope.setAttribute('aria-expanded', 'true');

    // 1) amplop tertarik turun, secarik pesan kecil ikut tertarik keluar
    hang.classList.add('pulling');
    backdrop.classList.add('show');

    // 2) pesan kecil itu "berubah" jadi surat penuh di tengah layar
    setTimeout(function(){
      sheet.classList.add('open');
    }, 380);

    // 3) amplop kembali ke posisi semula, siap dipakai lagi
    setTimeout(function(){
      hang.classList.remove('pulling');
      busy = false;
    }, 620);
  }

  function closeSheet(){
    sheet.classList.remove('open');
    backdrop.classList.remove('show');
    envelope.setAttribute('aria-expanded', 'false');
  }

  envelope.addEventListener('click', openSheet);
  closeBtn.addEventListener('click', closeSheet);
  backdrop.addEventListener('click', closeSheet);

  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') closeSheet();
  });

  openEnvelopeSheet = openSheet;
})();
