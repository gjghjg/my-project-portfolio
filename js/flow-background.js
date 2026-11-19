/**
 * 粒子流动背景（Flow Field）
 * ==========================
 * 原理（适合初学者理解）：
 * 1. 在屏幕上撒很多小粒子；
 * 2. 每一帧，根据粒子所在的位置，用一个「流场函数」算出它该往哪个方向移动
 *    （这里用 sin/cos 组合出平滑变化的方向场，数学上近似噪声的效果）；
 * 3. 粒子移动时画出细小的线段，并用半透明背景色覆盖上一帧，形成拖尾；
 * 4. 粒子跑出屏幕就随机重生，动画就永远流动下去。
 *
 * 性能优化（2026-11-12）：
 * - 页面切到后台时自动暂停动画，回到前台再恢复（省 CPU / 省电）；
 * - 小屏设备自动减少粒子数量（手机 <300、平板 <600、桌面 900）；
 * - 在网址后加 ?debug（如 http://localhost:7100/?debug）可显示实时帧率。
 *
 * 性能优化（2026-11-18）：
 * - resize 事件加防抖：拖动窗口时连续触发的 resize 合并为一次重建粒子；
 * - 主题颜色缓存：不再每帧调用 getComputedStyle，只在主题切换时重新读取。
 *
 * 想改效果？试试调整下面的 CONFIG 里的参数。
 */

const CONFIG = {
  particleCount: 900, // 桌面端粒子数量：越多越密集，也越耗性能
  speed: 0.6, // 粒子移动速度
  scale: 0.0022, // 流场的「缩放」：越小，流向变化越平缓、流线越长
  lineWidth: 0.8, // 粒子轨迹粗细
  fadeAlpha: 0.06, // 每帧覆盖的透明度：越小拖尾越长
  timeSpeed: 0.00035, // 流场随时间变化的速度
};

/** 根据屏幕宽度决定粒子数量：小屏设备性能弱，少画一些。 */
export function responsiveParticleCount(width) {
  if (width < 600) return 300;
  if (width < 1024) return 600;
  return CONFIG.particleCount;
}

/** 防抖：连续触发时只执行最后一次，wait 毫秒内的重复调用会被合并。 */
export function debounce(fn, wait = 150) {
  let timer = null;
  return (...args) => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, wait);
  };
}

export function startFlowBackground(canvas) {
  const ctx = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const debug = new URLSearchParams(window.location.search).has("debug");
  let particles = [];
  let width = 0;
  let height = 0;
  let animationId = null;
  let time = 0;

  // ---------- 帧率显示（仅 ?debug 模式） ----------
  let fpsEl = null;
  let frames = 0;
  let fpsTimer = null;
  if (debug) {
    fpsEl = document.createElement("div");
    fpsEl.id = "fps-meter";
    fpsEl.style.cssText =
      "position:fixed;right:24px;top:24px;z-index:9;font:12px monospace;" +
      "padding:4px 8px;border:1px solid currentColor;opacity:0.7";
    document.body.appendChild(fpsEl);
  }

  function updateFps() {
    if (!fpsEl) return;
    // animationId 为 null 表示动画暂停中
    const fps = animationId === null ? 0 : frames;
    fpsEl.textContent = `${fps} FPS · ${particles.length} 粒子`;
    frames = 0;
  }

  /** 读取当前主题的背景色和粒子颜色（跟随 LIGHT / DARK 切换）。 */
  function themeColors() {
    const style = getComputedStyle(document.documentElement);
    return {
      bg: style.getPropertyValue("--color-bg").trim(),
      particle: style.getPropertyValue("--particle-color").trim(),
    };
  }

  // 主题颜色缓存：getComputedStyle 有开销，不每帧读，
  // 只在初始化、主题切换（data-theme 属性变化）时更新。
  let colors = themeColors();

  function paintBackground() {
    ctx.globalAlpha = 1;
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);
  }

  new MutationObserver(() => {
    colors = themeColors();
    // 减少动态效果时没有下一帧动画来覆盖旧颜色，需要立即重绘画布。
    if (reducedMotion.matches) paintBackground();
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  function randomParticle() {
    return { x: Math.random() * width, y: Math.random() * height };
  }

  function resize() {
    // 处理高分屏，避免粒子模糊
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // 重置画布和粒子（数量随屏幕宽度自适应）
    paintBackground();
    particles = Array.from(
      { length: responsiveParticleCount(width) },
      randomParticle
    );
  }

  /** 流场函数：返回 (x, y) 处粒子的运动方向（弧度）。 */
  function flowAngle(x, y, t) {
    return (
      Math.sin(x * CONFIG.scale + t) * 2 +
      Math.cos(y * CONFIG.scale - t * 0.7) * 2
    );
  }

  function tick() {
    const { bg, particle } = colors;

    // 半透明覆盖，形成拖尾
    ctx.fillStyle = bg;
    ctx.globalAlpha = CONFIG.fadeAlpha;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = `rgba(${particle}, 0.35)`;
    ctx.lineWidth = CONFIG.lineWidth;

    time += CONFIG.timeSpeed;

    for (const p of particles) {
      const angle = flowAngle(p.x, p.y, time);
      const nx = p.x + Math.cos(angle) * CONFIG.speed;
      const ny = p.y + Math.sin(angle) * CONFIG.speed;

      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      p.x = nx;
      p.y = ny;

      // 跑出屏幕的粒子随机重生
      if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
        Object.assign(p, randomParticle());
      }
    }

    frames++;
    animationId = requestAnimationFrame(tick);
  }

  function start() {
    if (animationId === null && !reducedMotion.matches && !document.hidden) {
      animationId = requestAnimationFrame(tick);
    }
    if (debug && fpsTimer === null) {
      fpsTimer = setInterval(updateFps, 1000);
      updateFps();
    }
  }

  function stop() {
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  // 页面切到后台时暂停、回到前台恢复
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  // 拖动窗口会连续触发 resize，防抖合并，避免反复重建全部粒子
  window.addEventListener("resize", debounce(resize, 150));
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) stop();
    else start();
  });

  resize(); // 初始化一次；之后 start() 只负责启动动画，不再重置粒子
  start();
}
