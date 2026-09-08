/* eslint-disable @next/next/no-img-element -- Editorial imagery supports the product showcase. */

const media = {
  technology: "https://images.unsplash.com/photo-1636918191572-c2e64186d918?auto=format&fit=crop&w=1400&q=86",
  portrait: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=86",
  fashion: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=86",
  city: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=86",
  product: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=86",
  landscape: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=86",
  food: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=86",
};

const advantages = [
  ["01", "电影级画面表现", "真实纹理、动态光线与流畅运镜，让生成内容更接近专业影像。"],
  ["02", "快速完成创作", "从文字或图片开始生成视频，缩短从创意验证到成片的时间。"],
  ["03", "覆盖多种场景", "适用于短视频、商品广告、人物内容、品牌概念和创意预演。"],
  ["04", "创作者友好", "清晰的参数与镜头预设，让第一次使用 AI 视频的用户也能快速开始。"],
];

const steps = [
  ["01", "定义创意方向", "描述主体、场景、风格和镜头语言。"],
  ["02", "上传并设置素材", "添加图片、首尾帧、动作参考或已有视频。"],
  ["03", "生成并比较结果", "提交云端任务，查看进度并比较不同版本。"],
  ["04", "下载并持续优化", "保存满意作品，沿用参数继续调整创意。"],
];

const capabilities = [
  ["电影镜头预设", "快速推近、拉远、环绕、跟随与手持等镜头运动。", media.technology],
  ["逼真人物动态", "让静态人物产生自然动作、姿态变化与表情。", media.portrait],
  ["灵活视频格式", "支持 9:16、1:1 与 16:9，适配主流内容渠道。", media.city],
  ["首尾帧控制", "分别设置开始与结束画面，让转场更明确。", media.landscape],
  ["动作参考驱动", "通过参考视频控制角色的动作节奏与表现。", media.fashion],
  ["高保真渲染", "保留主体细节、材质与光影，生成更完整的画面。", media.product],
];

const scenarios = [
  ["短视频创作者", "持续产出更有镜头感的社交内容。"],
  ["电商品牌", "把商品主图转化为多比例动态广告。"],
  ["本地商家", "低成本展示门店、菜品与服务场景。"],
  ["创意团队", "在正式制作前快速验证视觉概念。"],
];

const faqs = [
  ["映作如何生成视频？", "选择工作流，输入画面描述并上传所需素材，再设置比例、时长和镜头运动即可创建任务。"],
  ["支持哪些生成方式？", "目前支持文生视频、图生视频、首尾帧、动作参考和视频重绘五种工作流。"],
  ["生成失败会扣除积分吗？", "任务创建时会预扣积分；如果模型任务确认失败，系统会自动退回本次消耗。"],
  ["会员积分如何发放？", "月度与年度会员每月发放 200 积分；年度会员全年 2400 积分按月分 12 次到账。"],
  ["怎样管理会员订阅？", "登录账户中心即可查看会员状态，并前往对应支付平台管理续订或取消。"],
];

