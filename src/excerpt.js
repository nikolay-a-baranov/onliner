// icon: 💬
// name: excerpt
(()=>{
  const limit=444;
  document.querySelector('#content-html')?.click();
  const content=document.getElementById('content'),
        excerpt=document.getElementById('excerpt'),
        textarea=document.createElement('textarea');
  const label=len=>{
    const percent=Math.round(len/limit*100);
    if(percent<=100)return`Цитата и так хороша (${percent}%)`;
    if(percent<=125)return`Цитата так себе (${percent}%)`;
    return`Цитата совсем плоха (${percent}%)`;
  };
  const color=len=>{
    const ratio=len/limit;
    if(ratio<=1){
      const t=Math.max(0,Math.min((ratio-.75)/.25,1));
      return`hsl(${220-100*t} 60% 45%)`;
    }
    const t=Math.max(0,Math.min((ratio-1)/.25,1));
    return`hsl(${120-120*t} 75% 45%)`;
  };
  const width=len=>{
    return(1+Math.max(0,1-Math.abs(len/limit-1)/.1)).toFixed(2)+'px';
  };
  let counter=document.getElementById('excerpt-counter');
  if(!counter){
    counter=document.createElement('div');
    counter.id='excerpt-counter';
    counter.style.cssText=[
      'margin-top:5px',
      'font:10px Consolas,Monaco,monospace',
      'text-align:right',
      'white-space:nowrap',
      'padding:0',
      'box-sizing:border-box'
    ].join(';');
    excerpt.insertAdjacentElement('afterend',counter);
  }
  const paint=()=>{
    const len=excerpt.value.length,
          percent=Math.round(len/limit*100),
          currentColor=color(len);
    excerpt.style.outline=`${width(len)} solid ${currentColor}`;
    counter.style.color=currentColor;
    counter.style.width=excerpt.offsetWidth+'px';
    counter.textContent=`${len}/${limit} · ${percent}%`;
  };
  excerpt.removeEventListener('input',excerpt._excerptPaint);
  excerpt._excerptPaint=paint;
  excerpt.addEventListener('input',paint);
  excerpt.style.transition='outline-color .2s ease, outline-width .2s ease';
  paint();
  if(excerpt.value.trim()){
    try{navigator.clipboard.writeText(excerpt.value)}catch{}
    if(!confirm(`${label(excerpt.value.length)}. Заменить цитату?`))return;
  }
  textarea.innerHTML=(content.value||'').split(/\n\s*\n/).find(s=>s.trim())||'';
  const lead=textarea.value
    .replace(/<[^>]+>/g,'')
    .replace(/[ \t\u00A0]+/g,' ')
    .replace(/\s*\n\s*/g,' ')
    .trim();
  excerpt.value=lead;
  excerpt.focus();
  excerpt.dispatchEvent(new Event('input',{bubbles:true}));
  excerpt.dispatchEvent(new Event('change',{bubbles:true}));
  paint();
})();
