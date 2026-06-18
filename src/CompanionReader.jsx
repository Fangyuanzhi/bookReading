import React, { useState, useEffect } from 'react';
import { Users, BookOpen, MessageCircle, Send, Heart, Minus, Plus } from 'lucide-react';

const THEMES = {
  dusk:  { key:'dusk',  name:'暮', bg:'#241C1A', panel:'#2D2320', raised:'#352A26', text:'#E8DDCD', soft:'#B6A795', faint:'#8C7E70', accent:'#E0A24E', glow:'rgba(224,162,78,0.16)', line:'rgba(232,221,205,0.12)' },
  paper: { key:'paper', name:'纸', bg:'#F1E9DA', panel:'#FBF6EC', raised:'#FFFDF8', text:'#3B332B', soft:'#7C7164', faint:'#9A9082', accent:'#B06A2C', glow:'rgba(176,106,44,0.12)', line:'rgba(59,51,43,0.12)' },
  night: { key:'night', name:'夜', bg:'#15171C', panel:'#1C1F26', raised:'#232733', text:'#C9CEDA', soft:'#838B9A', faint:'#646C7B', accent:'#D9A85C', glow:'rgba(217,168,92,0.15)', line:'rgba(201,206,218,0.10)' },
};

const CHAPTER = [
  { id:1, text:'雨是从黄昏开始下的。她把椅子挪到窗边，让那点暖黄的灯光正好落在书页上，像一只温顺的猫，蜷在纸的边缘。', thoughts:[] },
  { id:2, text:'楼下的街渐渐空了，只剩雨敲在遮阳棚上的声音，一下，一下，不急不缓，像有人在替这座城市数着心跳。', thoughts:[
    { user:'晚来天欲雪', text:'“替这座城市数着心跳”——这个比喻好温柔，雨声一下子就有了形状。' },
  ]},
  { id:3, text:'她想起很多年前的一个夜里，也是这样的雨。那时她还不懂，读一本书其实不是一个人的事——总有谁，在另一处屋檐下，读着同一行字，停在同一个逗号上轻轻叹气。', thoughts:[
    { user:'檐下听雨', text:'读到“停在同一个逗号上轻轻叹气”突然鼻酸，原来真有人懂这种感觉。' },
    { user:'夜航', text:'这句大概是整本书的题眼吧。读书从来不是孤独的事。' },
  ]},
  { id:4, text:'茶凉了，她没有去续。书里的人正走在一条没有路灯的小路上，而她替他点亮了手心里这盏灯。', thoughts:[] },
  { id:5, text:'“你也在这里啊。”她对着空荡荡的房间轻声说，却莫名觉得，有人听见了。', thoughts:[
    { user:'阿青', text:'我也常常对着空房间说话，看到这里觉得自己没那么奇怪了。' },
  ]},
  { id:6, text:'窗外的雨还在下。她翻过一页，纸张发出极轻的声响，像是谁在远处，也翻过了同一页。', thoughts:[
    { user:'木鱼', text:'翻页那一下我真的停下来听了听窗外，外面也在下雨。神奇。' },
  ]},
];

const REVIEWS = [
  { user:'夜航', text:'整章没有一件大事发生，却把“一个人读书时其实并不孤单”写得很满。配着雨声读完，舍不得点下一章。', likes:128 },
  { user:'檐下听雨', text:'作者太会写氛围了，把灯、雨、凉掉的茶串成一种很安静的陪伴感。', likes:86 },
  { user:'木鱼', text:'适合深夜一个人读，但读着读着，就觉得屏幕那头好像也有人在读。', likes:54 },
];

