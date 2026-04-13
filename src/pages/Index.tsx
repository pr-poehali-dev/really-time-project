import { useState } from "react";
import Icon from "@/components/ui/icon";

// ─── Data ───────────────────────────────────────────────────────────────────
const DONATES = [
  { id: 1, name: "ᴍᴏᴏɴ",     price: 129,  tier: "common" },
  { id: 2, name: "ᴅɪᴀᴍᴏɴᴅ", price: 320,  tier: "common" },
  { id: 3, name: "ʟᴏʀᴅ",     price: 478,  tier: "common" },
  { id: 4, name: "Ᏼʟᴀᴄᴋ",    price: 572,  tier: "common" },
  { id: 5, name: "ᴍᴏɴsᴛᴇʀ",  price: 633,  tier: "rare" },
  { id: 6, name: "sᴘᴏʀᴛ",    price: 771,  tier: "rare" },
  { id: 7, name: "ɢᴏʟᴅ",     price: 1666, tier: "epic" },
  { id: 8, name: "ʀᴇᴀʟʏ",    price: 2999, tier: "unique", badge: "unique" },
  { id: 9, name: "ᴅ.ᴀᴅᴍɪɴ",  price: 9999, tier: "mega",  badge: "mega" },
];
const CASES_DONATE = [
  { id: 1, qty: 1,  price: 49  },
  { id: 2, qty: 3,  price: 79  },
  { id: 3, qty: 6,  price: 120 },
  { id: 4, qty: 9,  price: 234 },
  { id: 5, qty: 10, price: 378 },
];
const CASES_TITLES = [
  { id: 1, qty: 1, price: 12 },
  { id: 2, qty: 3, price: 27 },
  { id: 3, qty: 5, price: 45 },
  { id: 4, qty: 8, price: 67 },
];
const PROMO_CODES: Record<string, number> = { KITTY: 10 };
const ADMIN_PASS = "13nikita13";
const SERVER_IP = "mc4ReallyTime.aternos.me";

const TIER_COLORS: Record<string, string> = {
  common: "from-zinc-800 to-zinc-900",
  rare:   "from-red-950 to-zinc-900",
  epic:   "from-yellow-950 to-zinc-900",
  unique: "from-purple-950 to-red-950",
  mega:   "from-yellow-900 to-orange-950",
};
const TIER_BORDER: Record<string, string> = {
  common: "border-zinc-700",
  rare:   "border-red-800",
  epic:   "border-yellow-700",
  unique: "border-purple-600",
  mega:   "border-yellow-500",
};

interface CartItem { id: string; name: string; price: number; qty: number; }

// ─── LocalStorage helpers ────────────────────────────────────────────────────
function lsGet<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? (JSON.parse(v) as T) : fallback;
  } catch { return fallback; }
}
function lsSet(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
}
// One-time migration: remove legacy gift keys
try {
  localStorage.removeItem("rt_gift_day");
  localStorage.removeItem("rt_nick");
  // Reset balance once (v2 migration)
  if (!localStorage.getItem("rt_v2")) {
    localStorage.removeItem("rt_balance");
    localStorage.setItem("rt_v2", "1");
  }
} catch { /* noop */ }

