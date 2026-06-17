const VARIANTS = {
  active: 'bg-success',
  attention: 'bg-warning',
  unread: 'bg-text-muted',
  danger: 'bg-danger',
  primary: 'bg-primary',
};

export default function StatusDot({ variant = 'active', size = 'sm' }) {
  const sz = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  return <span className={`inline-block rounded-full ${sz} ${VARIANTS[variant] || 'bg-text-muted'}`} />;
}
