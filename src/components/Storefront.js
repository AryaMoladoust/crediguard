'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ShoppingBag, Heart, Menu, X, UserRound, ArrowLeft, ArrowUpLeft, Headphones, ShieldCheck, Truck, RotateCcw, Smartphone, Laptop, Watch, Gamepad2, Camera, Zap, Star, Plus, Minus, Trash2, CheckCircle2, Sparkles, ChevronLeft, MapPin, Phone, Mail, Instagram, Clock3 } from 'lucide-react';
import { toman, CATEGORIES } from '@/lib/format';

const CATEGORY_META = [
  { slug: 'mobile', name: 'گوشی هوشمند', sub: 'جدیدترین پرچم‌دارها', icon: Smartphone, tone: 'peach' },
  { slug: 'laptop', name: 'لپ‌تاپ و تبلت', sub: 'برای کار و خلاقیت', icon: Laptop, tone: 'blue' },
  { slug: 'headphone', name: 'صوتی و هدفون', sub: 'صدایی فراتر از انتظار', icon: Headphones, tone: 'lavender' },
  { slug: 'powerbank', name: 'گجت و ساعت', sub: 'همراه هوشمند تو', icon: Watch, tone: 'mint' },
  { slug: 'accessory', name: 'لوازم جانبی', sub: 'جزئیات کاربردی', icon: Zap, tone: 'sand' },
];
const money = (v) => `${toman(v)} تومان`;

function ProductVisual({ product, index = 0 }) {
  const cat = product.category || 'mobile';
  const src = product.image || `/img/${cat}.svg`;
  return <div className={`product-visual visual-${cat} visual-${index % 4}`}><span className="visual-orbit"/><img src={src} alt={product.name} loading="lazy"/><span className="visual-glow"/></div>;
}

function ProductTile({ product, index, onAdd, onOpen }) {
  const discount = product.oldPrice && product.oldPrice > product.price ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  return <article className="product-tile group">
    <div className="product-image-button" role="button" tabIndex={0} onClick={() => onOpen(product)} onKeyDown={(e) => e.key === 'Enter' && onOpen(product)} aria-label={`مشاهده ${product.name}`}>
      {discount > 0 && <span className="discount-pill">{discount}٪ تخفیف</span>}
      <button className="favorite-button" aria-label="افزودن به علاقه‌مندی‌ها" onClick={(e) => { e.stopPropagation(); e.currentTarget.classList.toggle('is-favorite'); }}><Heart size={17}/></button>
      <ProductVisual product={product} index={index}/>
      <span className="quick-view">مشاهده محصول <ArrowLeft size={14}/></span>
    </div>
    <div className="product-info">
      <div className="product-brand">{product.brand || 'موبایلر'} <span>•</span> {product.category === 'mobile' ? 'موبایل' : product.category === 'laptop' ? 'کامپیوتر' : product.category === 'headphone' ? 'صوتی' : product.category === 'powerbank' ? 'گجت' : 'جانبی'}</div>
      <button className="product-name" onClick={() => onOpen(product)}>{product.name}</button>
      <div className="rating-line"><span className="stars">★★★★★</span><span>۴٫۸</span><span className="rating-count">(۲۴ نظر)</span></div>
      <div className="product-bottom"><div><div className="stock-line">{product.stock > 0 ? <><i/> موجود در انبار · {Number(product.stock).toLocaleString('fa-IR')} عدد</> : <span className="out-stock">ناموجود</span>}</div><div className="price-line">{money(product.price)}</div></div><button className="add-button" disabled={product.stock <= 0} onClick={() => onAdd(product)} aria-label="افزودن به سبد"><Plus size={19}/></button></div>
    </div>
  </article>;
}

