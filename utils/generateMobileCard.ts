export const generateMobileCard = (config: any, photos: any[]) => {
  const jsonData = JSON.stringify({ config, photos });

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>${config.coverTitle} - 專屬回憶</title>
  <meta name="theme-color" content="#fff1f2">
  <link href="https://fonts.googleapis.com/css2?family=Long+Cang&family=Ma+Shan+Zheng&family=Noto+Sans+TC:wght@400;700&family=Noto+Serif+TC:wght@400;700&family=Zhi+Mang+Xing&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #f43f5e;
      --bg: #fff1f2;
    }
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body { 
      margin: 0; 
      padding: 0; 
      background: var(--bg);
      font-family: '${config.font}', 'Noto Serif TC', serif;
      width: 100vw;
      height: 100dvh; /* Mobile viewport height */
      overflow: hidden;
      display: flex;
      flex-direction: column; /* Corrected CSS */
      align-items: center;
      justify-content: center;
    }

    /* Main Container */
    .card-container {
      width: min(90vw, 500px);
      height: min(85dvh, 800px);
      background: white;
      border-radius: 24px;
      box-shadow: 0 10px 40px rgba(244, 63, 94, 0.2);
      position: relative;
      overflow: hidden;
      border: 1px solid #ffe4e6;
    }

    /* Pages Implementation - No 3D, just absolute positioning */
    .page-layer {
      position: absolute;
      top: 0; 
      left: 0;
      width: 100%;
      height: 100%;
      transition: opacity 0.4s ease, transform 0.4s ease;
      opacity: 0;
      pointer-events: none;
      z-index: 1;
      display: flex;
      flex-direction: column;
    }

    .page-layer.active {
      opacity: 1;
      pointer-events: auto;
      z-index: 10;
      transform: scale(1);
    }
    
    .page-layer.prev {
      transform: translateX(-20px);
    }
    .page-layer.next {
      transform: translateX(20px);
    }

    /* Cover Page */
    .cover-page {
      background: #f43f5e;
      color: white;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px;
    }
    
    .cover-heart {
      font-size: 80px;
      margin-bottom: 20px;
      animation: pulse 2s infinite;
    }

    /* Content Pages */
    .inner-page {
      background: white;
      padding: 24px;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    /* Components */
    .heart-frame {
      width: 180px;
      height: 180px;
      margin: 10px auto 20px;
      clip-path: path("M100,178 L88,167 C35,118.8 0,87.4 0,49.2 C0,18.2 24.2,0 55,0 C72.6,0 89.2,8.2 100,21.2 C110.8,8.2 127.4,0 145,0 C175.8,0 200,18.2 200,49.2 C200,87.4 165,118.8 112,167 L100,178 Z");
      background: #ffe4e6;
      img { width: 100%; height: 100%; object-fit: cover; }
    }

    .photo-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding-bottom: 60px; /* Space for nav */
    }

    .photo-item {
      position: relative;
      aspect-ratio: 1;
      border-radius: 16px;
      overflow: hidden;
      background: #eee;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    
    .photo-item.large {
      grid-column: span 2;
    }

    .photo-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .bubble {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(255,255,255,0.95);
      padding: 6px 10px;
      border-radius: 12px;
      font-size: 11px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      max-width: 85%;
      color: #333;
      font-weight: bold;
    }

    /* Text */
    .title { font-size: 26px; color: var(--primary); margin: 0 0 16px; font-family: 'Ma Shan Zheng', cursive; text-align: center; }
    .text { font-size: 17px; color: #4b5563; line-height: 1.8; white-space: pre-wrap; text-align: center; }

    /* Navigation */
    .nav-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 60px;
      background: rgb(255 255 255 / 90%);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      border-top: 1px solid #fb718520;
      z-index: 100;
    }

    .nav-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: #fff1f2;
      color: var(--primary);
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
      active: scale(0.95); /* Touch feedback */
    }

    .dots {
      display: flex;
      gap: 6px;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #fecdd3;
      transition: all 0.3s;
    }
    .dot.active { width: 24px; border-radius: 4px; background: var(--primary); }

    /* Animations */
    @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
    
    .start-btn {
      background: rgba(255,255,255,0.25);
      border: 2px solid white;
      padding: 12px 32px;
      border-radius: 50px;
      color: white;
      font-size: 18px;
      font-weight: bold;
      margin-top: 30px;
      cursor: pointer;
      backdrop-filter: blur(4px);
    }

  </style>
