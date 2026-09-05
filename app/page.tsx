/* eslint-disable @next/next/no-img-element -- Remote editorial imagery supports the cinematic product story. */

const media = {
  hero: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=2000&q=90",
  technology: "https://images.unsplash.com/photo-1636918191572-c2e64186d918?auto=format&fit=crop&w=1400&q=86",
  portrait: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=86",
  fashion: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=86",
  city: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=86",
  product: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=86",
  food: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=86",
  landscape: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=86",
};

const advantages = [
  { index: "01", title: "电影级画面表现", text: "把推近、拉远、环绕和跟随等镜头语言变成易用预设，让普通素材也有专业叙事感。" },
  { index: "02", title: "更快完成创意验证", text: "从一句描述或一张图片开始生成多个版本，缩短拍摄、剪辑和沟通所需的时间。" },
  { index: "03", title: "覆盖多种商业场景", text: "适用于商品广告、人物短片、门店推广、社交媒体和品牌概念视觉。" },
  { index: "04", title: "为创作者降低门槛", text: "可靠的默认参数帮助新手快速上手，高级选项仍保留比例、时长和运动控制。" },
];

const steps = [
  ["01", "定义创作方向", "写下主题、主体、场景与情绪，选择商品广告、人物短片或品牌视觉等创作目标。"],
  ["02", "上传并设置素材", "上传图片、首尾帧、动作参考或已有视频，再选择输出比例、时长和镜头运动。"],
  ["03", "生成并比较结果", "提交任务后由系统异步生成，完成后直接预览，并保留原始参数用于再次迭代。"],
  ["04", "下载与持续优化", "下载满意的视频用于发布，也可以围绕同一创意继续生成不同版本。"],
];

const capabilities = [
  { title: "电影镜头预设", text: "快速推近、缓慢拉远、环绕、跟随和手持等常用镜头运动。", image: media.hero, tag: "CAMERA" },
  { title: "逼真人物动态", text: "根据画面与描述生成自然动作、姿态变化和更连贯的人物表现。", image: media.portrait, tag: "MOTION" },
  { title: "灵活视频格式", text: "支持 9:16、1:1 与 16:9，覆盖短视频、方形内容和横屏渠道。", image: media.city, tag: "FORMAT" },
  { title: "首尾帧控制", text: "分别设定开始和结束画面，让镜头转场方向更明确、更可控。", image: media.landscape, tag: "FRAMES" },
  { title: "动作参考驱动", text: "使用参考视频提供动作节奏，让角色运动更贴近原始表演。", image: media.fashion, tag: "REFERENCE" },
  { title: "高清异步生成", text: "生成任务在云端持续运行，刷新页面后仍可查看进度、历史与结果。", image: media.product, tag: "RENDER" },
];

const products = [
  { code: "FX", name: "视频特效", en: "EFFECT", text: "为图片和视频加入电影运镜与动态效果。", status: "已开放", href: "/studio" },
  { code: "SO", name: "真实影像", en: "SOUL", text: "面向人物、时尚和生活方式的写实图像生成。", status: "规划中" },
  { code: "CA", name: "智能画布", en: "CANVAS", text: "通过语义指令完成局部修改、扩图和产品置入。", status: "规划中" },
  { code: "SP", name: "数字人视频", en: "SPEAK", text: "把静态人物转化为自然表达的口播视频。", status: "规划中" },
  { code: "CH", name: "角色中心", en: "CHARACTER", text: "创建并管理可持续使用的一致性数字角色。", status: "规划中" },
  { code: "UG", name: "营销内容", en: "UGC BUILDER", text: "围绕商品和品牌批量构建多版本营销素材。", status: "规划中" },
  { code: "AR", name: "灵感与教程", en: "ARTICLES", text: "沉淀提示词、镜头方法和真实创作案例。", status: "筹备中" },
];

const scenarios = [
  { initials: "SC", role: "短视频创作者", title: "持续更新社交内容", text: "用人物图与创意描述快速尝试多个镜头版本，减少每条内容的前期制作时间。" },
  { initials: "EC", role: "电商品牌", title: "把商品主图变成广告", text: "围绕同一商品素材生成竖屏、方形与横屏视频，适配不同投放渠道。" },
  { initials: "LB", role: "本地商家", title: "低成本展示门店与服务", text: "让环境、菜品或服务图片形成有镜头推进感的短片，用于日常推广。" },
  { initials: "CD", role: "创意团队", title: "在拍摄前验证概念", text: "用 AI 视频预演创意、构图与节奏，再决定值得投入正式制作的方向。" },
];