export default function CompanionReader(){
  const [themeKey, setThemeKey] = useState('dusk');
  const [companion, setCompanion] = useState(true);
  const [fontSize, setFontSize] = useState(20);
  const [paras, setParas] = useState(CHAPTER);
  const [reviews, setReviews] = useState(REVIEWS);
  const [openId, setOpenId] = useState(null);
  const [draft, setDraft] = useState('');
  const [reviewDraft, setReviewDraft] = useState('');
  const [liked, setLiked] = useState({});
  const [presence, setPresence] = useState(42);
  const t = THEMES[themeKey];

  useEffect(()=>{
    const id = setInterval(()=> setPresence(p => Math.max(37, Math.min(47, p + (Math.random()<0.5?-1:1)))), 4500);
    return ()=> clearInterval(id);
  },[]);

  function togglePara(pid){
    if(!companion) return;
    setOpenId(o => o===pid ? null : pid);
    setDraft('');
  }
  function addThought(pid){
    if(!draft.trim()) return;
    setParas(ps => ps.map(p => p.id===pid ? { ...p, thoughts:[...p.thoughts, { user:'我', text:draft.trim(), me:true }] } : p));
    setDraft('');
  }
  function addReview(){
    if(!reviewDraft.trim()) return;
    setReviews(rs => [{ user:'我', text:reviewDraft.trim(), likes:0, me:true }, ...rs]);
    setReviewDraft('');
  }
  function toggleLike(i){
    setLiked(l => ({ ...l, [i]: !l[i] }));
  }

  const ctrlBtn = (active)=>({
    display:'flex', alignItems:'center', gap:6, padding:'6px 11px', borderRadius:9,
    border:`1px solid ${active? t.accent : t.line}`, background: active? t.glow : 'transparent',
    color: active? t.accent : t.soft, cursor:'pointer', fontSize:13, transition:'all .2s', font:'inherit',
  });

  return (
    <div style={{ minHeight:'100vh', background:t.bg, color:t.text, fontFamily:'"Noto Serif SC", Georgia, serif', transition:'background .4s, color .4s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600&family=Noto+Sans+SC:wght@400;500&display=swap');
        @keyframes emberPulse{0%,100%{opacity:.45;transform:scale(1)}50%{opacity:.95;transform:scale(1.25)}}
        @keyframes softIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
        .cr-in{animation:softIn .35s ease both}
        .cr-ember{animation:emberPulse 3.4s ease-in-out infinite}
        .cr-sans{font-family:"Noto Sans SC",system-ui,sans-serif}
        .cr-para{transition:background .25s}
        .cr-para:hover{background:${companion? t.glow : 'transparent'}}
        @media (prefers-reduced-motion: reduce){.cr-ember,.cr-in{animation:none}}
      `}</style>

      {/* top bar */}
      <div className="cr-sans" style={{ position:'sticky', top:0, zIndex:10, display:'flex', alignItems:'center', justifyContent:'space-between',
        gap:12, flexWrap:'wrap', padding:'14px 22px', background:t.bg+'F2', backdropFilter:'blur(8px)', borderBottom:`1px solid ${t.line}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
          <BookOpen size={18} style={{ color:t.accent, flexShrink:0 }}/>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>夜行书简</div>
            <div style={{ fontSize:11.5, color:t.faint }}>第三章 · 檐下的灯</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <button onClick={()=>setCompanion(c=>!c)} style={ctrlBtn(companion)} aria-pressed={companion}>
            <Users size={14}/> {companion? '结伴读' : '独自读'}
          </button>
          <div style={{ display:'flex', gap:4, padding:3, borderRadius:10, border:`1px solid ${t.line}` }}>
            {Object.values(THEMES).map(th=>(
              <button key={th.key} onClick={()=>setThemeKey(th.key)} aria-label={`${th.name}主题`}
                style={{ width:30, height:26, borderRadius:7, border:'none', cursor:'pointer', fontSize:13, font:'inherit',
                  background: themeKey===th.key? t.accent : 'transparent', color: themeKey===th.key? t.bg : t.soft, transition:'all .2s' }}>
                {th.name}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:2, padding:3, borderRadius:10, border:`1px solid ${t.line}` }}>
            <button onClick={()=>setFontSize(s=>Math.max(16,s-1))} aria-label="减小字号" style={{ width:28, height:26, display:'grid', placeItems:'center', border:'none', background:'transparent', color:t.soft, cursor:'pointer', borderRadius:6 }}><Minus size={13}/></button>
            <button onClick={()=>setFontSize(s=>Math.min(24,s+1))} aria-label="增大字号" style={{ width:28, height:26, display:'grid', placeItems:'center', border:'none', background:'transparent', color:t.soft, cursor:'pointer', borderRadius:6 }}><Plus size={13}/></button>
          </div>
        </div>
      </div>

      {/* reading column */}
      <div style={{ maxWidth:620, margin:'0 auto', padding:'40px 26px 80px' }}>
        <h1 style={{ fontSize:fontSize+10, fontWeight:600, letterSpacing:'.01em', marginBottom:6 }}>檐下的灯</h1>

        {companion && (
          <div className="cr-sans cr-in" style={{ display:'flex', alignItems:'center', gap:10, margin:'14px 0 30px', padding:'9px 14px',
            borderRadius:12, background:t.panel, border:`1px solid ${t.line}` }}>
            <div style={{ display:'flex', gap:5 }}>
              {[0,1,2,3,4].map(i=>(
                <span key={i} className="cr-ember" style={{ width:7, height:7, borderRadius:'50%', background:t.accent, display:'inline-block', animationDelay:`${i*0.4}s` }}/>
              ))}
            </div>
            <span style={{ fontSize:13, color:t.soft }}>此刻 <b style={{ color:t.accent, fontWeight:600 }}>{presence}</b> 人和你读到这一章</span>
          </div>
        )}

        <div style={{ fontSize, lineHeight:2.05 }}>
          {paras.map(p=>{
            const has = p.thoughts.length>0;
            const open = openId===p.id;
            return (
              <div key={p.id} style={{ marginBottom:4 }}>
                <p className="cr-para" onClick={()=>togglePara(p.id)}
                  role={companion? 'button':undefined} tabIndex={companion?0:undefined}
                  onKeyDown={e=>{ if(companion && (e.key==='Enter'||e.key===' ')){ e.preventDefault(); togglePara(p.id);} }}
                  style={{ position:'relative', margin:0, padding:'6px 10px', borderRadius:8, textIndent:'2em',
                    cursor: companion? 'pointer':'default',
                    boxShadow: companion && has ? `inset 3px 0 0 ${t.accent}` : 'none' }}>
                  {p.text}
                  {companion && has && (
                    <span className="cr-sans" style={{ display:'inline-flex', alignItems:'center', gap:3, verticalAlign:'middle',
                      marginInlineStart:8, padding:'1px 8px', borderRadius:20, fontSize:11.5, textIndent:0,
                      background:t.glow, color:t.accent }}>
                      <MessageCircle size={11}/> {p.thoughts.length}
                    </span>
                  )}
                </p>

                {companion && open && (
                  <div className="cr-sans cr-in" style={{ margin:'4px 0 14px', padding:'14px 16px', borderRadius:12,
                    background:t.panel, border:`1px solid ${t.line}` }}>
                    {p.thoughts.length===0 && <div style={{ fontSize:13, color:t.faint, marginBottom:12 }}>还没有人在这一段留下想法，写下你的吧。</div>}
                    {p.thoughts.map((th,i)=>(
                      <div key={i} style={{ display:'flex', gap:10, marginBottom:12 }}>
                        <span style={{ flexShrink:0, width:26, height:26, borderRadius:'50%', display:'grid', placeItems:'center',
                          fontSize:12, fontWeight:500, background:t.glow, color:t.accent }}>{th.user.slice(0,1)}</span>
                        <div>
                          <div style={{ fontSize:12, color: th.me? t.accent : t.faint, marginBottom:2 }}>{th.user}</div>
                          <div style={{ fontSize:14, lineHeight:1.7, color:t.text }}>{th.text}</div>
                        </div>
                      </div>
                    ))}
                    <div style={{ display:'flex', gap:8, marginTop:6 }}>
                      <input value={draft} onChange={e=>setDraft(e.target.value)}
                        onKeyDown={e=>{ if(e.key==='Enter') addThought(p.id); }}
                        placeholder="写下你读到这里的想法…"
                        style={{ flex:1, padding:'9px 12px', borderRadius:9, border:`1px solid ${t.line}`, background:t.raised,
                          color:t.text, fontSize:13.5, outline:'none', font:'inherit' }}/>
                      <button onClick={()=>addThought(p.id)} aria-label="发送想法"
                        style={{ display:'grid', placeItems:'center', width:40, borderRadius:9, border:'none', cursor:'pointer',
                          background:t.accent, color:t.bg }}><Send size={15}/></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* chapter end reviews */}
        <div className="cr-sans" style={{ marginTop:54 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:22 }}>
            <span style={{ flex:1, height:1, background:t.line }}/>
            <span style={{ fontSize:13, color:t.faint, letterSpacing:'.08em' }}>本章 · 大家的感想</span>
            <span style={{ flex:1, height:1, background:t.line }}/>
          </div>

          <div style={{ display:'flex', gap:8, marginBottom:24 }}>
            <input value={reviewDraft} onChange={e=>setReviewDraft(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter') addReview(); }}
              placeholder="读完这一章，你想说点什么？"
              style={{ flex:1, padding:'11px 14px', borderRadius:11, border:`1px solid ${t.line}`, background:t.panel,
                color:t.text, fontSize:14, outline:'none', font:'inherit' }}/>
            <button onClick={addReview} style={{ padding:'0 18px', borderRadius:11, border:'none', cursor:'pointer',
              background:t.accent, color:t.bg, fontSize:14, fontWeight:500, font:'inherit' }}>发布</button>
          </div>

          {reviews.map((r,i)=>(
            <div key={i} style={{ display:'flex', gap:12, padding:'16px 0', borderBottom:`1px solid ${t.line}` }}>
              <span style={{ flexShrink:0, width:34, height:34, borderRadius:'50%', display:'grid', placeItems:'center',
                fontSize:14, fontWeight:500, background:t.glow, color:t.accent }}>{r.user.slice(0,1)}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color: r.me? t.accent : t.soft, marginBottom:5 }}>{r.user}</div>
                <div style={{ fontSize:15, lineHeight:1.75, color:t.text, marginBottom:8 }}>{r.text}</div>
                <button onClick={()=>toggleLike(i)} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 4px',
                  border:'none', background:'transparent', cursor:'pointer', color: liked[i]? t.accent : t.faint, fontSize:12.5, font:'inherit' }}>
                  <Heart size={14} fill={liked[i]? t.accent : 'none'}/> {r.likes + (liked[i]?1:0)}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cr-sans" style={{ textAlign:'center', marginTop:40, fontSize:12.5, color:t.faint }}>
          {companion ? '你不是一个人在读这一章。' : '此刻，只有你和这盏灯。'}
        </div>
      </div>
    </div>
  );
}
