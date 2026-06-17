import type { ReactNode } from 'react';

export function SectionCard({
  icon,
  title,
  badge,
  children,
  className = '',
}: {
  icon: string;
  title: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card p-5 ${className}`}>
      <header className="mb-4 flex items-center justify-between">
        <h2 className="section-title">
          <span className="text-base">{icon}</span>
          {title}
        </h2>
        {badge}
      </header>
      {children}
    </section>
  );
}
