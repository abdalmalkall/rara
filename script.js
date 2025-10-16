console.clear();

// ✅ تحميل المكتبات أولاً
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 5000);
camera.position.z = 700;

const renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    alpha: true,
    powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
document.body.appendChild(renderer.domElement);

// ✅ تحسين event listener لل resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        targets = computeTargets();
        buildParticles(); // إعادة بناء الجسيمات عند تغيير الحجم
    }, 250);
});

// ✅ ضبط عدد الجسيمات بناءً على قوة الجهاز
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const PARTICLE_COUNT = isMobile ? 1000 : 1600; // زيادة الجسيمات لوضوح أفضل
const COLOR = 0xee5282;
const particlesVerts = [];
let pointsMesh, positions;

function sampleTextPoints(text, w, h, step = 3, fontScale = 0.7) { // ✅ تقليل step وزيادة fontScale
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const octx = off.getContext('2d');
    octx.clearRect(0,0,w,h);
    octx.fillStyle = '#fff';
    const fontSize = Math.floor(h * fontScale);
    
    // ✅ استخدام خط أكثر وضوحاً
    octx.font = `bold ${fontSize}px 'Arial Black', 'Arial', sans-serif`;
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    
    // ✅ إضافة ظل للنص لمزيد من الوضوح
    octx.shadowColor = '#fff';
    octx.shadowBlur = 2;
    octx.fillText(text, w/2, h/2);
    octx.shadowBlur = 0;
    
    const img = octx.getImageData(0,0,w,h).data;
    const pts = [];
    for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
            const idx = (y * w + x) * 4;
            if (img[idx+3] > 100) pts.push({ x: x - w/2, y: h/2 - y }); // ✅ تقليل العتبة
        }
    }
    return pts;
}

function sampleHeartPoints(n) {
    const pts = [];
    for (let i = 0; i < n; i++) {
        const t = Math.random() * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
        pts.push({ x, y });
    }
    return pts;
}

function buildParticles() {
    if (pointsMesh) scene.remove(pointsMesh);
    particlesVerts.length = 0;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const vx = (Math.random() - 0.5) * window.innerWidth;
        const vy = (Math.random() - 0.5) * window.innerHeight;
        const vz = (Math.random() - 0.5) * 400;
        particlesVerts.push(new THREE.Vector3(vx, vy, vz));
    }

    positions = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        positions[i*3] = particlesVerts[i].x;
        positions[i*3+1] = particlesVerts[i].y;
        positions[i*3+2] = particlesVerts[i].z;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // ✅ زيادة حجم الجسيمات لوضوح أفضل
    const particleSize = isMobile ? 
        Math.max(2.0, (window.innerWidth / 800)) : 
        Math.max(2.8, (window.innerWidth / 700));
    
    const material = new THREE.PointsMaterial({
        size: particleSize,
        color: COLOR,
        transparent: true,
        opacity: 0.9, // ✅ زيادة الشفافية
        depthTest: false,
        blending: THREE.AdditiveBlending
    });

    pointsMesh = new THREE.Points(geometry, material);
    scene.add(pointsMesh);
}

function computeTargets() {
    const heartRaw = sampleHeartPoints(PARTICLE_COUNT);

    // ✅ تحسين التحجيم للوضوح
    let scaleFactor;
    if (window.innerWidth < 480) {
        scaleFactor = 0.5;
    } else if (window.innerWidth < 768) {
        scaleFactor = 0.7;
    } else if (window.innerWidth < 1024) {
        scaleFactor = 0.9;
    } else {
        scaleFactor = 1.3;
    }

    const scale = Math.min(window.innerWidth, window.innerHeight) / 30 * scaleFactor;

    const heartTargets = heartRaw.map(p => {
        return new THREE.Vector3(p.x * scale, p.y * scale - 60, (Math.random()-0.5)*40);
    });

    // ✅ تحسين أبعاد النص للوضوح
    const nameW = Math.max(320, Math.floor(window.innerWidth * 0.7));
    let nameH = Math.max(100, Math.floor(window.innerHeight * 0.2));
    const phraseW = Math.max(450, Math.floor(window.innerWidth * 0.9));
    let phraseH = Math.max(100, Math.floor(window.innerHeight * 0.18));

    if (window.innerWidth < 768) {
        nameH *= 0.7;
        phraseH *= 0.7;
    }

    // ✅ تحسين الخطوط للأحرف
    const nameRaw = sampleTextPoints('Rihan', nameW, nameH, isMobile ? 4 : 3, isMobile ? 0.75 : 0.85);
    const nameTargets = nameRaw.map(r => new THREE.Vector3(r.x, r.y - 10, (Math.random()-0.5)*20));

    // ✅ عرض العبارة على ثلاث أسطر: "I LOVE", ثم "YOU", ثم "RIAHNA" في الأسفل
    const phraseRawTop = sampleTextPoints('I LOVE', phraseW, phraseH, isMobile ? 4 : 3, isMobile ? 0.5 : 0.6);
    const phraseRawMid = sampleTextPoints('YOU', phraseW, phraseH, isMobile ? 4 : 3, isMobile ? 0.5 : 0.6);
    const phraseRawBottom = sampleTextPoints('RIAHNA', phraseW, phraseH, isMobile ? 4 : 3, isMobile ? 0.5 : 0.6);
    const lineGap = Math.max(60, Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.08));
    const phraseTargetsTop = phraseRawTop.map(r => new THREE.Vector3(r.x, r.y - 20 + lineGap, (Math.random()-0.5)*20));
    const phraseTargetsMid = phraseRawMid.map(r => new THREE.Vector3(r.x, r.y - 20, (Math.random()-0.5)*20));
    const phraseTargetsBottom = phraseRawBottom.map(r => new THREE.Vector3(r.x, r.y - 20 - lineGap, (Math.random()-0.5)*20));
    const phraseTargets = phraseTargetsTop.concat(phraseTargetsMid, phraseTargetsBottom);

    return { heartTargets, nameTargets, phraseTargets };
}

