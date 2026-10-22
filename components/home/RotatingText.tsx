"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export function RotatingText({ words, interval = 2600 }: { words: string[]; interval?: number }) {
  const list = words.length ? words : ["Graphic Designer"];
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (list.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % list.length), interval);
    return () => window.clearInterval(id);
  }, [list.length, interval]);

  const longest = list.reduce((a, b) => (b.length > a.length ? b : a), "");

  return (
    <span className="relative inline-grid align-bottom" aria-live="polite">
      {/* Invisible sizer reserves the width of the longest phrase → no layout shift */}
      <span aria-hidden className="invisible col-start-1 row-start-1 whitespace-nowrap">
        {longest}
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={list[index]}
          className="col-start-1 row-start-1 whitespace-nowrap bg-linear-to-r from-glow via-electric to-brand bg-clip-text text-transparent"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: "60%", filter: "blur(8px)" }}
          animate={{ opacity: 1, y: "0%", filter: "blur(0px)" }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: "-60%", filter: "blur(8px)" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {list[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
