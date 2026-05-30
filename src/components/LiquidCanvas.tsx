import { useRef, useEffect } from 'react';

/** Water color: rgb(92, 176, 203) = #5CB0CB */
const WR = 92;
const WG = 176;
const WB = 203;

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  opacity: number;
  lineWidth: number;
}

interface InkBlob {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  maxOpacity: number;
  growSpeed: number;
  fadeSpeed: number;
  driftX: number;
  driftY: number;
  seed: number;
}

export default function LiquidCanvas({ size = 280 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const inkBlobsRef = useRef<InkBlob[]>([]);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size * 2;
    canvas.height = size * 2;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const R = size; // 水面圆形充满整个 canvas

    const createRipple = (x: number, y: number, maxR: number) => {
      ripplesRef.current.push({
        x, y, radius: 0, maxRadius: maxR,
        speed: 0.8 + Math.random() * 0.5,
        opacity: 0.2 + Math.random() * 0.2,
        lineWidth: 1 + Math.random() * 2,
      });
    };

    let lastRippleTime = 0;
    let lastInkTime = 0;

    const createInkBlob = (x?: number, y?: number) => {
      const isRandom = x === undefined || y === undefined;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * R * 0.55;
      
      const spawnX = isRandom ? cx + Math.cos(angle) * dist : x;
      const spawnY = isRandom ? cy + Math.sin(angle) * dist * 0.5 : y; // 压扁符合透视
      
      inkBlobsRef.current.push({
        x: spawnX,
        y: spawnY,
        radius: 2 + Math.random() * 3,
        maxRadius: 35 + Math.random() * 50,
        opacity: 0,
        maxOpacity: 0.2 + Math.random() * 0.15,
        growSpeed: 0.2 + Math.random() * 0.3,
        fadeSpeed: 0.001 + Math.random() * 0.0015,
        driftX: (Math.random() - 0.5) * 0.1,
        driftY: (Math.random() - 0.5) * 0.05,
        seed: Math.random() * 100,
      });
    };

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 圆形裁剪：确保所有绘制内容限制在水面圆内
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      // 深层水底色 - 边缘深，中心浅
      const deepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.95);
      deepGrad.addColorStop(0, `rgba(126, 202, 230, 0.85)`);  //rgb(135, 216, 245) 中间浅
      deepGrad.addColorStop(0.4, `rgba(79, 163, 200, 0.80)`); //rgb(83, 175, 214)
      deepGrad.addColorStop(0.7, `rgba(44, 111, 143, 0.75)`); //rgb(50, 128, 164) 开始变深
      deepGrad.addColorStop(1, `rgba(33, 78, 108, 0.8)`);     //rgb(42, 86, 115) 边缘最深

      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.95, 0, Math.PI * 2);
      ctx.fillStyle = deepGrad;
      ctx.fill();

      // 灰白色墨水扩散效果 (在水面以下)
      // 自动生成新的墨点
      if (time - lastInkTime > 3000 + Math.random() * 4000) {
        createInkBlob();
        lastInkTime = time;
      }

      // 更新和绘制墨水
      inkBlobsRef.current = inkBlobsRef.current.filter((ink) => {
        ink.radius += ink.growSpeed;
        ink.x += ink.driftX;
        ink.y += ink.driftY;

        // 不透明度先增后减
        if (ink.radius < ink.maxRadius * 0.3) {
          ink.opacity += ink.fadeSpeed * 2;
          if (ink.opacity > ink.maxOpacity) ink.opacity = ink.maxOpacity;
        } else {
          ink.opacity -= ink.fadeSpeed;
        }

        if (ink.opacity <= 0 || ink.radius > ink.maxRadius) return false;

        // 主墨斑 - 灰白晕染核心
        const inkGrad = ctx.createRadialGradient(ink.x, ink.y, 0, ink.x, ink.y, ink.radius);
        const greyVal = 180 + Math.sin(ink.seed) * 40; // 偏向灰白
        inkGrad.addColorStop(0, `rgba(${greyVal}, ${greyVal+10}, ${greyVal+15}, ${ink.opacity})`);
        inkGrad.addColorStop(0.5, `rgba(${greyVal-20}, ${greyVal-15}, ${greyVal-10}, ${ink.opacity * 0.6})`);
        inkGrad.addColorStop(0.85, `rgba(${greyVal-40}, ${greyVal-35}, ${greyVal-30}, ${ink.opacity * 0.2})`);
        inkGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(ink.x, ink.y, ink.radius, 0, Math.PI * 2);
        ctx.fillStyle = inkGrad;
        ctx.fill();

        // 墨斑外圈晕染 - 更淡的边缘
        const haloR = ink.radius * 1.6;
        const haloGrad = ctx.createRadialGradient(ink.x, ink.y, ink.radius * 0.7, ink.x, ink.y, haloR);
        haloGrad.addColorStop(0, `rgba(${greyVal-30}, ${greyVal-20}, ${greyVal-10}, 0)`);
        haloGrad.addColorStop(0.5, `rgba(${greyVal-20}, ${greyVal-10}, ${greyVal}, ${ink.opacity * 0.15})`);
        haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(ink.x, ink.y, haloR, 0, Math.PI * 2);
        ctx.fillStyle = haloGrad;
        ctx.fill();

        return true;
      });

      // 水面表面色层 — 更亮、可见 (放在墨水之上，遮盖墨水，使其看起来在水面以下)
      const surfaceGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.75);
      surfaceGrad.addColorStop(0, `rgba(${WR + 20}, ${WG + 10}, ${WB}, 0.35)`);
      surfaceGrad.addColorStop(0.4, `rgba(${WR}, ${WG}, ${WB}, 0.25)`);
      surfaceGrad.addColorStop(0.9, `rgba(${WR - 20}, ${WG - 30}, ${WB - 20}, 0.12)`);
      surfaceGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.75, 0, Math.PI * 2);
      ctx.fillStyle = surfaceGrad;
      ctx.fill();

      // 呼吸式微动：水面整体极缓慢的涨缩（通过后续绘制应用）
      const breathe = 1 + Math.sin(time * 0.0008) * 0.008; // ±0.8% 的涨缩

      // 细微焦散（Caustics）：盆底投射上来的水纹光斑，在边缘若隐若现（应用呼吸微动）
      const causticCount = 8;
      for (let i = 0; i < causticCount; i++) {
        const angle = (time * 0.0003) + (i * Math.PI * 2 / causticCount);
        const dist = R * (0.65 + Math.sin(time * 0.0007 + i * 1.3) * 0.15) * breathe;
        const cx2 = cx + Math.cos(angle) * dist;
        const cy2 = cy + Math.sin(angle) * dist * 0.4; // 压扁，符合透视
        const size = (8 + Math.sin(time * 0.001 + i * 2) * 4) * breathe;
        const alpha = 0.08 + Math.sin(time * 0.0005 + i) * 0.04;

        const causticGrad = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, size);
        causticGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        causticGrad.addColorStop(0.5, `rgba(200, 240, 255, ${alpha * 0.5})`);
        causticGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.beginPath();
        ctx.ellipse(cx2, cy2, size, size * 0.6, angle * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = causticGrad;
        ctx.fill();
      }

      // Swirling animation
      const swirl1 = Math.sin(time * 0.001) * R * 0.07;
      const swirl2 = Math.cos(time * 0.0008) * R * 0.05;
      const swirl3 = Math.sin(time * 0.0012 + 1) * R * 0.09;

      // Swirling rings — brighter（应用呼吸微动）
      for (let i = 1; i <= 4; i++) {
        const r = (R * 0.17 * i + Math.sin(time * 0.0005 + i) * R * 0.035) * breathe;
        const offsetX = swirl1 * (i * 0.15);
        const offsetY = swirl2 * (i * 0.15);

        ctx.beginPath();
        ctx.arc(cx + offsetX * breathe, cy + offsetY * breathe, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${WR + 60}, ${WG + 30}, ${WB + 20}, ${0.12 - i * 0.02})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Auto generate ripples
      if (time - lastRippleTime > 2000 + Math.random() * 1500) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * R * 0.5;
        createRipple(
          cx + Math.cos(angle) * dist,
          cy + Math.sin(angle) * dist,
          R * 0.3 + Math.random() * R * 0.45
        );
        lastRippleTime = time;
      }

      // Update and draw ripples — brighter
      ripplesRef.current = ripplesRef.current.filter((r) => {
        r.radius += r.speed * 1.5; // faster ripples
        r.opacity -= 0.003; // decay slightly faster
        r.lineWidth *= 0.995;

        if (r.opacity <= 0 || r.radius > r.maxRadius) return false;

        // 应用呼吸微动到涟漪位置
        const rippleX = cx + (r.x - cx) * breathe;
        const rippleY = cy + (r.y - cy) * breathe;

        ctx.beginPath();
        ctx.arc(rippleX, rippleY, r.radius * breathe, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200, 240, 255, ${r.opacity * 1.5})`; // significantly brighter
        ctx.lineWidth = r.lineWidth * 2; // thicker
        ctx.stroke();

        // Secondary echo ring
        if (r.radius > R * 0.07) {
          ctx.beginPath();
          ctx.arc(rippleX, rippleY, r.radius * 0.7 * breathe, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(180, 220, 255, ${r.opacity * 0.8})`;
          ctx.lineWidth = r.lineWidth;
          ctx.stroke();
        }

        return true;
      });

      // Center shimmer — stronger（应用呼吸微动）
      const shimmerR = (R * 0.11 + Math.sin(time * 0.002) * R * 0.05) * breathe;
      const shimmerX = cx + swirl3 * 0.3 * breathe;
      const shimmerY = cy + swirl2 * 0.3 * breathe;
      const shimmerGrad = ctx.createRadialGradient(
        shimmerX, shimmerY, 0,
        shimmerX, shimmerY, shimmerR
      );
      shimmerGrad.addColorStop(0, `rgba(200, 240, 255, ${0.25 + Math.sin(time * 0.003) * 0.12})`);
      shimmerGrad.addColorStop(0.5, `rgba(${WR + 40}, ${WG + 40}, ${WB + 40}, 0.12)`);
      shimmerGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.beginPath();
      ctx.arc(shimmerX, shimmerY, shimmerR, 0, Math.PI * 2);
      ctx.fillStyle = shimmerGrad;
      ctx.fill();

      // Subtle inner glow ring（应用呼吸微动）
      ctx.beginPath();
      ctx.arc(cx, cy, (R * 0.3 + Math.sin(time * 0.001) * 5) * breathe, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${WR + 50}, ${WG + 40}, ${WB + 30}, 0.10)`;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Water surface reflection line（应用呼吸微动）
      ctx.beginPath();
      ctx.ellipse(
        cx - R * 0.07 * breathe + swirl1 * 0.5 * breathe,
        cy - R * 0.11 * breathe + swirl2 * 0.3 * breathe,
        R * 0.35 * breathe, R * 0.25 * breathe, 0, 0, Math.PI * 2
      );
      ctx.fillStyle = `rgba(255, 255, 255, ${0.03 + Math.sin(time * 0.002) * 0.02})`;
      ctx.fill();

      ctx.restore(); // 恢复裁剪，结束圆形区域绘制

      animationRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      // scale up from CSS size to canvas internal size
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      
      // limit creation rate based on time
      const now = performance.now();
      if (now - lastRippleTime > 150) {
         createRipple(x, y, R * 0.5 + Math.random() * R * 0.3);
         lastRippleTime = now;
         
         // Occasionally drip ink on mouse move (1 in 4 chance)
         if (Math.random() < 0.25) {
           createInkBlob(x, y);
         }
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
      if (canvas) canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      width={size * 2}
      height={size * 2}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        pointerEvents: 'auto'
      }}
      className="outline-none"
    />
  );
}
