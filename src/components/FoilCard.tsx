"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";
import Image from "next/image";

interface FoilCardProps {
  src: string;
  alt: string;
  isFoil?: boolean;
  className?: string;
  priority?: boolean;
}

export default function FoilCard({ src, alt, isFoil = false, className = "", priority = false }: FoilCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Motion values for pointer coordinates (-0.5 to 0.5)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for tilt
  const springX = useSpring(x, { stiffness: 150, damping: 20 });
  const springY = useSpring(y, { stiffness: 150, damping: 20 });

  // Map pointer position to rotation degrees (-15 to +15)
  const rotateX = useTransform(springY, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-15, 15]);

  // For the foil reflection effect (0 to 100)
  const glareX = useTransform(springX, [-0.5, 0.5], [100, 0]);
  const glareY = useTransform(springY, [-0.5, 0.5], [100, 0]);

  // Motion templates for CSS
  const glareBackground = useMotionTemplate`radial-gradient(farthest-corner circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.8) 10%, rgba(255, 255, 255, 0.3) 20%, rgba(0, 0, 0, 0) 50%)`;
  const rainbowPosition = useMotionTemplate`${glareX}% ${glareY}%`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative w-full aspect-[63/88] rounded-[4.5%] overflow-hidden cursor-pointer shadow-xl will-change-transform ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover pointer-events-none"
        sizes="(max-width: 768px) 50vw, 33vw"
        priority={priority}
        unoptimized
      />
      
      {/* White glare layer for lighting */}
      {isFoil && (
        <motion.div
          className="absolute inset-0 pointer-events-none mix-blend-color-dodge z-10"
          style={{
            background: glareBackground,
            opacity: isHovered ? 0.6 : 0.1,
            transition: "opacity 0.2s ease"
          }}
        />
      )}
      
      {/* Rainbow holographic layer */}
      {isFoil && (
        <motion.div
          className="absolute inset-0 pointer-events-none mix-blend-overlay z-20"
          style={{
            backgroundImage: `linear-gradient(
              115deg,
              transparent 20%,
              #ec4899 25%,
              #8b5cf6 35%,
              #3b82f6 45%,
              #10b981 55%,
              transparent 60%
            )`,
            backgroundSize: "300% 300%",
            backgroundPosition: rainbowPosition,
            opacity: isHovered ? 0.6 : 0.2,
            transition: "opacity 0.2s ease"
          }}
        />
      )}
      
      {/* Subtle border to catch light */}
      <div className="absolute inset-0 rounded-[4.5%] border border-white/10 pointer-events-none z-30" />
    </motion.div>
  );
}
