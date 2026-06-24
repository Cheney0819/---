'use client';

import React, { useRef, useEffect, useState } from 'react';

// 情侣专属文案
const romanticTexts = [
  "喜欢你", "想你了", "早安", "晚安", "想见你",
  "你是我的", "我爱你", "么么哒", "抱抱", "亲亲",
  "今天想你", "永远", "宝贝", "亲爱的", "小心心",
  "第一次见面", "你的笑容", "牵你的手", "心跳加速", "脸红",
  "在一起", "不分离", "想念", "思念", "等你",
  "晚安好梦", "早安宝贝", "想你想到睡不着", "你是我的全世界",
  "爱你", "么么", "哒哒", "嘿嘿", "嘻嘻",
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  text: string;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  shattering: boolean;
  fragments: Fragment[];
  lastShatterTime: number;
}

interface Fragment {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
  life: number;
}

export default function BlackHoleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, force: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = dimensions.width;
    const height = dimensions.height;
    
    canvas.width = width * 2;
    canvas.height = height * 2;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(2, 2);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 黑洞位置
    const blackHoleX = width / 2;
    const blackHoleY = height * 0.35;
    const blackHoleRadius = 80;
    const gravityRange = 200;

    // 初始化粒子
    const initParticles = () => {
      const particles: Particle[] = [];
      for (let i = 0; i < 30; i++) {
        particles.push(createParticle(width, height));
      }
      return particles;
    };

    const createParticle = (w: number, h: number): Particle => {
      const colors = ['#ffb6c1', '#ffc0cb', '#ffd700', '#ff69b4', '#ff1493', '#ff6b9d', '#ffa07a'];
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        text: romanticTexts[Math.floor(Math.random() * romanticTexts.length)],
        size: Math.random() * 16 + 18,
        opacity: Math.random() * 0.3 + 0.2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        color: colors[Math.floor(Math.random() * colors.length)],
        shattering: false,
        fragments: [],
        lastShatterTime: 0,
      };
    };

    const shatter = (particle: Particle): Fragment[] => {
      const fragments: Fragment[] = [];
      const numFragments = Math.floor(Math.random() * 7) + 5;
      
      for (let i = 0; i < numFragments; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        fragments.push({
          x: particle.x,
          y: particle.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 6 + 2,
          opacity: 1,
          rotation: Math.random() * Math.PI * 2,
          life: 1,
        });
      }
      return fragments;
    };

    particlesRef.current = initParticles();

    // 动画循环
    const animate = () => {
      ctx.fillStyle = 'rgba(10, 10, 20, 0.1)';
      ctx.fillRect(0, 0, width, height);

      // 绘制黑洞
      const gradient = ctx.createRadialGradient(blackHoleX, blackHoleY, 0, blackHoleX, blackHoleY, blackHoleRadius * 2);
      gradient.addColorStop(0, 'rgba(200, 100, 150, 0.9)');
      gradient.addColorStop(0.3, 'rgba(180, 80, 130, 0.7)');
      gradient.addColorStop(0.6, 'rgba(150, 60, 100, 0.4)');
      gradient.addColorStop(1, 'rgba(10, 10, 20, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(blackHoleX, blackHoleY, blackHoleRadius * 2, 0, Math.PI * 2);
      ctx.fill();

      // 绘制光子环 - 呼吸效果
      const photonTime = Date.now() * 0.001;
      const breathIntensity = 0.3 + Math.sin(photonTime * 0.8) * 0.3;
      const breathGlow = 20 + Math.sin(photonTime * 0.8) * 15;
      
      ctx.save();
      ctx.strokeStyle = `rgba(180, 120, 255, ${breathIntensity})`;
      ctx.shadowColor = 'rgba(255, 150, 200, 0.5)';
      ctx.shadowBlur = breathGlow * 0.25;
      ctx.lineWidth = 2 + Math.sin(photonTime * 0.8) * 1;
      ctx.beginPath();
      ctx.arc(blackHoleX, blackHoleY, blackHoleRadius + Math.sin(photonTime) * 8, 0, Math.PI * 2);
      ctx.stroke();
      
      // 第二层光晕
      ctx.strokeStyle = `rgba(255, 180, 200, ${breathIntensity * 0.5})`;
      ctx.shadowBlur = breathGlow * 0.35;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(blackHoleX, blackHoleY, blackHoleRadius + 15 + Math.sin(photonTime * 0.6) * 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 更新和绘制粒子
      particlesRef.current.forEach((particle, index) => {
        // 计算到黑洞的距离
        const dx = blackHoleX - particle.x;
        const dy = blackHoleY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 引力
        if (distance < gravityRange) {
          const force = (gravityRange - distance) / gravityRange * 0.02;
          particle.vx += dx * force * 0.01;
          particle.vy += dy * force * 0.01;
        }

        // 鼠标/触摸力
        const mdx = mouseRef.current.x - particle.x;
        const mdy = mouseRef.current.y - particle.y;
        const mDistance = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDistance < 150 && mouseRef.current.force > 0) {
          particle.vx -= mdx * 0.001 * mouseRef.current.force;
          particle.vy -= mdy * 0.001 * mouseRef.current.force;
        }

        // 更新位置
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.rotationSpeed;

        // 边界处理
        if (particle.x < -50) particle.x = width + 50;
        if (particle.x > width + 50) particle.x = -50;
        if (particle.y < -50) particle.y = height + 50;
        if (particle.y > height + 50) particle.y = -50;

        // 撕碎效果
        if (distance < blackHoleRadius + 100 && !particle.shattering && Date.now() - particle.lastShatterTime > 3000) {
          particle.shattering = true;
          particle.fragments = shatter(particle);
          particle.lastShatterTime = Date.now();
        }

        // 绘制粒子
        if (!particle.shattering) {
          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.rotate(particle.rotation);
          ctx.font = `bold ${particle.size}px "PingFang SC", "SF Pro Display", "Microsoft YaHei", system-ui, sans-serif`;
        ctx.textRendering = 'optimizeLegibility';
          ctx.fillStyle = particle.color;
          ctx.globalAlpha = particle.opacity;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(particle.text, 0, 0);
          ctx.restore();
        }

        // 更新碎片
        particle.fragments = particle.fragments.filter(fragment => {
          fragment.x += fragment.vx;
          fragment.y += fragment.vy;
          fragment.vx *= 0.98;
          fragment.vy *= 0.98;
          fragment.life -= 0.02;
          fragment.opacity = fragment.life;
          fragment.rotation += 0.1;

          if (fragment.life > 0) {
            ctx.save();
            ctx.translate(fragment.x, fragment.y);
            ctx.rotate(fragment.rotation);
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = fragment.opacity;
            ctx.fillRect(-fragment.size / 2, -fragment.size / 2, fragment.size, fragment.size);
            ctx.restore();
            return true;
          }
          return false;
        });

        // 碎片消失后重生粒子
        if (particle.shattering && particle.fragments.length === 0) {
          particlesRef.current[index] = createParticle(width, height);
        }
      });

      // 衰减鼠标力
      mouseRef.current.force *= 0.95;

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions]);

  // 鼠标/触摸事件
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.force = 5;
    };

    const handleWheel = (e: WheelEvent) => {
      mouseRef.current.force = Math.abs(e.deltaY) * 0.1;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current.x = e.touches[0].clientX;
        mouseRef.current.y = e.touches[0].clientY;
        mouseRef.current.force = 8;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('wheel', handleWheel);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      style={{ background: 'linear-gradient(180deg, #1a0a1a 0%, #2d1b3d 30%, #3d1a2e 60%, #1a0a1a 100%)' }}
    />
  );
}
