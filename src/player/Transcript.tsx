import React, {useEffect, useRef, useState} from 'react';
import {fmtTime, type Video} from '../data/videos';
import {sfx} from '../lib/sound';
import {useBus, type Bus} from '../lib/bus';

/** Live transcript (karaoke-style) + chapter list. Click a phrase or a chapter to jump there. */
export const SidePanel: React.FC<{video: Video; time: Bus<number>; onSeek: (t: number) => void}> = ({video, time, onSeek}) => {
  const t = useBus(time);
  const [tab, setTab] = useState<'text' | 'chapters'>('text');
  const list = useRef<HTMLDivElement>(null);
  const current = t < 0.2 ? -1 : video.lines.findIndex((l, i) => t >= l.t - 0.05 && t < (video.lines[i + 1]?.t ?? Infinity));

  // keep the spoken line in view inside the panel (not the page)
  useEffect(() => {
    if (tab !== 'text' || current < 0) return;
    const box = list.current;
    const el = box?.querySelector<HTMLElement>(`[data-i="${current}"]`);
    if (!box || !el) return;
    const top = el.offsetTop - box.clientHeight * 0.35;
    box.scrollTo({top, behavior: 'smooth'});
  }, [current, tab]);

  let lastScene = '';
  return (
    <aside className="side">
      <div className="side__tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'text'} className={tab === 'text' ? 'is-on' : ''} onClick={() => setTab('text')}>
          Текст ролика
        </button>
        <button role="tab" aria-selected={tab === 'chapters'} className={tab === 'chapters' ? 'is-on' : ''} onClick={() => setTab('chapters')}>
          Главы <span className="num">{video.chapters.length}</span>
        </button>
      </div>
      {tab === 'text' ? (
        <div className="side__list" ref={list} data-lenis-prevent>
          {video.lines.map((l, i) => {
            const head = l.scene !== lastScene ? (lastScene = l.scene) : null;
            const ch = head ? video.chapters.find((c) => c.id === head) : null;
            const state = i === current ? 'is-now' : i < current ? 'is-past' : '';
            return (
              <React.Fragment key={l.id}>
                {ch && <div className="side__chap num">{fmtTime(ch.t)} · {ch.title}</div>}
                <button data-i={i} className={`side__line ${state}`} onClick={() => { onSeek(l.t); sfx('tick', {vol: 0.4}); }}>
                  {i === current
                    ? l.words.map((w, k) => (
                        <span key={k} className={t >= w.t ? 'w-on' : ''}>
                          {w.w}{' '}
                        </span>
                      ))
                    : l.text}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      ) : (
        <div className="side__list" data-lenis-prevent>
          {video.chapters.map((c, i) => {
            const on = t >= c.t && t < c.end;
            const fill = Math.max(0, Math.min(1, (t - c.t) / (c.end - c.t)));
            return (
              <button key={c.id} className={`side__ch ${on ? 'is-now' : ''}`} onClick={() => { onSeek(c.t); sfx('tick', {vol: 0.4}); }}>
                <span className="side__ch-n num">{String(i + 1).padStart(2, '0')}</span>
                <span className="side__ch-t">
                  <b>{c.title}</b>
                  <span className="num">{fmtTime(c.t)} · {Math.round(c.end - c.t)} с</span>
                </span>
                <span className="side__ch-bar"><span style={{transform: `scaleX(${fill})`}} /></span>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
};