export default function Home() {
  return (
    <main className="benchmark-home">
      <header className="benchmark-nav">
        <a className="benchmark-brand" href="#top" aria-label="映作首页"><span>Y</span><strong>映作</strong><small>YINGZO</small></a>
        <nav aria-label="网站导航"><a className="active" href="#top">首页</a><a href="#advantages">特效</a><a href="#technology">技术</a><a href="#workflow">流程</a><a href="#capabilities">能力</a><a href="#membership">会员</a><a href="#faq">常见问题</a></nav>
        <div className="benchmark-nav-actions"><a href="/pricing">价格</a><a href="/auth">登录</a><span className="nav-indicator" title="当前为浅色主题">☼</span><span className="nav-indicator" title="当前语言：中文">中</span></div>
      </header>

      <div className="benchmark-promo">AI 视频生成平台：把文字和图片转化为电影感视频 <a href="/auth?mode=register">免费体验</a></div>

      <section className="benchmark-hero" id="top">
        <div className="benchmark-hero-copy"><h1>映作，革新视频创作</h1><p>用映作的前沿技术，解锁电影级 AI 视频解决方案</p></div>
        <a className="benchmark-product-shot" href="/studio" aria-label="打开映作视频工作台"><img src="/images/studio-preview.png" alt="映作 AI 视频生成工作台界面" /></a>
      </section>

      <section className="benchmark-section benchmark-technology" id="technology">
        <div className="benchmark-section-heading"><span>AI VIDEO TECHNOLOGY</span><h2>由映作先进的 AI 视频技术驱动</h2><p>视频创作的未来，从一个更简单、更可靠的工作流开始。</p></div>
        <div className="benchmark-technology-grid">
          <div className="benchmark-wide-media"><img src={media.technology} alt="AI 影像技术示例" loading="lazy" /></div>
          <div className="benchmark-rich-copy"><h3>把静态画面转化为动态叙事</h3><p>映作将生成式视频模型、素材管理、镜头控制和异步任务整合在同一个工作台中。无论是第一次尝试 AI 视频，还是持续生产商业内容，都可以从清晰的创作流程开始。</p><p>从短视频到商品广告，从人物动态到品牌视觉，创作者可以自由选择素材、比例、时长和镜头运动，让每次生成都更接近原始创意。</p><a href="/studio">打开视频工作台 <span>↗</span></a></div>
        </div>
        <div className="benchmark-feature-strip"><span>即时生成</span><span>安全隔离</span><span>自定义风格</span><span>高清输出</span></div>
      </section>

      <section className="benchmark-section benchmark-soft-section" id="advantages">
        <div className="benchmark-section-heading"><span>WHY YINGZO</span><h2>为什么创作者选择映作</h2></div>
        <div className="benchmark-advantage-grid">{advantages.map(([index, title, text]) => <article key={index}><span>{index}</span><h3>{title}</h3><p>{text}</p><a href="/studio" aria-label={`了解${title}`}>↗</a></article>)}</div>
      </section>

      <section className="benchmark-section" id="workflow">
        <div className="benchmark-section-heading"><span>HOW IT WORKS</span><h2>四步创建一条精彩视频</h2><p>从创意方向到结果下载，每一次生成都保存在你的账户工作区。</p></div>
        <div className="benchmark-steps">{steps.map(([index, title, text]) => <article key={index}><span>{index}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
        <a className="benchmark-primary-link" href="/studio">开始创建视频 <span>↗</span></a>
      </section>

      <section className="benchmark-section benchmark-soft-section" id="capabilities">
        <div className="benchmark-section-heading"><span>ADVANCED CAPABILITIES</span><h2>覆盖完整视频创作需求</h2><p>从纯文字生成到动作参考，按照素材和创作目标选择最合适的工作流。</p></div>
        <div className="benchmark-capability-grid">{capabilities.map(([title, text, image]) => <article key={title}><img src={image} alt={`${title}示例`} loading="lazy" /><div><h3>{title}</h3><p>{text}</p><a href="/studio" aria-label={`使用${title}`}>↗</a></div></article>)}</div>
      </section>

      <section className="benchmark-stats" aria-label="平台能力数据"><div><strong>5</strong><span>核心生成工作流</span></div><div><strong>3</strong><span>主流视频比例</span></div><div><strong>2</strong><span>常用视频时长</span></div><div><strong>24/7</strong><span>云端任务运行</span></div></section>

      <section className="benchmark-section benchmark-action-section">
        <div className="benchmark-section-heading"><span>SEE YINGZO IN ACTION</span><h2>从素材到视频，都在一个工作台完成</h2><p>上传、描述、设置、生成与结果管理保持在同一条清晰路径中。</p></div>
        <a className="benchmark-action-shot" href="/studio"><img src="/images/studio-preview.png" alt="映作工作台完整界面" loading="lazy" /><span>进入工作台 ↗</span></a>
      </section>

      <section className="benchmark-section benchmark-soft-section">
        <div className="benchmark-section-heading"><span>CREATOR STORIES</span><h2>为不同创作者提供同一种自由</h2></div>
        <div className="benchmark-story-grid">{scenarios.map(([role, text], index) => <article key={role}><div><span>{String(index + 1).padStart(2, "0")}</span><small>创作者场景</small></div><p>“{text}”</p><strong>{role}</strong></article>)}</div>
      </section>

      <section className="benchmark-section benchmark-membership" id="membership">
        <div className="benchmark-section-heading"><span>MEMBERSHIP</span><h2>选择适合你的创作节奏</h2><p>月度与年度会员均按月获得 200 积分，付款成功后权益自动生效。</p></div>
        <div className="benchmark-plan-grid">
          <article><div><span>月度会员</span><strong>200</strong><small>积分 / 月</small></div><p>每月自动续费，适合灵活、持续的日常创作。</p><ul><li>每月发放 200 积分</li><li>支持全部视频生成工作流</li><li>可在账户中心管理订阅</li></ul><b>$9.90 <small>/ 月</small></b><a href="/pricing">选择月度会员 <span>↗</span></a></article>
          <article className="featured"><em>推荐</em><div><span>年度会员</span><strong>2400</strong><small>积分 / 年</small></div><p>每年支付一次，2400 积分按月分 12 次发放。</p><ul><li>每月发放 200 积分</li><li>全年共 2400 积分</li><li>相比月付全年节省 $19.80</li></ul><b>$99 <small>/ 年</small></b><a href="/pricing">选择年度会员 <span>↗</span></a></article>
        </div>
      </section>

      <section className="benchmark-section benchmark-faq" id="faq">
        <div className="benchmark-section-heading"><span>FAQ</span><h2>常见问题</h2><p>关于视频生成、积分和会员，这里给出清晰回答。</p></div>
        <div className="benchmark-faq-list">{faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div>
      </section>

      <section className="benchmark-final-cta" style={{ backgroundImage: `url(${media.food})` }}><div /><span>READY TO CREATE?</span><h2>准备好创作精彩视频了吗？</h2><p>注册即可领取 20 积分，从你的第一条 AI 视频开始。</p><a href="/auth?mode=register">免费注册并开始创作 <span>↗</span></a></section>

      <footer className="benchmark-footer"><div><a className="benchmark-brand" href="#top"><span>Y</span><strong>映作</strong><small>YINGZO</small></a><p>用 AI 重新定义视频创作。</p></div><nav><div><strong>产品</strong><a href="/studio">视频生成</a><a href="/pricing">会员方案</a></div><div><strong>账户</strong><a href="/auth">登录与注册</a><a href="/account">账户中心</a></div><div><strong>支持</strong><a href="#faq">常见问题</a><a href="/pricing">价格</a></div></nav><small>© 2026 映作 YINGZO</small></footer>
    </main>
  );
}
