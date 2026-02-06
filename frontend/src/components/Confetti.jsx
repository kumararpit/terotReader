import React, { useEffect, useRef } from 'react';

const Confetti = ({ isActive }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!isActive) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const colors = ['#D4AF37', '#FCFAF8', '#B8860B', '#111111']; // Theme colors

        // Create particles from bottom corners
        const createBurst = (x, y) => {
            for (let i = 0; i < 100; i++) {
                particles.push({
                    x,
                    y,
                    vx: (Math.random() - 0.5) * 10 * (Math.random() + 1), // Increased spread
                    vy: -(Math.random() * 10 + 5), // Shoot up
                    gravity: 0.2, // Simulate gravity
                    color: colors[Math.floor(Math.random() * colors.length)],
                    size: Math.random() * 8 + 2,
                    opacity: 1,
                    rotation: Math.random() * 360,
                    rotationSpeed: (Math.random() - 0.5) * 10
                });
            }
        };

        // Blast from both corners
        createBurst(0, window.innerHeight); // Bottom Left
        createBurst(window.innerWidth, window.innerHeight); // Bottom Right
        createBurst(0, window.innerHeight); // Double blast
        createBurst(window.innerWidth, window.innerHeight); // Double blast

        let animationId;
        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            let stillActive = false;
            particles.forEach((p, index) => {
                if (p.opacity <= 0) return;
                stillActive = true;

                p.vy += p.gravity;
                p.x += p.vx;
                p.y += p.vy;
                p.opacity -= 0.005; // Fade out slowly
                p.rotation += p.rotationSpeed;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            });

            if (stillActive) {
                animationId = requestAnimationFrame(animate);
            }
        };

        animate();

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
        };
    }, [isActive]);

    if (!isActive) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-50"
            style={{ width: '100vw', height: '100vh' }}
        />
    );
};

export default Confetti;
