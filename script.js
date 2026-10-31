/* Ratnesh Mishra — portfolio interactions */
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------
     1. Hero: simply supported beam with a movable point load.
        Real statics: R_A = P·b/L, R_B = P·a/L, M_max = P·a·b/L.
        Deflection uses the standard elastic-curve formula, scaled
        relative to the mid-span case so it shrinks near supports.
     --------------------------------------------------------------- */
  const svg = document.getElementById("beam-svg");
  if (svg) {
    const X0 = 80, X1 = 720, SPAN_PX = X1 - X0;
    const L = 8, P = 100;             // metres, kN
    const BEAM_Y = 131;               // beam centreline
    const BMD_Y = 276, BMD_MAX_PX = 80;
    const DEFL_MAX_PX = 30;
    const $ = (id) => document.getElementById(id);
    const load = $("load"), deflect = $("deflect"), bmd = $("bmd");
    const dimA = $("dim-a"), dimATxt = $("dim-a-txt");
    const ra = $("ra"), rb = $("rb"), mmax = $("mmax"), drop = $("bmd-drop");

    // normalised elastic curve (P = L = EI = 1); t = a/L
    const yAt = (x, t) => {
      const a = t, b = 1 - t;
      return x <= a
        ? (b * x * (1 - b * b - x * x)) / 6
        : (a * (1 - x) * (1 - a * a - (1 - x) * (1 - x))) / 6;
    };
    const Y_MID_MAX = 1 / 48;

    const fmt = (n) => n.toFixed(1);
    const setSub = (el, label, value) => {
      el.innerHTML = `R<tspan baseline-shift="sub" font-size="9">${label}</tspan> = ${fmt(value)} kN`;
    };

    let current = 0.5, target = 0.5, userActive = false, idleT = 0, lastInput = 0;

    function render(t) {
      const xPx = X0 + t * SPAN_PX;
      const aM = t * L, bM = L - aM;

      load.setAttribute("transform", `translate(${xPx} 0)`);
      const loadText = load.querySelector("text");
      const flip = t > 0.78;
      loadText.setAttribute("x", flip ? -10 : 10);
      loadText.setAttribute("text-anchor", flip ? "end" : "start");

      dimA.setAttribute("x2", xPx);
      dimATxt.setAttribute("x", (X0 + xPx) / 2);
      dimATxt.textContent = `a = ${aM.toFixed(2)} m`;
      dimATxt.style.opacity = t < 0.14 ? 0 : 1;

      // deflected shape
      let d = "";
      for (let i = 0; i <= 64; i++) {
        const x = i / 64;
        const y = BEAM_Y + (yAt(x, t) / Y_MID_MAX) * DEFL_MAX_PX + 8;
        d += `${i ? "L" : "M"}${(X0 + x * SPAN_PX).toFixed(1)} ${y.toFixed(1)}`;
      }
      deflect.setAttribute("d", d);

      // reactions + bending moment
      const RA = (P * bM) / L, RB = (P * aM) / L, M = (P * aM * bM) / L;
      setSub(ra, "A", RA);
      setSub(rb, "B", RB);
      const mPx = (M / (P * L / 4)) * BMD_MAX_PX;
      bmd.setAttribute("d", `M${X0} ${BMD_Y} L${xPx} ${BMD_Y + mPx} L${X1} ${BMD_Y} Z`);
      drop.setAttribute("x1", xPx); drop.setAttribute("x2", xPx);
      drop.setAttribute("y1", 140); drop.setAttribute("y2", BMD_Y + mPx);
      mmax.setAttribute("x", Math.min(Math.max(xPx, 150), 650));
      mmax.setAttribute("y", BMD_Y + mPx + 20);
      mmax.textContent = `Mmax = ${fmt(M)} kN·m`;
    }

    function toT(clientX) {
      const r = svg.getBoundingClientRect();
      const x = ((clientX - r.left) / r.width) * 800;
      return Math.min(Math.max((x - X0) / SPAN_PX, 0.04), 0.96);
    }
    const onMove = (e) => { userActive = true; lastInput = performance.now(); target = toT(e.clientX); };
    svg.addEventListener("pointermove", onMove);
    svg.addEventListener("pointerdown", onMove);
    svg.addEventListener("pointerleave", () => { userActive = false; });

    function tick(now) {
      if (!userActive && now - lastInput > 1600 && !reduceMotion) {
        idleT += 0.006;
        target = 0.5 + Math.sin(idleT) * 0.32;   // gentle idle sweep
      }
      current += (target - current) * 0.12;
      render(current);
      requestAnimationFrame(tick);
    }
    render(current);
    if (!reduceMotion) requestAnimationFrame(tick);
    else svg.addEventListener("pointermove", () => render(target));
  }

  /* ---------------------------------------------------------------
     2. Scroll: reveal blocks, track current sheet in the top bar.
     --------------------------------------------------------------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    reveals.forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 70}ms`; io.observe(el); });

    const indicator = document.getElementById("sheet-indicator");
    const navLinks = [...document.querySelectorAll(".nav a")];
    const sections = document.querySelectorAll("section[data-sheet]");
    const so = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const n = e.target.dataset.sheet;
        indicator.textContent = `SHT ${n} / 03`;
        navLinks.forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === `#${e.target.id}`));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => so.observe(s));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  const date = document.getElementById("tb-date");
  if (date) {
    const d = new Date();
    date.textContent = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  }
})();