let targets = computeTargets();
let tl;

function startSequence() {
    if (tl) tl.kill();
    tl = gsap.timeline({ repeat: -1, repeatDelay: 0.8 });

    // ✅ تحسين التوقيتات
    const durations = {
        scatter: isMobile ? 0.7 : 1.0,
        heart: isMobile ? 1.8 : 2.5,
        explode: isMobile ? 0.3 : 0.5,
        name: isMobile ? 1.5 : 2.0,
        phrase: isMobile ? 1.8 : 2.2
    };

    // المشهد الأول: تشتت عشوائي
    tl.to(particlesVerts, {
        duration: durations.scatter,
        ease: "power1.out",
        onStart: () => {
            for (let v of particlesVerts) {
                v.x = (Math.random() - 0.5) * window.innerWidth;
                v.y = (Math.random() - 0.5) * window.innerHeight;
                v.z = (Math.random() - 0.5) * 400;
            }
        },
        onUpdate: updatePositions
    });

    tl.to({}, { duration: 0.3 });

    // المشهد الثاني: قلب
    tl.to(particlesVerts, {
        duration: durations.heart,
        ease: "power2.inOut",
        onStart: () => {
            for (let i=0;i<PARTICLE_COUNT;i++) {
                particlesVerts[i].target = targets.heartTargets[i % targets.heartTargets.length];
            }
        },
        onUpdate: moveToTargets
    });

    tl.to({}, { duration: 0.6 });

    // المشهد الثالث: انفجار
    tl.to(particlesVerts, {
        duration: durations.explode,
        ease: "power2.out",
        onStart: () => {
            for (let v of particlesVerts) {
                const ang = Math.random()*Math.PI*2;
                const dist = isMobile ? 120 + Math.random()*250 : 180 + Math.random()*350;
                v.target = new THREE.Vector3(v.x + Math.cos(ang)*dist, v.y + Math.sin(ang)*dist, (Math.random()-0.5)*300);
            }
        },
        onUpdate: moveToTargets
    });

    tl.to({}, { duration: 0.3 });

    // المشهد الرابع: اسم Rihan
    tl.to(particlesVerts, {
        duration: durations.name,
        ease: "power2.inOut",
        onStart: () => {
            for (let i=0;i<PARTICLE_COUNT;i++) {
                const t = targets.nameTargets[i % targets.nameTargets.length];
                particlesVerts[i].target = new THREE.Vector3(t.x, t.y - 30, t.z);
            }
        },
        onUpdate: moveToTargets
    });

    tl.to({}, { duration: 0.6 });

    // المشهد الخامس: جملة I LOVE YOU RIHAN
    tl.to(particlesVerts, {
        duration: durations.phrase,
        ease: "power2.inOut",
        onStart: () => {
            for (let i=0;i<PARTICLE_COUNT;i++) {
                const pt = targets.phraseTargets[i % targets.phraseTargets.length];
                particlesVerts[i].target = new THREE.Vector3(pt.x, pt.y - 30, pt.z);
            }
        },
        onUpdate: moveToTargets
    });

    tl.to({}, { duration: 1.0 });
}

function moveToTargets() {
    const speed = isMobile ? 0.08 : 0.1; // ✅ زيادة السرعة
    for (let i=0;i<PARTICLE_COUNT;i++) {
        const v = particlesVerts[i];
        if (!v.target) continue;
        v.x += (v.target.x - v.x) * speed;
        v.y += (v.target.y - v.y) * speed;
        v.z += (v.target.z - v.z) * speed;
        positions[i*3] = v.x;
        positions[i*3+1] = v.y;
        positions[i*3+2] = v.z;
    }
    pointsMesh.geometry.attributes.position.needsUpdate = true;
}

function updatePositions() {
    for (let i=0;i<PARTICLE_COUNT;i++) {
        positions[i*3] = particlesVerts[i].x;
        positions[i*3+1] = particlesVerts[i].y;
        positions[i*3+2] = particlesVerts[i].z;
    }
    pointsMesh.geometry.attributes.position.needsUpdate = true;
}

// ✅ إضافة CSS إضافي للوضوح
const style = document.createElement('style');
style.textContent = `
    body { 
        margin: 0; 
        overflow: hidden; 
        background: #000;
    }
    canvas { 
        display: block; 
    }
`;
document.head.appendChild(style);

// ✅ التهيئة
function init() {
    buildParticles();
    targets = computeTargets();
    startSequence();

    // ✅ تحسين الرسوم المتحركة للدوران
    gsap.to(scene.rotation, { 
        y: 0.2, 
        duration: isMobile ? 10 : 8, 
        repeat: -1, 
        yoyo: true, 
        ease: "sine.inOut" 
    });

    // ✅ إضافة تأثيرات إضافية
    gsap.to(pointsMesh.material, {
        opacity: 0.95,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    });
}

// ✅ دورة الرسوم المتحركة
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// ✅ تشغيل الموسيقى
function setupAudio() {
    const audio = document.getElementById('bgMusic');
    if (audio) {
        audio.volume = 0.5;
        
        const playAudio = () => {
            audio.play().catch(e => console.log('تشغيل الصوت فشل:', e));
        };
        
        document.addEventListener("click", playAudio, { once: true });
        document.addEventListener("touchstart", playAudio, { once: true });
        
        // تشغيل تلقائي بعد تحميل الصفحة
        window.addEventListener('load', () => {
            setTimeout(playAudio, 500);
        });
    }
}

// ✅ البدء
init();
animate();
setupAudio();