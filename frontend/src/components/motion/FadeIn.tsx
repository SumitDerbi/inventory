import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

export interface FadeInProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  /** Delay before the animation starts (seconds). */
  delay?: number;
  /** Override default duration (seconds). */
  duration?: number;
}

/**
 * Page/section enter preset from docs/ui_spec.md §Animation Guidelines.
 * opacity 0→1, y 8→0, 0.2s ease-out.
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 0.2,
  ...rest
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, ease: 'easeOut', delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