export default function Storefront({ initialProducts = [], databaseError = false }) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sort, setSort] = useState('popular');
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [method, setMethod] = useState('cash');
  const [mobileMenu, setMobileMenu] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const refreshId = window.setInterval(() => router.refresh(), 10000);
    return () => window.clearInterval(refreshId);
  }, [router]);
  const products = initialProducts;
  const filtered = useMemo(() => {
    let list = products.filter(p => (activeCategory === 'all' || p.category === activeCategory) && `${p.name} ${p.brand} ${p.caption || ''}`.toLowerCase().includes(query.trim().toLowerCase()));
    if (sort === 'cheap') list = [...list].sort((a,b) => a.price-b.price);
    if (sort === 'expensive') list = [...list].sort((a,b) => b.price-a.price);
    if (sort === 'popular') list = [...list].sort((a,b) => (b.sold||0)-(a.sold||0));
    return list;
  }, [products, activeCategory, query, sort]);
  const featured = useMemo(() => [...products].sort((a,b) => (b.sold||0)-(a.sold||0)).slice(0,4), [products]);
  const cartCount = cart.reduce((n, x) => n + x.qty, 0);
  const cartTotal = cart.reduce((n, x) => n + x.price*x.qty, 0);
  const add = (p) => { setCart(old => { const found=old.find(x=>x._id===p._id); return found ? old.map(x=>x._id===p._id?{...x,qty:Math.min(x.qty+1,p.stock)}:x) : [...old,{...p,qty:1}]; }); setNotice('به سبد خرید اضافه شد'); setTimeout(()=>setNotice(''),2200); };
  const changeQty = (id, delta) => setCart(old=>old.map(x=>x._id===id?{...x,qty:Math.max(1,Math.min(x.stock,x.qty+delta))}:x));
  const remove = (id) => setCart(old=>old.filter(x=>x._id!==id));
  async function submitOrder(e) {
    e.preventDefault();
    if (cart.some(item => String(item._id).startsWith('demo-'))) { setNotice('ثبت سفارش واقعی پس از اتصال MongoDB فعال می‌شود.'); setTimeout(()=>setNotice(''),4500); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customer,method,items:cart.map(x=>({productId:x._id,qty:x.qty}))})});
      const data = await response.json();
      if(!response.ok) throw new Error(data.error || 'ثبت سفارش انجام نشد');
      setCart([]); setCheckoutOpen(false); setCartOpen(false); router.refresh(); setNotice(`سفارش ${data.code} با موفقیت ثبت شد؛ موجودی انبار به‌روزرسانی شد`); setTimeout(()=>setNotice(''),6000);
    } catch(err) { setNotice(err.message); setTimeout(()=>setNotice(''),4500); }
    finally { setBusy(false); }
  }
  return <div className="mobiler-store">
    <div className="announcement"><span><Sparkles size={14}/> جشنواره پاییزه موبایلر</span><b>ارسال رایگان برای سفارش‌های بالای ۵ میلیون تومان</b><a href="#offers">مشاهده پیشنهادها <ArrowLeft size={13}/></a></div>
    <header className="store-header"><div className="header-main">
      <a href="#top" className="brand-lockup"><span className="brand-symbol"><i/><i/><i/></span><span><b>موبایلر</b><small>تجربه‌ای هوشمند از خرید</small></span></a>
      <nav className={mobileMenu?'main-nav mobile-open':'main-nav'}><a href="#top" className="active">خانه</a><a href="#categories">دسته‌بندی‌ها</a><a href="#products">فروشگاه</a><a href="#offers">پیشنهاد ویژه</a><a href="#about">درباره ما</a><a href="#support">پشتیبانی</a></nav>
      <div className="header-actions"><button className="icon-action mobile-menu-button" onClick={()=>setMobileMenu(!mobileMenu)} aria-label="منو">{mobileMenu?<X/>:<Menu/>}</button><button className="icon-action search-focus" onClick={()=>document.getElementById('store-search')?.focus()} aria-label="جستجو"><Search size={19}/></button><button className="icon-action" aria-label="علاقه‌مندی‌ها"><Heart size={19}/></button><Link className="icon-action account-action" href="/account/login" aria-label="ورود و حساب کاربری"><UserRound size={19}/></Link><button className="cart-action" onClick={()=>setCartOpen(true)}><ShoppingBag size={18}/><span>سبد خرید</span><b>{cartCount}</b></button></div>
    </div>
    <div className="search-row"><div className="search-box"><Search size={20}/><input id="store-search" value={query} onChange={e=>{setQuery(e.target.value);document.getElementById('products')?.scrollIntoView({behavior:'smooth',block:'nearest'});}} placeholder="دنبال چه محصولی می‌گردی؟ مثلاً آیفون، لپ‌تاپ، هدفون..."/><kbd>⌘ K</kbd><button onClick={()=>document.getElementById('products')?.scrollIntoView({behavior:'smooth'})}>جستجو</button></div><span className="header-help"><Headphones size={17}/> مشاوره خرید: <b>۰۲۱-۸۸۴۴۲۰۰۰</b></span></div>
    </header>

    <main id="top">
      {databaseError && <div className="db-warning">کاتالوگ نمایشی موبایلر فعال است؛ ۱۰۰ کالا با اطلاعات اولیه نمایش داده شده‌اند. تصاویر و مشخصات را می‌توانی بعداً تکمیل کنی. برای ثبت سفارش واقعی و ذخیره دائمی اطلاعات، اتصال دیتابیس لازم است.</div>}
      <section className="hero-wrap"><div className="hero-copy"><span className="eyebrow"><i/> انتخاب هوشمند، خرید مطمئن</span><h1>تکنولوژی،<br/><em>یک قدم نزدیک‌تر</em><br/>به زندگی تو.</h1><p>از جدیدترین گوشی‌ها تا ابزارهای هوشمند؛ انتخاب کن، مقایسه کن و با خیال راحت خرید کن.</p><div className="hero-buttons"><a href="#products" className="primary-cta">شروع خرید <ArrowLeft size={17}/></a><a href="#categories" className="text-cta">دسته‌بندی محصولات <ArrowUpLeft size={17}/></a></div><div className="hero-proof"><div className="proof-avatars"><span>م</span><span>س</span><span>ع</span><b>+</b></div><div><strong>بیش از ۲,۴۰۰ خرید موفق</strong><small>همراه انتخاب‌های هوشمند شما</small></div><div className="proof-divider"/><div className="hero-rating"><span>★★★★★</span><b>۴.۹ از ۵</b></div></div></div>
        <div className="hero-art"><div className="hero-orange-orb"/><div className="hero-blue-orb"/><div className="hero-grid"/><div className="hero-product hero-phone"><div className="phone-camera"><i/><i/><i/></div><div className="phone-screen"><span>01:28</span><b>∞</b></div></div><div className="hero-product hero-headphone"><div className="headband"/><div className="earcup left"/><div className="earcup right"/></div><div className="hero-float-card"><span className="float-icon"><Zap size={17}/></span><div><b>پیشنهاد امروز</b><small>تا ۳۰٪ تخفیف ویژه</small></div><strong>٪۳۰-</strong></div><div className="hero-side-note">FEEL THE<br/><b>FUTURE</b><span>—</span></div><div className="hero-caption">MOBILER / TECH STORE</div></div>
      </section>

      <section className="trust-strip"><div><span><ShieldCheck/></span><p><b>ضمانت اصالت کالا</b><small>خرید با اطمینان کامل</small></p></div><div><span><Truck/></span><p><b>ارسال سریع و مطمئن</b><small>تحویل در سراسر ایران</small></p></div><div><span><RotateCcw/></span><p><b>۷ روز ضمانت بازگشت</b><small>خرید بدون نگرانی</small></p></div><div><span><Headphones/></span><p><b>پشتیبانی واقعی</b><small>همیشه کنار شما هستیم</small></p></div></section>

      <section id="categories" className="section-block category-section"><div className="section-heading"><div><span className="section-kicker">دنیای موبایلر</span><h2>چی لازم داری <em>امروز؟</em></h2><p>محصول مورد نظرت رو از بین دسته‌بندی‌ها پیدا کن.</p></div><a href="#products" className="section-link">همه محصولات <ArrowLeft size={16}/></a></div><div className="category-grid">{CATEGORY_META.map(({slug,name,sub,icon:Icon,tone})=><button key={slug} className={`category-card ${tone}`} onClick={()=>{setActiveCategory(slug);document.getElementById('products')?.scrollIntoView({behavior:'smooth'});}}><span className="category-icon"><Icon size={32} strokeWidth={1.6}/></span><b>{name}</b><small>{sub}</small><span className="category-arrow"><ArrowUpLeft size={16}/></span></button>)}</div></section>

      <section id="offers" className="campaign-banner"><div className="campaign-content"><span className="campaign-tag"><Sparkles size={13}/> پیشنهاد محدود</span><h2>هوشمندانه‌تر بخر،<br/><em>بیشتر لذت ببر.</em></h2><p>منتخب محصولات دیجیتال با قیمت‌های استثنایی؛ فرصت رو از دست نده.</p><a href="#products" className="campaign-button">دیدن پیشنهادها <ArrowLeft size={16}/></a></div><div className="campaign-art"><div className="campaign-disc disc-one"/><div className="campaign-disc disc-two"/><div className="campaign-device"><div/></div><div className="campaign-label">TECH<br/>DAYS</div><span className="campaign-percent">UP TO <b>30%</b></span></div></section>

      <section id="products" className="section-block products-section"><div className="section-heading"><div><span className="section-kicker">منتخب تیم موبایلر</span><h2>{query?`نتایج جستجو برای «${query}»`:'محصولاتی که دوست‌شان داری'}</h2><p>انتخاب‌هایی جذاب از بین جدیدترین و محبوب‌ترین کالاها.</p></div><div className="product-controls"><label>مرتب‌سازی <select value={sort} onChange={e=>setSort(e.target.value)}><option value="popular">محبوب‌ترین</option><option value="cheap">ارزان‌ترین</option><option value="expensive">گران‌ترین</option></select></label></div></div><div className="filter-chips"><button className={activeCategory==='all'?'selected':''} onClick={()=>setActiveCategory('all')}>همه کالاها</button>{CATEGORIES.map(c=><button key={c.slug} className={activeCategory===c.slug?'selected':''} onClick={()=>setActiveCategory(c.slug)}>{c.name}</button>)}</div>
        {filtered.length?<div className="product-grid">{filtered.map((p,i)=><ProductTile key={p._id} product={p} index={i} onAdd={add} onOpen={setProductOpen}/>)}</div>:<div className="empty-results"><Search size={28}/><b>محصولی پیدا نکردیم</b><span>عبارت جستجو یا دسته‌بندی را تغییر بده.</span><button onClick={()=>{setQuery('');setActiveCategory('all')}}>نمایش همه محصولات</button></div>}
        <div className="catalog-foot"><span>نمایش {filtered.length.toLocaleString('fa-IR')} محصول از {products.length.toLocaleString('fa-IR')} کالا</span><span>موجودی و قیمت‌ها از فروشگاه به‌روزرسانی می‌شوند</span></div>
      </section>

      <section className="editorial-row"><div className="editorial-card editorial-dark"><span className="editorial-label">MOBILER PICKS / 01</span><div className="editorial-copy"><h3>ابزارهایی برای<br/><em>روزهای بزرگ‌تر.</em></h3><p>تجهیزات حرفه‌ای برای ایده‌هایی که متوقف نمی‌شوند.</p><a href="#products">کشف محصولات <ArrowLeft size={15}/></a></div><div className="editorial-shape shape-laptop"><div/></div></div><div className="editorial-card editorial-orange"><span className="editorial-label">SMART LIFE / 02</span><div className="editorial-copy"><h3>زندگی متصل،<br/><em>ساده‌تر از همیشه.</em></h3><p>گجت‌های هوشمند برای سبک زندگی مدرن.</p><a href="#categories">ببین چی داریم <ArrowLeft size={15}/></a></div><div className="editorial-shape shape-watch"><div/></div></div></section>

      <section className="service-band"><div className="service-title"><span className="section-kicker">چرا موبایلر؟</span><h2>خرید خوب، فقط<br/><em>شروع ماجراست.</em></h2></div><div className="service-points"><div><ShieldCheck/><b>اصالت تضمین‌شده</b><small>کالای اصل با ضمانت معتبر</small></div><div><Truck/><b>ارسال قابل پیگیری</b><small>از انبار تا درِ خانه شما</small></div><div><Headphones/><b>مشاوره تخصصی</b><small>کمک می‌کنیم درست انتخاب کنی</small></div></div></section>

      <section id="about" className="about-section"><div><span className="section-kicker">داستان موبایلر</span><h2>تکنولوژی باید<br/><em>برای همه ساده باشد.</em></h2></div><p>موبایلر یک فروشگاه تخصصی کالای دیجیتال است؛ جایی برای کشف، مقایسه و تهیه محصولات مورد نیاز زندگی امروز. ما تلاش می‌کنیم تجربه خرید آنلاین را شفاف، سریع و قابل اعتماد کنیم.</p><div className="about-stats"><div><b>۱۰۰+</b><small>محصول متنوع</small></div><div><b>۷ روز</b><small>ضمانت بازگشت</small></div><div><b>۲۴/۷</b><small>ثبت سفارش آنلاین</small></div></div></section>

      <section id="support" className="support-section"><div className="support-copy"><span className="section-kicker">همیشه در دسترس</span><h2>سوالی داری؟<br/><em>ما اینجاییم.</em></h2><p>برای انتخاب محصول، پیگیری سفارش یا هر موضوع دیگه‌ای با تیم پشتیبانی موبایلر در ارتباط باش.</p><a href="tel:02188442000" className="support-call"><Phone size={17}/> ۰۲۱-۸۸۴۴۲۰۰۰</a></div><div className="support-details"><div><span><Clock3/></span><p><b>ساعات پاسخ‌گویی</b><small>شنبه تا پنجشنبه، ۹ تا ۱۸</small></p></div><div><span><MapPin/></span><p><b>نشانی فروشگاه</b><small>تهران، خیابان ولیعصر، پلاک ۲۴۸، واحد ۳</small></p></div><div><span><Mail/></span><p><b>ایمیل پشتیبانی</b><small>support@mobiler.example</small></p></div></div></section>
    </main>
    <footer className="store-footer"><div className="footer-main"><div className="footer-brand"><a href="#top" className="brand-lockup"><span className="brand-symbol"><i/><i/><i/></span><span><b>موبایلر</b><small>تجربه‌ای هوشمند از خرید</small></span></a><p>دنیای تکنولوژی، با انتخابی مطمئن و تجربه‌ای ساده‌تر. همراه تو در هر قدم از مسیر دیجیتال.</p><div className="social-links"><a href="#contact" aria-label="اینستاگرام"><Instagram/></a><a href="#contact" aria-label="شبکه اجتماعی"><span>𝕏</span></a></div></div><div><b>دسترسی سریع</b><a href="#products">همه محصولات</a><a href="#categories">دسته‌بندی‌ها</a><a href="#offers">پیشنهادهای ویژه</a><a href="#about">درباره موبایلر</a></div><div><b>راهنمای خرید</b><a href="#support">روش‌های ارسال</a><a href="#support">ضمانت بازگشت</a><a href="#support">سوالات متداول</a><a href="#support">پیگیری سفارش</a></div><div><b>خبرهای خوب، زودتر از همه</b><p>برای اطلاع از پیشنهادهای تازه همراه ما باش.</p><form className="newsletter" onSubmit={e=>{e.preventDefault();setNotice('عضویت شما در خبرنامه ثبت شد');setTimeout(()=>setNotice(''),2500)}}><input type="email" required placeholder="ایمیل شما"/><button aria-label="عضویت"><ArrowLeft size={17}/></button></form><small className="newsletter-note">با عضویت، از تخفیف‌ها باخبر می‌شی.</small></div></div><div className="footer-bottom"><span>© ۱۴۰۵ موبایلر؛ تمامی حقوق محفوظ است.</span><span>ساخته‌شده برای تجربه‌ای بهتر از خرید آنلاین <span className="footer-heart">♥</span></span></div><div className="footer-orange"/></footer>

    {notice && <div className="toast-message"><CheckCircle2 size={18}/>{notice}</div>}
    {cartOpen && <div className="overlay" onClick={()=>setCartOpen(false)}><aside className="side-drawer" onClick={e=>e.stopPropagation()}><div className="drawer-head"><div><b>سبد خرید تو</b><small>{cartCount} کالا در سبد</small></div><button onClick={()=>setCartOpen(false)}><X/></button></div>{cart.length?<><div className="cart-lines">{cart.map(p=><div className="cart-line" key={p._id}><ProductVisual product={p}/><div className="cart-line-info"><b>{p.name}</b><small>{money(p.price)}</small><div className="qty-control"><button onClick={()=>changeQty(p._id,-1)}><Minus size={13}/></button><span>{p.qty.toLocaleString('fa-IR')}</span><button onClick={()=>changeQty(p._id,1)}><Plus size={13}/></button><button className="remove-item" onClick={()=>remove(p._id)}><Trash2 size={14}/></button></div></div></div>)}</div><div className="drawer-total"><div><span>جمع سبد خرید</span><b>{money(cartTotal)}</b></div><button onClick={()=>{setCartOpen(false);setCheckoutOpen(true)}}>ادامه و ثبت سفارش <ArrowLeft size={17}/></button></div></>:<div className="empty-cart"><ShoppingBag size={40}/><b>سبدت هنوز خالیه!</b><span>وقتشه یه انتخاب جذاب داشته باشی.</span><button onClick={()=>setCartOpen(false)}>رفتن به فروشگاه</button></div>}</aside></div>}
    {checkoutOpen && <div className="overlay" onClick={()=>setCheckoutOpen(false)}><div className="checkout-modal" onClick={e=>e.stopPropagation()}><div className="drawer-head"><div><b>تکمیل سفارش</b><small>اطلاعات تحویل را وارد کن</small></div><button onClick={()=>setCheckoutOpen(false)}><X/></button></div><form onSubmit={submitOrder} className="checkout-form"><label>نام و نام خانوادگی<input required minLength="2" value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})} placeholder="مثلاً سارا احمدی"/></label><label>شماره موبایل<input required pattern="09[0-9]{9}" value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})} placeholder="09123456789"/></label><label>آدرس کامل تحویل<textarea required minLength="5" value={customer.address} onChange={e=>setCustomer({...customer,address:e.target.value})} placeholder="استان، شهر، خیابان، پلاک..."/></label><div className="payment-options"><label><input type="radio" checked={method==='cash'} onChange={()=>setMethod('cash')}/> پرداخت نقدی</label><label><input type="radio" checked={method==='installment'} onChange={()=>setMethod('installment')}/> درخواست خرید اقساطی</label></div><div className="checkout-total"><span>مبلغ سفارش</span><b>{money(cartTotal)}</b></div><button className="submit-order" disabled={busy}>{busy?'در حال ثبت سفارش...':'ثبت سفارش نهایی'} <ArrowLeft size={17}/></button><small>اطلاعات سفارش در سامانه فروشگاه ثبت می‌شود. پرداخت آنلاین در این نسخه فعال نیست.</small></form></div></div>}
    {productOpen && <div className="overlay" onClick={()=>setProductOpen(null)}><div className="product-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setProductOpen(null)}><X/></button><ProductVisual product={productOpen}/><div><span className="section-kicker">{productOpen.brand}</span><h3>{productOpen.name}</h3><p>{productOpen.description || productOpen.caption}</p><div className="modal-stock">{productOpen.stock>0?'موجود در انبار':'ناموجود'} · {productOpen.stock.toLocaleString('fa-IR')} عدد</div><b className="modal-price">{money(productOpen.price)}</b><button className="submit-order" disabled={productOpen.stock<=0} onClick={()=>{add(productOpen);setProductOpen(null)}}>افزودن به سبد خرید <ShoppingBag size={17}/></button></div></div></div>}
  </div>;
}
