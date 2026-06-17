import { useEffect, useState } from 'react';

export default function Typewriter({ text, speed = 18, onDone, showCursor = true }) {
  const [shown, setShown] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setShown('');
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
        if (onDone) onDone();
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, onDone]);

  return (
    <span className={!done && showCursor ? 'cursor-blink' : ''}>
      <span className="whitespace-pre-wrap">{shown}</span>
    </span>
  );
}