</head>
<body>

  <div class="card-container">
    
    <!-- Cover Layer -->
    <div class="page-layer cover-page active" id="page-0">
      <div class="cover-heart">♥</div>
      <h1 style="font-family: 'Ma Shan Zheng'; font-size: 36px; line-height: 1.4; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        ${config.coverTitle}
      </h1>
      <button class="start-btn" onclick="goToPage(1)" ontouchstart="goToPage(1)">
        點選開啟回憶 ›
      </button>
    </div>

    <!-- Page 1: Letter -->
    <div class="page-layer inner-page" id="page-1">
      <div class="heart-frame">
        ${photos[0].src ? `<img src="${photos[0].src}" style="transform: scale(${photos[0].zoom}) translate(${photos[0].x}px, ${photos[0].y}px)">` : ''}
      </div>
      <h2 class="title">致：${config.toName}</h2>
      <div style="flex:1; overflow-y: auto;">
        <p class="text">${config.intro}</p>
      </div>
    </div>

    <!-- Page 2: Photos -->
    <div class="page-layer inner-page" id="page-2">
      <div class="photo-grid">
        ${[1, 2, 3].map((i, idx) => `
          <div class="photo-item ${idx === 2 ? 'large' : ''}">
             ${photos[i].src ? `<img src="${photos[i].src}" style="transform: scale(${photos[i].zoom}) translate(${photos[i].x}px, ${photos[i].y}px)">` : ''}
             ${photos[i].caption ? `<div class="bubble">${photos[i].caption}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Page 3: Photos -->
    <div class="page-layer inner-page" id="page-3">
      <div class="photo-grid">
         ${[4, 5, 6].map((i, idx) => `
          <div class="photo-item ${idx === 2 ? 'large' : ''}">
             ${photos[i].src ? `<img src="${photos[i].src}" style="transform: scale(${photos[i].zoom}) translate(${photos[i].x}px, ${photos[i].y}px)">` : ''}
             ${photos[i].caption ? `<div class="bubble">${photos[i].caption}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Navigation Bar (Hidden on Cover) -->
    <div class="nav-bar" id="nav-bar" style="display: none;">
      <button class="nav-btn" onclick="prevPage()" ontouchstart="prevPage()">‹</button>
      <div class="dots">
        <div class="dot" id="dot-1"></div>
        <div class="dot" id="dot-2"></div>
        <div class="dot" id="dot-3"></div>
      </div>
      <button class="nav-btn" onclick="nextPage()" ontouchstart="nextPage()">›</button>
    </div>

  </div>

  <script>
    let currentPage = 0;
    const totalPages = 4; // 0, 1, 2, 3

    function goToPage(n) {
      if (n < 0 || n >= totalPages) return;
      
      // Update Pages
      document.querySelectorAll('.page-layer').forEach((el, idx) => {
        el.classList.remove('active', 'prev', 'next');
        if (idx === n) el.classList.add('active');
        else if (idx < n) el.classList.add('prev');
        else el.classList.add('next');
      });

      // Update Nav
      const nav = document.getElementById('nav-bar');
      if (n === 0) {
        nav.style.display = 'none';
      } else {
        nav.style.display = 'flex';
        // Update dots (page 1 -> dot index 0)
        document.querySelectorAll('.dot').forEach((d, i) => {
          d.classList.toggle('active', i === n - 1);
        });
        
        // Hide buttons if at ends (relative to nav pages)
        const prevBtn = nav.querySelector('.nav-btn:first-child');
        const nextBtn = nav.querySelector('.nav-btn:last-child');
        
        prevBtn.style.visibility = n === 1 ? 'hidden' : 'visible';
        nextBtn.style.visibility = n === totalPages - 1 ? 'hidden' : 'visible';
      }

      currentPage = n;
    }

    function nextPage() { goToPage(currentPage + 1); }
    function prevPage() { goToPage(currentPage - 1); }

  </script>
</body>
</html>`;
};
