import { useMouseSparkles } from '@/hooks/useMouseSparkles';

export const MouseSparkles = () => {
    const particles = useMouseSparkles(true);

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="absolute rounded-full"
                    style={{
                        left: particle.x,
                        top: particle.y,
                        width: particle.size,
                        height: particle.size,
                        opacity: particle.opacity,
                        // Hiệu ứng sáng trắng - xám
                        background: `radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(200,200,200,0.6) 50%, transparent 100%)`,
                        boxShadow: `0 0 ${particle.size * 2}px rgba(255,255,255,0.6)`,
                        transform: `translate(-50%, -50%) scale(${particle.opacity})`,
                        transition: 'transform 0.1s ease-out',
                    }}
                />
            ))}
        </div>
    );
};
