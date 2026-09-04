/* eslint-disable @next/next/no-img-element -- Remote editorial imagery is used for the visual showcase. */

const media = {
  cinema: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1800&q=88",
  portrait: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=86",
  fashion: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=86",
  city: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=86",
  product: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=86",
  food: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=86",
  car: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=86",
  landscape: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=86",
};

const creationTools = [
  { mark: "文", title: "文生视频", detail: "用一句话构建完整镜头", href: "/studio?mode=text-to-video" },
  { mark: "图", title: "图生视频", detail: "让静态画面自然运动", href: "/studio?mode=image-to-video" },
  { mark: "帧", title: "首尾帧", detail: "精确控制开始与结束", href: "/studio?mode=first-last-frame" },
  { mark: "动", title: "动作参考", detail: "复用真实动作与节奏", href: "/studio?mode=motion-control" },
  { mark: "绘", title: "视频重绘", detail: "重塑已有视频的风格", href: "/studio?mode=video-to-video" },
];

const gallery = [
  { title: "香氛商业片", category: "商品广告", image: media.product, className: "tall" },
  { title: "夜间追车", category: "电影镜头", image: media.car, className: "wide" },
  { title: "自然人像", category: "人物短片", image: media.portrait, className: "standard" },
  { title: "山野远景", category: "旅行内容", image: media.landscape, className: "tall" },
  { title: "东京漫游", category: "城市影像", image: media.city, className: "standard" },
  { title: "造型画报", category: "时尚创意", image: media.fashion, className: "wide" },
  { title: "餐桌故事", category: "门店推广", image: media.food, className: "standard" },
];

export default function Home() {
  return (
    <main className="hf-home">
      <header className="hf-nav">
        <a className="hf-brand" href="/" aria-label="映作首页">
          <span className="hf-brand-mark">Y</span>
          <strong>映作</strong>
        </a>
        <nav className="hf-main-links" aria-label="主导航">
          <a className="active" href="#explore">探索</a>
          <a href="/studio?mode=image-to-video">图片</a>
          <a href="/studio?mode=text-to-video">视频</a>
          <a href="/studio?mode=video-to-video">编辑</a>
          <a href="#templates">模板</a>
          <a href="/studio">电影工作室</a>
        </nav>
        <div className="hf-nav-actions">
          <a className="hf-pricing-link" href="/pricing">价格</a>
          <a className="hf-login-link" href="/auth">登录</a>
          <a className="hf-signup" href="/auth?mode=register">免费开始</a>
        </div>
      </header>

      <div className="hf-offer">
        <span>新用户礼遇</span>
        注册即可获得 20 积分，开始你的第一条 AI 视频
        <a href="/auth?mode=register">立即领取 <b>↗</b></a>
      </div>

      <section className="hf-showcase" id="explore" aria-label="精选创作能力">
        <a className="hf-feature hf-feature-main" href="/studio?mode=text-to-video">
          <img src={media.cinema} alt="电影放映厅中的光影" />
          <div className="hf-feature-shade" />
          <div className="hf-feature-copy">
            <span className="hf-chip">全新上线</span>
            <h1>Seedance 2.5</h1>
            <p>从一个想法开始，生成富有叙事感的电影级动态画面。</p>
            <span className="hf-card-action">开始创作 <b>↗</b></span>
          </div>
        </a>
        <a className="hf-feature hf-feature-side top" href="/studio?mode=image-to-video">
          <img src={media.portrait} alt="自然光人物肖像" />
          <div className="hf-feature-shade" />
          <div className="hf-feature-copy">
            <span className="hf-feature-index">01 / 02</span>
            <h2>让照片拥有镜头语言</h2>
            <p>电影运镜预设，一键赋予画面情绪。</p>
          </div>
        </a>
        <a className="hf-feature hf-feature-side bottom" href="/studio?mode=first-last-frame">
          <img src={media.car} alt="夜间公路上的跑车" />
          <div className="hf-feature-shade" />
          <div className="hf-feature-copy">
            <span className="hf-feature-index">02 / 02</span>
            <h2>起点与终点，由你定义</h2>
            <p>用首尾帧控制每一次转场。</p>
          </div>
        </a>
      </section>

      <section className="hf-create">
        <p className="hf-eyebrow">YINGZO CREATIVE STUDIO</p>
        <h2>今天，想创作什么？</h2>
        <p className="hf-create-lead">从文字、图片或一段已有视频出发，把你的想法变成可以发布的作品。</p>
        <div className="hf-tool-grid">
          {creationTools.map((tool) => (
            <a href={tool.href} key={tool.title}>
              <span className="hf-tool-mark">{tool.mark}</span>
              <span><strong>{tool.title}</strong><small>{tool.detail}</small></span>
              <b>↗</b>
            </a>
          ))}
        </div>
      </section>

      <section className="hf-trending" id="templates">
        <div className="hf-section-heading">
          <div><p>创作灵感</p><h2>正在流行</h2></div>
          <div className="hf-filters" aria-label="作品分类">
            <span className="selected">全部</span><span>电影感</span><span>商品</span><span>人物</span><span>社交媒体</span>
          </div>
          <a href="/studio">查看全部 <b>↗</b></a>
        </div>
        <div className="hf-gallery">
          {gallery.map((item) => (
            <a className={item.className} href="/studio" key={item.title}>
              <img src={item.image} alt={`${item.title}创作示例`} loading="lazy" />
              <span className="hf-gallery-shade" />
              <span className="hf-gallery-copy"><small>{item.category}</small><strong>{item.title}</strong></span>
              <span className="hf-gallery-arrow">↗</span>
            </a>
          ))}
        </div>
      </section>

      <section className="hf-bottom-cta">
        <div>
          <p>从第一帧开始</p>
          <h2>让每一个画面<br />都开始运动</h2>
        </div>
        <a href="/studio">进入视频工作台 <span>↗</span></a>
      </section>

      <footer className="hf-footer">
        <a className="hf-brand" href="/"><span className="hf-brand-mark">Y</span><strong>映作</strong></a>
        <p>为创作者与商家打造的 AI 视频创作平台。</p>
        <nav><a href="/pricing">价格</a><a href="/account">账户</a><a href="/studio">工作台</a></nav>
        <span>© 2026 YINGZO</span>
      </footer>
    </main>
  );
}
