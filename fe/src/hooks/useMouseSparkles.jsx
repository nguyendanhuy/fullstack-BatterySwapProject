import { useState, useEffect, useCallback, useRef } from 'react';

export const useMouseSparkles = (enabled = true) => {
    const [particles, setParticles] = useState([]);
    const [lastSparkleTime, setLastSparkleTime] = useState(0);
    const particleIdCounter = useRef(0);

    const createParticle = useCallback((x, y) => {
        const now = Date.now();
        // Giới hạn tạo hạt mỗi 30ms
        if (now - lastSparkleTime < 30) return;

        setLastSparkleTime(now);

        const newParticles = [];
        // Tạo 2–3 hạt mỗi lần di chuyển chuột
        const count = Math.random() > 0.5 ? 2 : 3;

        for (let i = 0; i < count; i++) {
            newParticles.push({
                id: `particle-${particleIdCounter.current++}`,
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                size: Math.random() * 4 + 4,
                opacity: 1,
                velocityX: (Math.random() - 0.5) * 2,
                velocityY: (Math.random() - 0.5) * 2 - 1,
            });
        }

        setParticles(prev => {
            const updated = [...prev, ...newParticles];
            // Giới hạn tối đa 40 hạt
            return updated.slice(-40);
        });
    }, [lastSparkleTime]);

    useEffect(() => {
        if (!enabled) return;

        const handleMouseMove = e => {
            createParticle(e.clientX, e.clientY);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [enabled, createParticle]);

    useEffect(() => {
        if (!enabled) return;

        const animationInterval = setInterval(() => {
            setParticles(prev =>
                prev
                    .map(particle => ({
                        ...particle,
                        x: particle.x + particle.velocityX,
                        y: particle.y + particle.velocityY,
                        opacity: particle.opacity - 0.02,
                    }))
                    .filter(particle => particle.opacity > 0)
            );
        }, 16); // ~60fps

        return () => clearInterval(animationInterval);
    }, [enabled]);

    return particles;
};
