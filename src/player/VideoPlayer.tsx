import React, {forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {fmtTime, media, type Video} from '../data/videos';
import {Icon} from '../ui/Icon';
import {setPrediction, setWatched, useProgress} from '../lib/store';
import {sfx} from '../lib/sound';
import {burst} from '../ui/confetti';
import {scrollToEl} from '../lib/scroll';

export type PlayerHandle = {seek: (t: number, play?: boolean) => void; el: () => HTMLVideoElement | null};

const SPEEDS = [1, 1.25, 1.5, 0.75];
const ease = [0.22, 1, 0.36, 1] as const;

/** Brand video player: chapter scrubber with frame previews, word-timed captions, a pause-and-think question. */
export const VideoPlayer = forwardRef<PlayerHandle, {video: Video; onTime?: (t: number) => void; onEnded?: () => void}>(({video, onTime, onEnded}, ref) => {
  const m = media(video.slug);
  const vid = useRef<HTMLVideoElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(video.duration);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [cc, setCc] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const [idle, setIdle] = useState(false);
  const [hover, setHover] = useState<{x: number; t: number} | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const [ended, setEnded] = useState(false);
  const [quiz, setQuiz] = useState<null | {answer: number | null}>(null);
  const [fs, setFs] = useState(false);
  const progress = useProgress();
  const askedRef = useRef(false);
  const idleTimer = useRef<number>(0);

  const play = useCallback(() => {
    const v = vid.current;
    if (!v) return;
    setStarted(true);
    setEnded(false);
    void v.play().catch(() => setPlaying(false));
  }, []);
  const pause = useCallback(() => vid.current?.pause(), []);
  const toggle = useCallback(() => {
    if (quiz) return;
    const v = vid.current;
    if (!v) return;
    if (v.paused) play();
    else pause();
    sfx('click', {vol: 0.35});
  }, [play, pause, quiz]);
  const seek = useCallback(
    (to: number, andPlay = false) => {
      const v = vid.current;
      if (!v) return;
      v.currentTime = Math.max(0, Math.min(dur - 0.05, to));
      setT(v.currentTime);
      // jumping past the question counts as having seen it
      if (to > video.checkpoint.at + 0.5) askedRef.current = true;
      if (andPlay) play();
    },
    [dur, play, video.checkpoint.at],
  );
  useImperativeHandle(ref, () => ({seek, el: () => vid.current}), [seek]);

  // time loop (rAF while playing for smooth captions)
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const v = vid.current;
      if (v) {
        setT(v.currentTime);
        onTime?.(v.currentTime);
        if (!askedRef.current && !(video.slug in progress.predictions) && v.currentTime >= video.checkpoint.at && v.currentTime < video.checkpoint.at + 1.2) {
          askedRef.current = true;
          v.pause();
          setQuiz({answer: null});
          sfx('boing', {vol: 0.5});
        }
      }
      raf = requestAnimationFrame(loop);
    };
    if (playing) raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, onTime, video, progress.predictions]);

  // watched progress → store (throttled by the store itself)
  useEffect(() => {
    if (dur > 0 && started) setWatched(video.slug, t / dur);
  }, [Math.floor(t / 3), started]); // eslint-disable-line react-hooks/exhaustive-deps

  // controls auto-hide
  const poke = useCallback(() => {
    setIdle(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setIdle(true), 2600);
  }, []);
  useEffect(() => () => clearTimeout(idleTimer.current), []);

  // fullscreen
  useEffect(() => {
    const on = () => setFs(document.fullscreenElement === box.current);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  const toggleFs = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void box.current?.requestFullscreen?.();
  };

  // keyboard (only when the player is on screen and nothing else focused)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey) return;
      const r = box.current?.getBoundingClientRect();
      if (!r || r.bottom < 0 || r.top > innerHeight) return;
      // the task area below uses digits/Enter — leave them alone
      if (e.key === ' ' || e.key === 'k' || e.key === 'л') {
        if (r.top > innerHeight * 0.6) return;
        e.preventDefault();
        toggle();
      } else if (e.key === 'ArrowRight') seek(t + 5);
      else if (e.key === 'ArrowLeft') seek(t - 5);
      else if (e.key === 'f' || e.key === 'а') toggleFs();
      else if (e.key === 'c' || e.key === 'с') setCc((c) => !c);
      else if (e.key === 'm' || e.key === 'ь') setMuted((x) => !x);
      else return;
      poke();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [toggle, seek, t, poke]);

  useEffect(() => {
    if (vid.current) vid.current.playbackRate = speed;
  }, [speed]);
  useEffect(() => {
    if (vid.current) vid.current.muted = muted;
  }, [muted]);

  // scrubbing
  const timeAt = (clientX: number) => {
    const r = bar.current!.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * dur;
  };
  const onBarDown = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setScrubbing(true);
    seek(timeAt(e.clientX));
  };
  const onBarMove = (e: React.PointerEvent) => {
    const r = bar.current!.getBoundingClientRect();
    setHover({x: Math.max(0, Math.min(r.width, e.clientX - r.left)), t: timeAt(e.clientX)});
    if (scrubbing) seek(timeAt(e.clientX));
  };

  const line = video.lines.find((l) => t >= l.t - 0.05 && t <= l.end + 0.35);
  const chapter = video.chapters.find((c) => t >= c.t && t < c.end) ?? video.chapters[0];
  const hoverChapter = hover ? video.chapters.find((c) => hover.t >= c.t && hover.t < c.end) : undefined;
  const sprite = hover ? Math.min(49, Math.floor(hover.t / 2)) : 0;
  const showControls = !playing || !idle || scrubbing || !!hover;
  const cp = video.checkpoint;

  const answer = (i: number) => {
    if (!quiz || quiz.answer !== null) return;
    const ok = i === cp.correct;
    setQuiz({answer: i});
    setPrediction(video.slug, ok);
    sfx(ok ? 'ding' : 'pop', {vol: 0.6});
    if (ok) {
      const r = box.current?.getBoundingClientRect();
      if (r) burst(r.left + r.width / 2, r.top + r.height / 2, 50, 0.9);
    }
  };

  return (
    <div
      ref={box}
      className={`player ${showControls ? '' : 'is-idle'} ${fs ? 'is-fs' : ''}`}
      onPointerMove={poke}
      onPointerLeave={() => setIdle(true)}
      data-lenis-prevent-wheel
    >
      <video
        ref={vid}
        className="player__video"
        src={m.video}
        poster={m.poster}
        preload="metadata"
        playsInline
        onClick={toggle}
        onPlay={() => {
          setPlaying(true);
          poke();
        }}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration || video.duration)}
        onProgress={(e) => {
          const v = e.currentTarget;
          if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1) / (v.duration || 1));
        }}
        onTimeUpdate={(e) => !playing && setT(e.currentTarget.currentTime)}
        onEnded={() => {
          setPlaying(false);
          setEnded(true);
          setWatched(video.slug, 1);
          onEnded?.();
        }}
        data-cursor={playing ? 'Пауза' : 'Смотреть'}
      />

      {/* captions */}
      <AnimatePresence>
        {cc && started && line && !quiz && (
          <motion.div key={line.id} className="player__cc" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0}} transition={{duration: 0.2}}>
            <span>
              {line.words.map((w, i) => (
                <span key={i} className={t >= w.t ? (t < w.end ? 'is-now' : 'is-past') : ''}>
                  {w.w}{' '}
                </span>
              ))}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* start cover */}
      <AnimatePresence>
        {!started && (
          <motion.button className="player__cover" onClick={play} exit={{opacity: 0, scale: 1.04}} transition={{duration: 0.5, ease}} data-cursor="Смотреть" aria-label="Смотреть ролик">
            <span className="player__big">
              <Icon name="play" size={40} />
            </span>
            <span className="player__cover-txt">
              <b>{video.hook}</b>
              <span className="num">{fmtTime(video.duration)} · {video.chapters.length} глав · субтитры</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* paused mid-video */}
      <AnimatePresence>
        {started && !playing && !quiz && !ended && !scrubbing && (
          <motion.button className="player__mid" onClick={toggle} initial={{opacity: 0, scale: 0.8}} animate={{opacity: 1, scale: 1}} exit={{opacity: 0, scale: 1.2}} aria-label="Продолжить">
            <Icon name="play" size={34} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* pause-and-think */}
      <AnimatePresence>
        {quiz && (
          <motion.div className="player__quiz" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} transition={{duration: 0.3}}>
            <motion.div className="player__quiz-in" initial={{y: 30, scale: 0.96}} animate={{y: 0, scale: 1}} transition={{type: 'spring', stiffness: 240, damping: 22}}>
              <span className="sticker">Пауза · подумай</span>
              <h3>{cp.question}</h3>
              <div className="player__quiz-opts">
                {cp.options.map((o, i) => {
                  const st = quiz.answer === null ? '' : i === cp.correct ? 'right' : i === quiz.answer ? 'wrong' : 'dim';
                  return (
                    <motion.button key={i} className={`player__opt ${st}`} onClick={() => answer(i)} whileHover={quiz.answer === null ? {y: -4} : undefined} whileTap={{scale: 0.96}} disabled={quiz.answer !== null}>
                      {o}
                    </motion.button>
                  );
                })}
              </div>
              <AnimatePresence>
                {quiz.answer !== null && (
                  <motion.div className="player__quiz-after" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}}>
                    <p>
                      <b className="num" style={{color: 'var(--mustard)'}}>+{quiz.answer === cp.correct ? 10 : 5} XP</b> · {quiz.answer === cp.correct ? cp.right : cp.wrong}
                    </p>
                    <button
                      className="btn btn--mustard"
                      autoFocus
                      onClick={() => {
                        setQuiz(null);
                        play();
                      }}
                    >
                      Смотреть дальше <span className="arrow">→</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              {quiz.answer === null && (
                <button className="player__skip" onClick={() => { setQuiz(null); play(); }}>
                  пропустить
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* end screen */}
      <AnimatePresence>
        {ended && (
          <motion.div className="player__end" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
            <span className="sticker">Ролик досмотрен</span>
            <h3 className="display">Теперь — руками.</h3>
            <div style={{display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center'}}>
              <button className="btn btn--mustard" onClick={() => { setEnded(false); scrollToEl('#praktika'); }}>
                К заданиям <span className="arrow">↓</span>
              </button>
              <button className="btn btn--ghost" style={{color: 'var(--paper)'}} onClick={() => seek(0, true)}>
                <Icon name="replay" /> Ещё раз
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* controls */}
      <div className={`player__ctrl ${started ? '' : 'is-hidden'}`}>
        <div
          className="player__bar"
          ref={bar}
          onPointerDown={onBarDown}
          onPointerMove={onBarMove}
          onPointerUp={() => setScrubbing(false)}
          onPointerLeave={() => !scrubbing && setHover(null)}
          role="slider"
          aria-label="Перемотка"
          aria-valuemin={0}
          aria-valuemax={Math.round(dur)}
          aria-valuenow={Math.round(t)}
          data-cursor="none"
        >
          {video.chapters.map((c) => {
            const w = ((c.end - c.t) / dur) * 100;
            const fill = Math.max(0, Math.min(1, (t - c.t) / (c.end - c.t)));
            const buf = Math.max(0, Math.min(1, (buffered * dur - c.t) / (c.end - c.t)));
            return (
              <div key={c.id} className={`player__seg ${hoverChapter?.id === c.id ? 'is-hover' : ''}`} style={{width: `${w}%`}}>
                <span className="player__buf" style={{transform: `scaleX(${buf})`}} />
                <span className="player__fill" style={{transform: `scaleX(${fill})`}} />
              </div>
            );
          })}
          <span className="player__knob" style={{left: `${(t / dur) * 100}%`}} />
          <span className="player__cp" style={{left: `${(cp.at / dur) * 100}%`}} title="Пауза-вопрос" />
          {hover && (
            <div className="player__preview" style={{left: hover.x}}>
              <span
                className="player__thumb"
                style={{backgroundImage: `url(${m.sprite})`, backgroundPosition: `${-(sprite % 10) * 192}px ${-Math.floor(sprite / 10) * 108}px`}}
              />
              <span className="player__pv-txt">
                <b>{hoverChapter?.title}</b> <span className="num">{fmtTime(hover.t)}</span>
              </span>
            </div>
          )}
        </div>
        <div className="player__row">
          <button className="player__btn" onClick={toggle} aria-label={playing ? 'Пауза' : 'Смотреть'}>
            <Icon name={playing ? 'pause' : 'play'} size={22} />
          </button>
          <button className="player__btn" onClick={() => setMuted((x) => !x)} aria-label={muted ? 'Включить звук' : 'Выключить звук'}>
            <Icon name={muted ? 'mute' : 'sound'} size={20} />
          </button>
          <span className="player__time num">
            {fmtTime(t)} <span>/ {fmtTime(dur)}</span>
          </span>
          <span className="player__chapter">
            <span className="player__chapter-dot" /> {chapter.title}
          </span>
          <span style={{flex: 1}} />
          <button className={`player__btn player__pill ${cc ? 'is-on' : ''}`} onClick={() => setCc((c) => !c)} aria-pressed={cc} aria-label="Субтитры">
            <Icon name="cc" size={20} />
          </button>
          <button className="player__btn player__pill num" onClick={() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])} aria-label="Скорость">
            {speed}×
          </button>
          <button className="player__btn" onClick={toggleFs} aria-label="Во весь экран">
            <Icon name="full" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
});