const faqs = [
  ["映作是如何生成视频的？", "选择生成模式，输入画面描述并上传所需素材，再设置比例、时长和镜头运动。系统会创建异步任务，完成后返回可预览的视频结果。"],
  ["上传的图片和视频是否安全？", "素材、任务与结果按照登录用户隔离，其他用户无法通过普通页面访问你的创作记录。"],
  ["目前支持哪些生成方式？", "当前支持文生视频、图生视频、首尾帧、动作参考和视频重绘五种工作流。"],
  ["可以生成哪些视频比例和时长？", "工作台支持 9:16、1:1 和 16:9，并提供 5 秒与 10 秒时长选项；实际可用参数也会受到模型能力限制。"],
  ["生成失败会扣除积分吗？", "创建任务时会预扣对应积分；如果模型任务确认失败，系统会把本次消耗的积分退回账户。"],
  ["如何购买和查看积分？", "登录后可在价格页购买积分包，并在账户中心查看当前余额和每一笔积分变动记录。"],
];

export default function Home() {
  return (
    <main className="marketing-page brand-portal">
      <div className="announcement">新用户注册即领 20 积分 <a href="/auth?mode=register">免费开始 ↗</a></div>
      <header className="marketing-nav">
        <a className="brand brand-dark" href="#top" aria-label="映作首页"><span className="brand-mark">Y</span><span>映作</span><small>YINGZO</small></a>
        <nav aria-label="网站导航">
          <a href="#top">首页</a><a href="#effects">视频特效</a><a href="#products">Soul</a><a href="#products">Canvas</a>
          <a href="#products">Speak</a><a href="#products">Character</a><a href="#products">UGC Builder</a><a href="#stories">案例</a>
        </nav>
        <div className="marketing-nav-actions"><a className="nav-text-link" href="/pricing">价格</a><a className="nav-cta" href="/auth">登录/注册 <span>↗</span></a></div>
      </header>

      <section className="marketing-hero" id="top" style={{ backgroundImage: `url(${media.hero})` }}>
        <div className="hero-shade" />
        <div className="hero-content">
          <p>AI VIDEO CREATION PLATFORM</p>
          <h1>革新视频创作</h1>
          <span>用映作的 AI 视频技术，把文字与静态画面转化为有叙事、有运镜、有质感的动态内容。</span>
          <div className="hero-actions"><a className="hero-primary" href="/auth?mode=register">免费注册领取积分 ↗</a><a className="hero-secondary" href="/studio">进入视频工作台</a></div>
        </div>
        <div className="hero-facts"><span>电影级运镜</span><span>真实模型生成</span><span>多比例输出</span><span>异步任务</span></div>
      </section>

      <section className="technology-section" id="technology">
        <div className="section-kicker"><span>01</span><p>核心技术</p></div>
        <div className="technology-grid">
          <div className="technology-copy"><p className="lime-label">POWERED BY ADVANCED GENERATIVE VIDEO</p><h2>让静态素材拥有电影镜头语言</h2><p>映作将生成式视频模型、素材管理、镜头预设和任务队列整合为统一工作流。你只需要描述画面、上传素材并选择参数，即可完成从创意到视频的制作。</p><a href="/studio">体验真实视频生成 ↗</a></div>
          <div className="technology-media"><img src={media.technology} alt="AI 商业影像示例" /><span>IMAGE → MOTION</span></div>
        </div>
        <div className="feature-strip"><span>快速生成</span><span>安全隔离</span><span>自定义风格</span><span>高清输出</span></div>
      </section>

      <section className="advantages-section" id="effects">
        <div className="section-kicker light"><span>02</span><p>为什么选择映作</p></div>
        <div className="section-title-row"><h2>为持续创作而设计</h2><p>复杂的视频生成能力被整理为清晰步骤，让第一次使用 AI 的创作者也能快速开始。</p></div>
        <div className="advantage-grid">{advantages.map((item) => <article key={item.index}><span>{item.index}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
      </section>

      <section className="how-section" id="how">
        <div className="section-kicker"><span>03</span><p>使用流程</p></div>
        <div className="section-title-row dark"><h2>四步完成一条 AI 视频</h2><p>从创意方向到结果下载，每一次生成都保存在你的账户工作区。</p></div>
        <div className="steps-list">{steps.map(([index, title, text]) => <article key={index}><span>{index}</span><div><h3>{title}</h3><p>{text}</p></div><b>↗</b></article>)}</div>
        <a className="wide-cta" href="/studio">现在开始创建视频 <span>↗</span></a>
      </section>

      <section className="capabilities-section" id="capabilities">
        <div className="section-kicker light"><span>04</span><p>高级能力</p></div>
        <div className="section-title-row"><h2>一个工作台，多种生成方式</h2><p>从纯文字生成到动作参考，按照素材和创作目标选择最合适的工作流。</p></div>
        <div className="capability-grid">{capabilities.map((item) => <article key={item.title}><div><img src={item.image} alt={`${item.title}示例`} loading="lazy" /><span>↗</span><small>{item.tag}</small></div><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
      </section>

      <section className="product-matrix" id="products">
        <div className="section-kicker"><span>05</span><p>产品矩阵</p></div>
        <div className="product-matrix-heading"><h2>从视频生成开始，逐步覆盖完整内容制作</h2><p>映作首先把视频生成和账户商业闭环做扎实，再扩展图像、数字人与营销内容能力。</p></div>
        <div className="product-matrix-grid">
          {products.map((product) => (
            <article className={product.status === "已开放" ? "available" : ""} key={product.en}>
              <div className="product-code">{product.code}</div><span className="product-status">{product.status}</span>
              <small>{product.en}</small><h3>{product.name}</h3><p>{product.text}</p>
              {product.href ? <a href={product.href}>打开产品 <b>↗</b></a> : <span className="product-planned">产品规划中</span>}
            </article>
          ))}
        </div>
      </section>

      <section className="numbers-section" aria-label="平台能力数据">
        <div><strong>5</strong><span>种核心生成工作流</span></div><div><strong>3</strong><span>种主流视频比例</span></div><div><strong>2</strong><span>种常用视频时长</span></div><div><strong>24/7</strong><span>云端异步任务运行</span></div>
      </section>

      <section className="story-section" id="stories">
        <div className="section-kicker light"><span>06</span><p>创作者场景</p></div>
        <div className="section-title-row"><h2>不同创作者，同一个目标</h2><p>以下展示映作当前优先服务的典型使用场景；正式用户评价将在公开测试后逐步补充。</p></div>
        <div className="story-grid">
          {scenarios.map((item) => <article key={item.initials}><div className="story-person"><span>{item.initials}</span><div><strong>{item.role}</strong><small>典型创作场景</small></div></div><h3>{item.title}</h3><p>“{item.text}”</p><div className="story-rating">映作适用场景</div></article>)}
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="section-kicker light"><span>07</span><p>常见问题</p></div>
        <div className="faq-layout"><div><h2>开始之前<br />了解更多</h2><p>关于生成方式、素材安全、积分扣除和账户功能，这里给出清晰说明。</p><a href="/studio">打开视频工作台 ↗</a></div><div className="faq-list">{faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></div>
      </section>

      <section className="final-cta" style={{ backgroundImage: `url(${media.food})` }}><div /><p>READY TO CREATE?</p><h2>准备好创作一条<br />有镜头感的视频了吗？</h2><a href="/auth?mode=register">免费注册并开始创作 ↗</a></section>
      <footer className="marketing-footer">
        <div><a className="brand" href="#top"><span className="brand-mark">Y</span><span>映作</span></a><p>面向短视频创作者、商家和创意团队的 AI 视频生成平台。</p></div>
        <div><strong>核心产品</strong><a href="/studio">视频生成</a><a href="#capabilities">高级能力</a><a href="#products">产品矩阵</a><a href="/pricing">积分价格</a></div>
        <div><strong>账户与支持</strong><a href="/auth">登录与注册</a><a href="/account">账户中心</a><a href="#faq">常见问题</a><span>映作 V0.3</span></div>
      </footer>
    </main>
  );
}
