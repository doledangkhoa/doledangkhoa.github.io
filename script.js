(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = window.matchMedia('(max-width: 800px)').matches;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.6);
  const controllers = [];

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  // Progressive enhancement: portfolio content must stay visible even if WebGL/3D fails.
  function setupReveal() {
    const elements = [...document.querySelectorAll('.reveal')];
    if (!elements.length) return;

    if (reducedMotion || !('IntersectionObserver' in window)) {
      elements.forEach(el => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08 });

    elements.forEach(el => observer.observe(el));

    // Safety net: never leave content permanently invisible because of a browser quirk.
    setTimeout(() => {
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 1.25) el.classList.add('visible');
      });
    }, 900);
  }

  setupReveal();

  function makeRenderer(canvas) {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !mobile,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(pixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setClearColor(0x000000, 0);
    return renderer;
  }

  function fitRenderer(renderer, camera, canvas) {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    const targetW = Math.floor(width * pixelRatio);
    const targetH = Math.floor(height * pixelRatio);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }

  function addStandardLights(scene, keyColor = 0xffffff) {
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c1d8, 1.5));
    const key = new THREE.DirectionalLight(keyColor, 2.1);
    key.position.set(4, 5, 7);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x7281ff, 1.1);
    rim.position.set(-5, 1, -3);
    scene.add(rim);
  }

  function pointsCloud(count, radius, color, size = .035) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const b = Math.acos(2 * Math.random() - 1);
      const r = radius * (.55 + Math.random() * .45);
      positions[i * 3] = r * Math.sin(b) * Math.cos(a);
      positions[i * 3 + 1] = r * Math.cos(b);
      positions[i * 3 + 2] = r * Math.sin(b) * Math.sin(a);
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return new THREE.Points(geometry, new THREE.PointsMaterial({ color, size, transparent: true, opacity: .72, depthWrite: false }));
  }

  function createHeroScene(canvas) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
    camera.position.set(0, .1, 8.3);
    const renderer = makeRenderer(canvas);
    addStandardLights(scene);

    const group = new THREE.Group();
    scene.add(group);

    const sphereGeo = new THREE.SphereGeometry(1.16, mobile ? 24 : 32, mobile ? 16 : 24);
    const heroBall = new THREE.Mesh(sphereGeo, new THREE.MeshStandardMaterial({ color: 0xc9ecff, roughness: .18, metalness: .02 }));
    heroBall.position.y = .14;
    group.add(heroBall);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.34, .085, 12, 48),
      new THREE.MeshStandardMaterial({ color: 0x5567f0, roughness: .22, metalness: .06 })
    );
    ring.rotation.set(.86, .22, .32);
    ring.position.y = .14;
    group.add(ring);

    const mintRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.63, .025, 8, 48),
      new THREE.MeshBasicMaterial({ color: 0x42d79c, transparent: true, opacity: .48 })
    );
    mintRing.rotation.set(1.12, -.35, .2);
    group.add(mintRing);

    const boxGeo = new THREE.BoxGeometry(.62, .62, .62);
    const boxMaterials = [0xffcf79, 0xc6b9ff, 0x9fe5ff, 0xffb9cc].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: .24 }));
    const boxes = [
      [-1.82, 1.22, .2], [1.82, 1.2, .08], [2.02, -1.24, .2], [-1.92, -1.3, .1]
    ].map((pos, i) => {
      const m = new THREE.Mesh(boxGeo, boxMaterials[i]);
      m.position.set(...pos); m.rotation.set(.4, .5, .2);
      group.add(m); return m;
    });

    // Small Poké Ball orbiting the main hero object.
    const poke = new THREE.Group();
    const top = new THREE.Mesh(new THREE.SphereGeometry(.3, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xef5669, roughness: .25 }));
    const bottom = new THREE.Mesh(new THREE.SphereGeometry(.3, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .28 }));
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(.302, .035, 8, 28), new THREE.MeshStandardMaterial({ color: 0x202536, roughness: .3 }));
    const button = new THREE.Mesh(new THREE.CylinderGeometry(.085, .085, .035, 18), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .2 }));
    button.rotation.x = Math.PI / 2; button.position.z = .305;
    poke.add(top, bottom, stripe, button); group.add(poke);

    const particles = pointsCloud(mobile ? 36 : 56, 2.75, 0x7180f4, .028);
    group.add(particles);

    let pointerX = 0, pointerY = 0, smoothX = 0, smoothY = 0;
    const onPointer = e => {
      pointerX = (e.clientX / innerWidth - .5) * .7;
      pointerY = (e.clientY / innerHeight - .5) * .4;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    return {
      canvas, scene, camera, renderer, active: true,
      update(t) {
        smoothX += (pointerX - smoothX) * .035;
        smoothY += (pointerY - smoothY) * .035;
        group.rotation.y = smoothX + Math.sin(t * .34) * .07;
        group.rotation.x = -smoothY * .35 + Math.cos(t * .29) * .045;
        group.position.y = Math.sin(t * .68) * .085;
        ring.rotation.z = .32 + t * .12;
        mintRing.rotation.z = .2 - t * .08;
        particles.rotation.y = -t * .055;
        boxes.forEach((b, i) => {
          b.rotation.x += .0015 + i * .00015;
          b.rotation.y += .0022 + i * .00012;
          b.position.y += Math.sin(t * 1.15 + i * 1.7) * .0009;
        });
        const a = t * .72;
        poke.position.set(Math.cos(a) * 2.2, Math.sin(a * 1.35) * .75, Math.sin(a) * .55);
        poke.rotation.y = -a * 1.2;
        poke.rotation.z = Math.sin(t * 1.4) * .18;
      }
    };
  }

  function createPokeballScene(canvas) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(33, 1, .1, 50);
    camera.position.set(0, .15, 6.2);
    const renderer = makeRenderer(canvas);
    addStandardLights(scene, 0xffffff);

    const root = new THREE.Group();
    root.rotation.x = -.08;
    scene.add(root);

    const topMat = new THREE.MeshStandardMaterial({ color: 0xef5669, roughness: .2, metalness: .02 });
    const bottomMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .2 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x202637, roughness: .26 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .13 });
    const top = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2), topMat);
    const bottom = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), bottomMat);
    const band = new THREE.Mesh(new THREE.TorusGeometry(1.205, .105, 12, 48), darkMat);
    const outerButton = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .12, 24), darkMat);
    outerButton.rotation.x = Math.PI / 2; outerButton.position.z = 1.15;
    const innerButton = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .13, 24), whiteMat);
    innerButton.rotation.x = Math.PI / 2; innerButton.position.z = 1.22;
    root.add(top, bottom, band, outerButton, innerButton);

    const halo = new THREE.Mesh(new THREE.TorusGeometry(1.65, .022, 8, 64), new THREE.MeshBasicMaterial({ color: 0x5567f0, transparent: true, opacity: .52 }));
    halo.rotation.set(1.04, .28, .1); root.add(halo);
    const halo2 = new THREE.Mesh(new THREE.TorusGeometry(1.9, .015, 8, 64), new THREE.MeshBasicMaterial({ color: 0x42d79c, transparent: true, opacity: .42 }));
    halo2.rotation.set(.66, -.44, -.2); root.add(halo2);

    const particles = pointsCloud(mobile ? 34 : 50, 2.15, 0x5b6ff2, .027); root.add(particles);
    const satellites = [];
    const satGeo = new THREE.SphereGeometry(.08, 10, 8);
    [0xffd84d, 0x42d79c, 0x7d8cff].forEach((color, i) => {
      const sat = new THREE.Mesh(satGeo, new THREE.MeshBasicMaterial({ color }));
      root.add(sat); satellites.push(sat);
    });

    return {
      canvas, scene, camera, renderer, active: false,
      update(t) {
        root.position.y = Math.sin(t * 1.35) * .12;
        root.rotation.y = Math.sin(t * .65) * .22 + t * .09;
        root.rotation.z = Math.sin(t * .7) * .035;
        halo.rotation.z = t * .35;
        halo2.rotation.z = -t * .22;
        particles.rotation.y = t * .12;
        particles.rotation.x = Math.sin(t * .35) * .08;
        satellites.forEach((sat, i) => {
          const a = t * (.9 + i * .12) + i * Math.PI * .66;
          sat.position.set(Math.cos(a) * (1.55 + i * .18), Math.sin(a * 1.4) * .55, Math.sin(a) * .62);
          sat.scale.setScalar(.75 + Math.sin(t * 2 + i) * .18);
        });
        const pulse = 1 + Math.sin(t * 2.3) * .025;
        innerButton.scale.set(pulse, pulse, pulse);
      }
    };
  }

  function createPikachuScene(canvas) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 50);
    camera.position.set(0, .15, 7.1);
    const renderer = makeRenderer(canvas);
    addStandardLights(scene, 0xfff4c4);

    const root = new THREE.Group();
    root.position.y = -.2;
    scene.add(root);

    const yellow = new THREE.MeshStandardMaterial({ color: 0xffd84d, roughness: .42 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x272536, roughness: .4 });
    const red = new THREE.MeshStandardMaterial({ color: 0xef5c66, roughness: .35 });
    const brown = new THREE.MeshStandardMaterial({ color: 0xa96a35, roughness: .45 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(.72, 24, 18), yellow);
    body.scale.set(.9, 1.12, .82); body.position.y = -.45; root.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.88, 28, 20), yellow);
    head.scale.set(1.06, .95, .96); head.position.y = .63; root.add(head);

    function ear(x, rot) {
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.ConeGeometry(.22, 1.2, 12), yellow);
      base.position.y = .48;
      const tip = new THREE.Mesh(new THREE.ConeGeometry(.17, .42, 12), dark);
      tip.position.y = .92;
      g.add(base, tip); g.position.set(x, 1.22, -.02); g.rotation.z = rot; root.add(g); return g;
    }
    const earL = ear(-.48, .23), earR = ear(.48, -.23);

    const eyeGeo = new THREE.SphereGeometry(.075, 12, 10);
    const eyeL = new THREE.Mesh(eyeGeo, dark), eyeR = new THREE.Mesh(eyeGeo, dark);
    eyeL.position.set(-.29,.72,.82); eyeR.position.set(.29,.72,.82); root.add(eyeL,eyeR);
    const cheekGeo = new THREE.SphereGeometry(.13, 12, 10);
    const cheekL = new THREE.Mesh(cheekGeo, red), cheekR = new THREE.Mesh(cheekGeo, red);
    cheekL.position.set(-.59,.48,.72); cheekR.position.set(.59,.48,.72); root.add(cheekL,cheekR);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), dark); nose.position.set(0,.56,.88); root.add(nose);

    const armGeo = THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(.11,.48,4,8) : new THREE.CylinderGeometry(.11,.11,.58,10);
    const armL = new THREE.Mesh(armGeo, yellow), armR = new THREE.Mesh(armGeo, yellow);
    armL.position.set(-.58,-.22,.2); armR.position.set(.58,-.22,.2); armL.rotation.z=-.55; armR.rotation.z=.55; root.add(armL,armR);
    const footGeo = new THREE.SphereGeometry(.22, 12, 10);
    const footL = new THREE.Mesh(footGeo, yellow), footR = new THREE.Mesh(footGeo, yellow);
    footL.scale.set(1.3,.65,.8); footR.scale.set(1.3,.65,.8); footL.position.set(-.32,-1.08,.15); footR.position.set(.32,-1.08,.15); root.add(footL,footR);

    // Zig-zag lightning tail using three simple box segments.
    const tail = new THREE.Group();
    const tailGeo = new THREE.BoxGeometry(.25,.65,.12);
    [[0,0,0,-.6],[.22,.46,0,.55],[.03,.93,0,-.55]].forEach(([x,y,z,rz],i)=>{
      const seg = new THREE.Mesh(tailGeo, i===0 ? brown : yellow); seg.position.set(x,y,z); seg.rotation.z=rz; tail.add(seg);
    });
    tail.position.set(.84,-.52,-.15); tail.rotation.y=-.25; root.add(tail);

    const particles = pointsCloud(mobile ? 28 : 44, 2.1, 0xffffff, .03); root.add(particles);
    const energyRing = new THREE.Mesh(new THREE.TorusGeometry(1.58,.022,8,60),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.55}));
    energyRing.rotation.x=1.1; root.add(energyRing);

    return {
      canvas, scene, camera, renderer, active: false,
      update(t) {
        root.position.y = -.2 + Math.sin(t * 2.1) * .07;
        root.rotation.y = Math.sin(t * .72) * .2;
        head.rotation.z = Math.sin(t * 1.5) * .025;
        body.scale.y = 1.12 + Math.sin(t * 2.1) * .015;
        earL.rotation.z = .23 + Math.sin(t * 2.25) * .08;
        earR.rotation.z = -.23 - Math.sin(t * 2.05 + .7) * .08;
        armL.rotation.z = -.55 + Math.sin(t * 2) * .08;
        armR.rotation.z = .55 - Math.sin(t * 2 + .5) * .08;
        tail.rotation.z = Math.sin(t * 3.1) * .18;
        tail.rotation.y = -.25 + Math.sin(t * 2.4) * .12;
        energyRing.rotation.z = t * .42;
        particles.rotation.y = -t * .16;
        // Soft blink every few seconds.
        const blinkPhase = t % 4.6;
        const eyeScale = blinkPhase > 4.35 ? clamp((4.6 - blinkPhase) * 8, .06, 1) : 1;
        eyeL.scale.y = eyeScale; eyeR.scale.y = eyeScale;
        const cheekPulse = 1 + Math.sin(t * 2.7) * .05;
        cheekL.scale.setScalar(cheekPulse); cheekR.scale.setScalar(cheekPulse);
      }
    };
  }

  if (window.THREE) {
    const safeCreate = (factory, canvas) => {
      try {
        controllers.push(factory(canvas));
      } catch (error) {
        console.warn('3D scene disabled; the rest of the page will continue normally.', error);
        canvas.classList.add('scene-unavailable');
      }
    };

    const heroCanvas = document.querySelector('#scene');
    if (heroCanvas) safeCreate(createHeroScene, heroCanvas);
    document.querySelectorAll('.mini-scene').forEach(canvas => {
      const type = canvas.dataset.scene;
      if (type === 'pokeball') safeCreate(createPokeballScene, canvas);
      if (type === 'pikachu') safeCreate(createPikachuScene, canvas);
    });
  } else {
    document.querySelectorAll('canvas').forEach(canvas => canvas.classList.add('scene-unavailable'));
    console.warn('Three.js did not load; showing the portfolio without WebGL effects.');
  }

  if ('IntersectionObserver' in window) {
    const canvasObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const controller = controllers.find(c => c.canvas === entry.target);
        if (controller) controller.active = entry.isIntersecting;
      });
    }, { rootMargin: '180px 0px', threshold: .01 });
    controllers.forEach(c => canvasObserver.observe(c.canvas));
  } else {
    controllers.forEach(c => { c.active = true; });
  }

  let last = performance.now();
  function renderLoop(now) {
    requestAnimationFrame(renderLoop);
    if (document.hidden) return;
    const t = now / 1000;
    const dt = now - last;
    last = now;
    // Avoid catching up huge animation deltas after tab switching.
    if (dt > 120) return;
    controllers.forEach(controller => {
      if (!controller.active) return;
      fitRenderer(controller.renderer, controller.camera, controller.canvas);
      if (!reducedMotion) controller.update(t);
      controller.renderer.render(controller.scene, controller.camera);
    });
  }
  requestAnimationFrame(renderLoop);

  // Lightweight perspective tilt: no external animation framework needed.
  if (!reducedMotion && !mobile) {
    document.querySelectorAll('[data-tilt-card]').forEach(card => {
      let raf = 0;
      card.addEventListener('pointermove', e => {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - .5;
          const y = (e.clientY - rect.top) / rect.height - .5;
          const strength = card.classList.contains('project') ? 5.5 : 2.8;
          card.style.transform = `perspective(1000px) rotateX(${(-y * strength).toFixed(2)}deg) rotateY(${(x * strength).toFixed(2)}deg) translateY(-2px)`;
        });
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        if (raf) cancelAnimationFrame(raf);
        card.style.transition = 'transform .45s cubic-bezier(.2,.8,.2,1), box-shadow .32s, border-color .32s';
        card.style.transform = '';
        setTimeout(() => { card.style.transition = ''; }, 460);
      });
    });
  }

  // Cursor glow is intentionally CSS-only and updated with one RAF.
  const glow = document.querySelector('.cursor-glow');
  if (glow && !mobile && !reducedMotion) {
    let gx = innerWidth * .75, gy = innerHeight * .25, tx = gx, ty = gy;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const moveGlow = () => {
      gx += (tx - gx) * .11; gy += (ty - gy) * .11;
      glow.style.transform = `translate3d(${gx - 140}px,${gy - 140}px,0)`;
      requestAnimationFrame(moveGlow);
    };
    requestAnimationFrame(moveGlow);
  }
})();
