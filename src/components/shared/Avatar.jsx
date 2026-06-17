export default function Avatar({ name, initials, color = '#4F7FFF', size = 28, ring = false }) {
  return (
    <div
      className={`flex items-center justify-center rounded-full font-medium text-white ${ring ? 'ring-2 ring-bg' : ''}`}
      style={{
        background: color,
        width: size,
        height: size,
        fontSize: Math.max(10, size * 0.38),
      }}
      title={name}
    >
      {initials}
    </div>
  );
}
