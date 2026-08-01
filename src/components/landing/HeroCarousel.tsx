import { useState, useEffect, useRef } from 'react';

const images = ['/images/school-front.png', '/images/school-building.png', '/images/school-students.png', '/images/school-logo.png'];

export const HeroCarousel = () => {
  const [index, setIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const start = () => {
      clear();
      intervalRef.current = window.setInterval(() => setIndex(i => (i + 1) % images.length), 4500);
    };
    const clear = () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
    start();
    return () => clear();
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const startX = touchStartX.current;
    const endX = e.changedTouches[0].clientX;
    touchStartX.current = null;
    if (startX == null) return;
    const delta = endX - startX;
    if (Math.abs(delta) > 40) {
      setIndex(i => delta < 0 ? (i + 1) % images.length : (i - 1 + images.length) % images.length);
    }
    intervalRef.current = window.setInterval(() => setIndex(i => (i + 1) % images.length), 4500);
  };

  return (
    <div className="h-full" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="absolute inset-0 overflow-hidden">
        {images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === index ? 'opacity-40 scale-100' : 'opacity-0 scale-105'}`}
          />
        ))}
        <div className="absolute inset-0 bg-primary/30" />
      </div>
      <div className="absolute left-4 bottom-6 flex gap-2 z-20">
        {images.map((_, i) => (
          <button key={i} onClick={() => setIndex(i)} className={`h-2 w-8 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/40'}`} aria-label={`Slide ${i + 1}`} />
        ))}
      </div>
    </div>
  );
};
