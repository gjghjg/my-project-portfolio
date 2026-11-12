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
 * 想改效果？试试调整下面的 CONFIG 里的参数。
 */

const CONFIG = {
  particleCount: 900, // 粒子数量：越多越密集，也越耗性能
  speed: 0.6, // 粒子移动速度
  scale: 0.0022, // 流场的「缩放」：越小，流向变化越平缓、流线越长
  lineWidth: 0.8, // 粒子轨迹粗细
  fadeAlpha: 0.06, // 每帧覆盖的透明度：越小拖尾越长
  timeSpeed: 0.00035, // 流场随时间变化的速度
};

export function startFlowBackground(canvas) {
  const ctx = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let particles = [];
  let width = 0;
  let height = 0;
  let animationId = null;
  let time = 0;

  /** 读取当前主题的背景色和粒子颜色（跟随 LIGHT / DARK 切换）。 */
  function themeColors() {
    const style = getComputedStyle(document.documentElement);
    return {
      bg: style.getPropertyValue("--color-bg").trim(),
      particle: style.getPropertyValue("--particle-color").trim(),
    };
  }

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
    // 重置画布和粒子
    ctx.fillStyle = themeColors().bg;
    ctx.fillRect(0, 0, width, height);
    particles = Array.from({ length: CONFIG.particleCount }, randomParticle);
  }

  /** 流场函数：返回 (x, y) 处粒子的运动方向（弧度）。 */
  function flowAngle(x, y, t) {
    return (
      Math.sin(x * CONFIG.scale + t) * 2 +
      Math.cos(y * CONFIG.scale - t * 0.7) * 2
    );
  }

  function tick() {
    const { bg, particle } = themeColors();

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

    animationId = requestAnimationFrame(tick);
  }

  function start() {
    if (animationId === null && !reducedMotion.matches) {
      resize();
      animationId = requestAnimationFrame(tick);
    }
  }

  function stop() {
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  window.addEventListener("resize", resize);
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) stop();
    else start();
  });

  start();
}