// ─── Component ──────────────────────────────────────────────────────────────
export default function Index() {
  const [tab, setTab] = useState<"donates"|"cases-donate"|"cases-titles"|"promo">("donates");

  // Persistent
  const [balance, setBalanceRaw] = useState<number>(() => lsGet("rt_balance", 0));
  const [cart, setCartRaw] = useState<CartItem[]>(() => lsGet("rt_cart", []));
  const [promoApplied, setPromoAppliedRaw] = useState<number|null>(() => lsGet("rt_promo", null));

  const setBalance = (v: number | ((p: number) => number)) =>
    setBalanceRaw(prev => { const n = typeof v==="function" ? v(prev) : v; lsSet("rt_balance", n); return n; });
  const setCart = (v: CartItem[] | ((p: CartItem[]) => CartItem[])) =>
    setCartRaw(prev => { const n = typeof v==="function" ? v(prev) : v; lsSet("rt_cart", n); return n; });
  const setPromoApplied = (v: number|null) => { setPromoAppliedRaw(v); lsSet("rt_promo", v); };

  // UI
  const [cartOpen, setCartOpen]         = useState(false);
  const [buyModal, setBuyModal]         = useState<{name:string;price:number}|null>(null);
  const [promoCode, setPromoCode]       = useState("");
  const [promoMsg, setPromoMsg]         = useState("");
  const [adminOpen, setAdminOpen]       = useState(false);
  const [adminPass, setAdminPass]       = useState("");
  const [adminAuthed, setAdminAuthed]   = useState(false);
  const [adminUser, setAdminUser]       = useState("");
  const [adminAmount, setAdminAmount]   = useState("");
  const [adminMsg, setAdminMsg]         = useState("");
  const [topupOpen, setTopupOpen]       = useState(false);
  const [topupAmount, setTopupAmount]   = useState("");
  const [topupCard, setTopupCard]       = useState(false);
  const [copied, setCopied]             = useState(false);
  const [adminTab, setAdminTab]         = useState<"give"|"remove">("give");

  const cartTotal       = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount       = cart.reduce((s, i) => s + i.qty, 0);
  const discountedTotal = promoApplied ? Math.round(cartTotal * (1 - promoApplied/100)) : cartTotal;

  const addToCart = (id: string, name: string, price: number) =>
    setCart(prev => {
      const ex = prev.find(i => i.id === id);
      if (ex) return prev.map(i => i.id===id ? {...i, qty: i.qty+1} : i);
      return [...prev, {id, name, price, qty: 1}];
    });

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

  const applyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (PROMO_CODES[code]) { setPromoApplied(PROMO_CODES[code]); setPromoMsg(`Промокод применён! Скидка ${PROMO_CODES[code]}%`); }
    else { setPromoApplied(null); setPromoMsg("Промокод не найден"); }
  };

  const openWhatsApp = (name: string, price: number) => {
    const fp = promoApplied ? Math.round(price*(1-promoApplied/100)) : price;
    window.open(`https://wa.me/79011505959?text=${encodeURIComponent(`Хочу купить: ${name} за ${fp}₽`)}`, "_blank");
  };

  const handleAdminLogin = () => {
    if (adminPass === ADMIN_PASS) { setAdminAuthed(true); setAdminMsg(""); }
    else setAdminMsg("Неверный пароль");
  };

  const handleGiveBalance = () => {
    const amt = parseInt(adminAmount);
    if (!adminUser.trim()) { setAdminMsg("Введите имя пользователя"); return; }
    if (isNaN(amt) || amt<=0) { setAdminMsg("Введите корректную сумму"); return; }
    setBalance(p => p + amt);
    setAdminMsg(`✓ Выдано ${amt.toLocaleString()}₽ → ${adminUser}`);
    setAdminUser(""); setAdminAmount("");
  };

  const handleRemoveBalance = () => {
    const amt = parseInt(adminAmount);
    if (!adminUser.trim()) { setAdminMsg("Введите имя пользователя"); return; }
    if (isNaN(amt) || amt<=0) { setAdminMsg("Введите корректную сумму"); return; }
    setBalance(p => Math.max(0, p - amt));
    setAdminMsg(`✓ Удалено ${amt.toLocaleString()}₽ у ${adminUser}`);
    setAdminUser(""); setAdminAmount("");
  };

  const handleTopup = () => {
    const amt = parseInt(topupAmount);
    if (!isNaN(amt) && amt>0) { setBalance(p => p+amt); setTopupOpen(false); setTopupAmount(""); setTopupCard(false); }
  };

  const copyIP = () => {
    navigator.clipboard?.writeText(SERVER_IP).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  const closeAdmin = () => { setAdminOpen(false); setAdminAuthed(false); setAdminPass(""); setAdminMsg(""); };
  const IS: React.CSSProperties = { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", outline:"none", color:"white" };

  // ── Reusable buy buttons ──────────────────────────────────────────────────
  const BuyRow = ({ id, name, price }: {id:string; name:string; price:number}) => (
    <div className="flex gap-2">
      <button onClick={() => addToCart(id, name, price)}
        className="flex-1 py-2 rounded-lg text-sm font-bold hover:opacity-80 transition-opacity"
        style={{ background:"rgba(212,160,23,0.12)", border:"1px solid rgba(212,160,23,0.32)", color:"#d4a017" }}>
        + В корзину
      </button>
      <button onClick={() => setBuyModal({name, price})}
        className="flex-1 py-2 rounded-lg text-sm font-bold pulse-red"
        style={{ background:"linear-gradient(135deg,#c0392b,#a93226)", color:"white" }}>
        Купить
      </button>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background:"linear-gradient(135deg,#080808 0%,#140202 50%,#090606 100%)" }}>

      {/* Ambient blobs — isolated layer */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ contain:"strict" }}>
        <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,#c0392b12 0%,transparent 70%)", top:"5%", left:"-5%" }} />
        <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,#d4a0170e 0%,transparent 70%)", bottom:"15%", right:"5%" }} />
      </div>

      {/* ── HEADER ── */}
      <header className="relative z-10 sticky top-0"
        style={{ background:"rgba(8,8,8,0.94)", backdropFilter:"blur(14px)", borderBottom:"1px solid rgba(212,160,23,0.14)" }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="shrink-0">
            <h1 className="rgb-logo text-2xl md:text-3xl">ReallyTime</h1>
            <p className="text-xs hidden sm:block" style={{ color:"#d4a017", opacity:0.5, fontFamily:"Oswald,sans-serif", letterSpacing:"0.15em" }}>GAME STORE</p>
          </div>

          <nav className="hidden md:flex gap-1 flex-1 justify-center">
            {(["donates","cases-donate","cases-titles","promo"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab===t ? "tab-active" : "text-gray-500 hover:text-gray-200"}`}>
                {t==="donates" ? "Донаты" : t==="cases-donate" ? "Кейсы Донат" : t==="cases-titles" ? "Кейсы Титулы" : "Промокоды"}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setTopupOpen(true)}
              className="balance-glow flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold"
              style={{ background:"rgba(212,160,23,0.09)", border:"1px solid rgba(212,160,23,0.3)", color:"#d4a017" }}>
              <Icon name="Wallet" size={13} />
              <span>{balance.toLocaleString()}₽</span>
            </button>
            <button onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold"
              style={{ background:"rgba(192,57,43,0.1)", border:"1px solid rgba(192,57,43,0.3)", color:"#ff7b7b" }}>
              <Icon name="ShoppingCart" size={13} />
              <span className="hidden sm:inline">Корзина</span>
              {cartCount>0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center font-bold"
                  style={{ background:"#c0392b", color:"white", fontSize:"10px" }}>{cartCount}</span>
              )}
            </button>
            <button onClick={() => setAdminOpen(true)} title="Панель администратора"
              className="p-2 rounded-lg"
              style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", color:"#555" }}>
              <Icon name="Shield" size={14} />
            </button>
          </div>
        </div>

        <div className="md:hidden flex overflow-x-auto gap-1 px-4 pb-2">
          {(["donates","cases-donate","cases-titles","promo"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold ${tab===t ? "tab-active" : "text-gray-500"}`}>
              {t==="donates" ? "Донаты" : t==="cases-donate" ? "Кейсы Донат" : t==="cases-titles" ? "Кейсы Титулы" : "Промокоды"}
            </button>
          ))}
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8 animate-fade-in-up">
          <p className="text-xs tracking-widest text-gray-600" style={{ fontFamily:"Oswald,sans-serif" }}>ИГРОВОЙ МАГАЗИН · БЫСТРАЯ ДОСТАВКА</p>
          <div className="section-divider w-40 mt-3 mx-auto" />
        </div>

        {/* ── DONATES ── */}
        {tab==="donates" && (
          <div>
            <h2 className="gold-shimmer text-2xl font-bold mb-6" style={{ fontFamily:"Oswald,sans-serif" }}>ДОНАТЫ</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DONATES.map((d,i) => (
                <div key={d.id}
                  className={`shop-card relative rounded-xl p-5 bg-gradient-to-br ${TIER_COLORS[d.tier]} border ${TIER_BORDER[d.tier]} animate-fade-in-up`}
                  style={{ animationDelay:`${i*0.055}s`, animationFillMode:"both" }}>
                  {d.badge==="unique" && <span className="badge-unique absolute top-3 right-3">Уникальный</span>}
                  {d.badge==="mega"   && <span className="badge-mega   absolute top-3 right-3">Мега</span>}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-white mb-1" style={{ fontFamily:"Oswald,sans-serif" }}>{d.name}</h3>
                    <div className="text-2xl font-black" style={{ color:"#d4a017", fontFamily:"Oswald,sans-serif" }}>{d.price}₽</div>
                  </div>
                  <BuyRow id={`donate-${d.id}`} name={d.name} price={d.price} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CASES DONATE ── */}
        {tab==="cases-donate" && (
          <div>
            <h2 className="gold-shimmer text-2xl font-bold mb-2" style={{ fontFamily:"Oswald,sans-serif" }}>КЕЙСЫ С ДОНАТОМ</h2>
            <p className="text-gray-600 text-sm mb-6">Открой кейс — получи случайный донат!</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CASES_DONATE.map((c,i) => (
                <div key={c.id}
                  className="shop-card rounded-xl p-5 bg-gradient-to-br from-red-950 to-zinc-900 border border-red-800 animate-fade-in-up"
                  style={{ animationDelay:`${i*0.055}s`, animationFillMode:"both" }}>
                  <div className="text-5xl mb-3 text-center">📦</div>
                  <h3 className="text-center font-bold text-white mb-1" style={{ fontFamily:"Oswald,sans-serif" }}>
                    {c.qty} {c.qty===1?"кейс":c.qty<5?"кейса":"кейсов"}
                  </h3>
                  <div className="text-center text-2xl font-black mb-4" style={{ color:"#d4a017", fontFamily:"Oswald,sans-serif" }}>{c.price}₽</div>
                  <BuyRow id={`case-donate-${c.id}`} name={`Кейс Донат ×${c.qty}`} price={c.price} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CASES TITLES ── */}
        {tab==="cases-titles" && (
          <div>
            <h2 className="gold-shimmer text-2xl font-bold mb-2" style={{ fontFamily:"Oswald,sans-serif" }}>КЕЙСЫ С ТИТУЛАМИ</h2>
            <p className="text-gray-600 text-sm mb-6">Получи уникальный титул для персонажа</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CASES_TITLES.map((c,i) => (
                <div key={c.id}
                  className="shop-card rounded-xl p-5 bg-gradient-to-br from-yellow-950 to-zinc-900 border border-yellow-800 animate-fade-in-up"
                  style={{ animationDelay:`${i*0.055}s`, animationFillMode:"both" }}>
                  <div className="text-5xl mb-3 text-center">👑</div>
                  <h3 className="text-center font-bold text-white mb-1" style={{ fontFamily:"Oswald,sans-serif" }}>
                    {c.qty} {c.qty===1?"кейс":c.qty<5?"кейса":"кейсов"}
                  </h3>
                  <div className="text-center text-2xl font-black mb-4" style={{ color:"#d4a017", fontFamily:"Oswald,sans-serif" }}>{c.price}₽</div>
                  <BuyRow id={`case-title-${c.id}`} name={`Кейс Титулы ×${c.qty}`} price={c.price} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PROMO ── */}
        {tab==="promo" && (
          <div className="max-w-lg mx-auto animate-fade-in-up">
            <h2 className="gold-shimmer text-2xl font-bold mb-2" style={{ fontFamily:"Oswald,sans-serif" }}>ПРОМОКОДЫ</h2>
            <p className="text-gray-600 text-sm mb-6">Введи промокод и получи скидку</p>
            <div className="rounded-xl p-6" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(212,160,23,0.15)" }}>
              <label className="block text-sm font-semibold mb-2" style={{ color:"#d4a017" }}>Промокод</label>
              <div className="flex gap-2 mb-4">
                <input type="text" value={promoCode} onChange={e => setPromoCode(e.target.value)}
                  placeholder="Введи промокод..." onKeyDown={e => e.key==="Enter" && applyPromo()}
                  className="flex-1 px-4 py-3 rounded-lg font-semibold uppercase" style={IS} />
                <button onClick={applyPromo}
                  className="px-5 py-3 rounded-lg font-bold text-white"
                  style={{ background:"linear-gradient(135deg,#c0392b,#d4a017)" }}>
                  Применить
                </button>
              </div>
              {promoMsg && (
                <div className="px-4 py-3 rounded-lg text-sm font-semibold mb-4"
                  style={{ background:promoApplied?"rgba(212,160,23,0.1)":"rgba(192,57,43,0.1)", border:`1px solid ${promoApplied?"rgba(212,160,23,0.3)":"rgba(192,57,43,0.3)"}`, color:promoApplied?"#d4a017":"#ff7b7b" }}>
                  {promoMsg}
                </div>
              )}
              {promoApplied && (
                <div className="text-center py-4">
                  <div className="text-6xl font-black" style={{ color:"#d4a017", fontFamily:"Oswald,sans-serif" }}>-{promoApplied}%</div>
                  <p className="text-gray-500 text-sm mt-2">Скидка применяется ко всем покупкам</p>
                </div>
              )}
              <div className="mt-4 p-3 rounded-lg text-center" style={{ background:"rgba(192,57,43,0.05)", border:"1px solid rgba(192,57,43,0.1)" }}>
                <p className="text-xs text-gray-600">Промокоды выдаются администрацией сервера</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── SERVER FOOTER ── */}
      <footer className="relative z-10 mt-8 pb-28">
        <div className="section-divider w-72 mx-auto mb-6" />
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-4 px-6 py-3 rounded-xl"
            style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(212,160,23,0.13)" }}>
            <div className="flex items-center gap-2">
              <span className="online-dot w-2.5 h-2.5 rounded-full inline-block" style={{ background:"#22c55e" }} />
              <span className="text-xs font-bold" style={{ color:"#22c55e" }}>ОНЛАЙН</span>
            </div>
            <div className="w-px h-5 hidden sm:block" style={{ background:"rgba(255,255,255,0.08)" }} />
            <button onClick={copyIP} title="Скопировать IP"
              className="flex items-center gap-1.5 hover:opacity-75 transition-opacity">
              <div>
                <p className="text-xs text-gray-500 text-left">IP сервера</p>
                <p className="text-sm font-bold" style={{ color:"#d4a017", fontFamily:"Oswald,sans-serif" }}>
                  {copied ? "Скопировано!" : SERVER_IP}
                </p>
              </div>
              <Icon name="Copy" size={12} style={{ color:"#d4a017" }} />
            </button>
            <div className="w-px h-5 hidden sm:block" style={{ background:"rgba(255,255,255,0.08)" }} />
            <div>
              <p className="text-xs text-gray-500">Игроки</p>
              <p className="text-sm font-bold" style={{ fontFamily:"Oswald,sans-serif" }}>
                <span style={{ color:"#22c55e" }}>200</span>
                <span className="text-gray-600">/500</span>
              </p>
            </div>
          </div>
          <p className="text-gray-700 text-xs" style={{ fontFamily:"Oswald,sans-serif" }}>© 2024 REALLYTIME · GAME STORE</p>
        </div>
      </footer>



      {/* ── CART MODAL ── */}
      {cartOpen && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setCartOpen(false)}>
          <div className="w-full max-w-md rounded-2xl p-6 animate-fade-in-up"
            style={{ background:"#0f0f0f", border:"1px solid rgba(212,160,23,0.2)", maxHeight:"80vh", overflowY:"auto" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black" style={{ fontFamily:"Oswald,sans-serif", color:"#d4a017" }}>КОРЗИНА</h2>
              <button onClick={() => setCartOpen(false)} style={{ color:"#666" }}><Icon name="X" size={20} /></button>
            </div>
            {cart.length===0 ? (
              <p className="text-center text-gray-600 py-10">Корзина пуста</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg"
                      style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.06)" }}>
                      <div>
                        <div className="text-sm font-semibold text-white">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.qty} × {item.price}₽</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm" style={{ color:"#d4a017" }}>{item.qty*item.price}₽</span>
                        <button onClick={() => removeFromCart(item.id)} style={{ color:"#c0392b" }}><Icon name="Trash2" size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                {promoApplied && (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Скидка {promoApplied}%</span>
                    <span style={{ color:"#d4a017" }}>-{cartTotal-discountedTotal}₽</span>
                  </div>
                )}
                <div className="section-divider my-3" />
                <div className="flex justify-between text-lg font-black mb-4">
                  <span className="text-white">Итого</span>
                  <span style={{ color:"#d4a017" }}>{discountedTotal}₽</span>
                </div>
                <button
                  onClick={() => { setCartOpen(false); const names=cart.map(i=>`${i.name} ×${i.qty}`).join(", "); setBuyModal({name:names,price:discountedTotal}); }}
                  className="w-full py-3 rounded-xl font-bold text-white"
                  style={{ background:"linear-gradient(135deg,#c0392b,#d4a017)" }}>
                  Оформить заказ
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── BUY MODAL ── */}
      {buyModal && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setBuyModal(null)}>
          <div className="w-full max-w-sm rounded-2xl p-6 text-center animate-fade-in-up"
            style={{ background:"#0f0f0f", border:"1px solid rgba(37,211,102,0.2)" }}
            onClick={e => e.stopPropagation()}>
            <div className="text-5xl mb-3">💬</div>
            <h2 className="text-xl font-black text-white mb-2" style={{ fontFamily:"Oswald,sans-serif" }}>ОФОРМЛЕНИЕ</h2>
            <p className="text-gray-500 text-sm mb-2 leading-snug">{buyModal.name}</p>
            <p className="text-3xl font-black mb-1" style={{ color:"#d4a017", fontFamily:"Oswald,sans-serif" }}>
              {promoApplied ? Math.round(buyModal.price*(1-promoApplied/100)) : buyModal.price}₽
            </p>
            {promoApplied && <p className="text-xs mb-3" style={{ color:"#d4a017" }}>Скидка {promoApplied}% применена</p>}
            <p className="text-xs text-gray-600 mb-5 mt-1">Нажми — откроется WhatsApp с менеджером</p>
            <button onClick={() => openWhatsApp(buyModal.name, buyModal.price)}
              className="w-full py-3 rounded-xl font-bold text-white mb-2 flex items-center justify-center gap-2"
              style={{ background:"linear-gradient(135deg,#25d366,#128c7e)" }}>
              💬 Написать в WhatsApp
            </button>
            <button onClick={() => setBuyModal(null)} className="w-full py-2 text-sm text-gray-600">Отмена</button>
          </div>
        </div>
      )}

      {/* ── TOPUP MODAL ── */}
      {topupOpen && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => { setTopupOpen(false); setTopupCard(false); setTopupAmount(""); }}>
          <div className="w-full max-w-sm rounded-2xl p-6 animate-fade-in-up"
            style={{ background:"#0f0f0f", border:"1px solid rgba(212,160,23,0.2)" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black" style={{ fontFamily:"Oswald,sans-serif", color:"#d4a017" }}>ПОПОЛНЕНИЕ</h2>
              <button onClick={() => { setTopupOpen(false); setTopupCard(false); setTopupAmount(""); }} style={{ color:"#666" }}><Icon name="X" size={20} /></button>
            </div>
            <p className="text-gray-500 text-sm mb-4">Баланс: <span style={{ color:"#d4a017" }}>{balance.toLocaleString()}₽</span></p>

            <div className="flex gap-2 mb-4">
              <button onClick={() => setTopupCard(false)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${!topupCard ? "tab-active" : "text-gray-500"}`}
                style={!topupCard ? {} : { border:"1px solid rgba(255,255,255,0.07)" }}>
                Вручную
              </button>
              <button onClick={() => setTopupCard(true)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${topupCard ? "tab-active" : "text-gray-500"}`}
                style={topupCard ? {} : { border:"1px solid rgba(255,255,255,0.07)" }}>
                💳 Карта
              </button>
            </div>

            {!topupCard ? (
              <>
                <input type="number" value={topupAmount} onChange={e => setTopupAmount(e.target.value)}
                  placeholder="Сумма (₽)..." className="w-full px-4 py-3 rounded-lg mb-4" style={IS} />
                <button onClick={handleTopup}
                  className="w-full py-3 rounded-xl font-bold text-white"
                  style={{ background:"linear-gradient(135deg,#c0392b,#d4a017)" }}>
                  Пополнить
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-xl text-center"
                  style={{ background:"rgba(212,160,23,0.07)", border:"1px solid rgba(212,160,23,0.18)" }}>
                  <p className="text-xs text-gray-500 mb-2">Пополнение через банковскую карту</p>
                  <p className="text-sm font-semibold text-white mb-1">Напиши менеджеру в WhatsApp</p>
                  <p className="text-xs text-gray-500 mb-3">Укажи сумму — пришлём реквизиты для оплаты</p>
                  <button
                    onClick={() => window.open(`https://wa.me/79011505959?text=${encodeURIComponent("Хочу пополнить баланс через карту")}`, "_blank")}
                    className="w-full py-2.5 rounded-lg font-bold text-white flex items-center justify-center gap-2"
                    style={{ background:"linear-gradient(135deg,#25d366,#128c7e)" }}>
                    💬 WhatsApp +7 901 150-59-59
                  </button>
                </div>
                <p className="text-center text-xs text-gray-600">Visa · MasterCard · МИР · СБП · ЮMoney</p>
              </div>
            )}
          </div>
        </div>
      )}



      {/* ── ADMIN MODAL ── */}
      {adminOpen && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeAdmin}>
          <div className="w-full max-w-sm rounded-2xl p-6 animate-fade-in-up"
            style={{ background:"#0d0d0d", border:"1px solid rgba(192,57,43,0.3)" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-white flex items-center gap-2" style={{ fontFamily:"Oswald,sans-serif" }}>
                <Icon name="Shield" size={18} /> ПАНЕЛЬ АДМИНА
              </h2>
              <button onClick={closeAdmin} style={{ color:"#555" }}><Icon name="X" size={20} /></button>
            </div>
            {!adminAuthed ? (
              <>
                <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)}
                  placeholder="Пароль..." onKeyDown={e => e.key==="Enter" && handleAdminLogin()}
                  className="w-full px-4 py-3 rounded-lg mb-3" style={IS} />
                {adminMsg && <p className="text-red-400 text-sm mb-3">{adminMsg}</p>}
                <button onClick={handleAdminLogin}
                  className="w-full py-3 rounded-xl font-bold text-white"
                  style={{ background:"linear-gradient(135deg,#c0392b,#7b2d8b)" }}>
                  Войти
                </button>
              </>
            ) : (
              <>
                {/* Balance display */}
                <div className="flex items-center justify-between p-3 rounded-lg mb-4"
                  style={{ background:"rgba(212,160,23,0.07)", border:"1px solid rgba(212,160,23,0.15)" }}>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Текущий баланс</p>
                    <p className="text-2xl font-black" style={{ color:"#d4a017", fontFamily:"Oswald,sans-serif" }}>{balance.toLocaleString()}₽</p>
                  </div>
                  <button
                    onClick={() => { setBalance(0); setAdminMsg("Баланс обнулён"); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold"
                    style={{ background:"rgba(192,57,43,0.2)", border:"1px solid rgba(192,57,43,0.4)", color:"#ff7b7b" }}>
                    Обнулить
                  </button>
                </div>

                {/* Action tabs */}
                <div className="flex gap-1 mb-4 p-1 rounded-lg" style={{ background:"rgba(255,255,255,0.04)" }}>
                  <button onClick={() => { setAdminTab("give"); setAdminMsg(""); setAdminUser(""); setAdminAmount(""); }}
                    className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${adminTab==="give" ? "tab-active" : "text-gray-500"}`}>
                    + Выдать монеты
                  </button>
                  <button onClick={() => { setAdminTab("remove"); setAdminMsg(""); setAdminUser(""); setAdminAmount(""); }}
                    className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${adminTab==="remove" ? "" : "text-gray-500"}`}
                    style={adminTab==="remove" ? { background:"linear-gradient(135deg,#c0392b,#7b0000)", color:"white" } : {}}>
                    − Удалить монеты
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Никнейм игрока</label>
                    <input type="text" value={adminUser} onChange={e => setAdminUser(e.target.value)}
                      placeholder="Имя пользователя..." className="w-full px-3 py-2.5 rounded-lg text-sm" style={IS} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Сумма (₽)</label>
                    <input type="number" value={adminAmount} onChange={e => setAdminAmount(e.target.value)}
                      placeholder="0" className="w-full px-3 py-2.5 rounded-lg text-sm" style={IS} />
                  </div>
                </div>

                {adminMsg && (
                  <p className="text-sm mb-3" style={{ color: adminMsg.startsWith("✓") ? "#d4a017" : "#ff7b7b" }}>{adminMsg}</p>
                )}

                <button
                  onClick={adminTab==="give" ? handleGiveBalance : handleRemoveBalance}
                  className="w-full py-3 rounded-xl font-bold text-white"
                  style={{ background: adminTab==="give"
                    ? "linear-gradient(135deg,#c0392b,#d4a017)"
                    : "linear-gradient(135deg,#c0392b,#7b0000)" }}>
                  {adminTab==="give" ? "+ Выдать монеты" : "− Удалить монеты"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}