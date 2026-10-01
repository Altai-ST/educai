import React from 'react';
import {motion} from 'motion/react';

const ease = [0.22, 1, 0.36, 1] as const;

/** Headline that rises word by word out of a mask. */
export const SplitText: React.FC<{text: string; className?: string; delay?: number; stagger?: number; as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'; once?: boolean; render?: (word: string, i: number) => React.ReactNode}> = ({
  text, className, delay = 0, stagger = 0.06, as = 'h2', once = true, render,
}) => {
  const Tag = motion[as];
  const lines = text.split('\n');
  let k = 0;
  return (
    <Tag className={className} initial="hidden" whileInView="show" viewport={{once, margin: '-10% 0px'}} aria-label={text.replace(/\n/g, ' ')}>
      {lines.map((line, li) => (
        <span key={li} style={{display: 'block'}}>
          {line.split(' ').map((w) => {
            const i = k++;
            return (
              <span key={i} aria-hidden style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.08em', marginBottom: '-0.08em'}}>
                <motion.span
                  style={{display: 'inline-block', willChange: 'transform'}}
                  variants={{hidden: {y: '110%', rotate: 4}, show: {y: '0%', rotate: 0, transition: {duration: 0.9, ease, delay: delay + i * stagger}}}}
                >
                  {render ? render(w, i) : w}
                  {' '}
                </motion.span>
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
};

/** Fade-and-rise on scroll into view. */
export const Reveal: React.FC<{children: React.ReactNode; delay?: number; y?: number; className?: string; style?: React.CSSProperties}> = ({children, delay = 0, y = 40, className, style}) => (
  <motion.div
    className={className}
    style={style}
    initial={{opacity: 0, y}}
    whileInView={{opacity: 1, y: 0}}
    viewport={{once: true, margin: '-8% 0px'}}
    transition={{duration: 0.9, ease, delay}}
  >
    {children}
  </motion.div>
);
