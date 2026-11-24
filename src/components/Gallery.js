'use client';
import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import SmartImg from './SmartImg';

// گالری چندتصویره: تصویر بزرگ + بندانگشتی‌ها + کشیدن/فلش
export default function Gallery({ images, name, category }) {
  const list = images.length ? images : [''];
  const [i, setI] = useState(0);
  const go = (d) => setI((x) => (x + d + list.length) % list.length);
  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-ink-50 to-brand-50/60 p-6 ring-1 ring-ink-100" onKeyDown={(e) => { if (e.key === 'ArrowRight') go(-1); if (e.key === 'ArrowLeft') go(1); }} tabIndex={0} aria-label="گالری تصاویر">
        <SmartImg key={list[i]} src={list[i]} alt={name} category={category} eager className="h-full w-full animate-up object-contain" />
        {list.length > 1 && <>
          <button type="button" onClick={() => go(-1)} className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-card" aria-label="تصویر قبلی"><ChevronRight /></button>
          <button type="button" onClick={() => go(1)} className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-card" aria-label="تصویر بعدی"><ChevronLeft /></button>
          <span className="absolute bottom-3 left-3 rounded-full bg-ink/70 px-2.5 py-0.5 text-xs text-white">{(i + 1).toLocaleString('fa-IR')} / {list.length.toLocaleString('fa-IR')}</span>
        </>}
      </div>
      {list.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {list.map((u, k) => (
            <button key={u + k} type="button" onClick={() => setI(k)} aria-label={`تصویر ${k + 1}`} aria-current={k === i} className={`size-16 shrink-0 overflow-hidden rounded-xl bg-white p-1.5 ring-2 transition sm:size-20 ${k === i ? 'ring-brand' : 'ring-ink-100 hover:ring-ink-200'}`}>
              <SmartImg src={u} alt="" category={category} className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
