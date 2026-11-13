import React from 'react';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  gradient?: boolean;
}

export function Card({
  children,
  className = '',
  interactive = false,
  gradient = false,
  ...props
}: CardProps) {
  const interactiveClass = interactive ? styles.interactive : '';
  const gradientClass = gradient ? styles.gradient : '';

  return (
    <div
      className={`${styles.card} ${interactiveClass} ${gradientClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
