/* eslint-disable @next/next/no-img-element -- Prototype uses licensed remote editorial images. */

const media = {
  perfume: "https://images.unsplash.com/photo-1598634222670-87c5f558119c?auto=format&fit=crop&w=1800&q=88",
  skincare: "https://images.unsplash.com/photo-1613803745799-ba6c10aace85?auto=format&fit=crop&w=1400&q=85",
  botanical: "https://images.unsplash.com/photo-1636918191572-c2e64186d918?auto=format&fit=crop&w=1400&q=85",
  restaurant: "https://images.unsplash.com/photo-1718578061045-b17fe1dbbd77?auto=format&fit=crop&w=1400&q=85",
  cream: "https://images.unsplash.com/photo-1638609927252-9982beed7af8?auto=format&fit=crop&w=1400&q=85",
};

const advantages = [
  { index: "01", title: "电影级镜头表现", text: "把复杂的推、拉、摇、移变成可选择的镜头预设，让商品和人物画面更接近真实拍摄。" },
  { index: "02", title: "快速生成与迭代", text: "从一张图片开始创建多个视频版本，减少拍摄、剪辑和反复沟通的时间。" },
  { index: "03", title: "覆盖多种商业场景", text: "适用于商品广告、门店推广、社媒内容、人物短片和品牌概念片。" },
  { index: "04", title: "创作者友好", text: "模板和默认参数先给出可靠结果，高级用户仍可控制镜头、时长和运动强度。" },
];

const steps = [
  ["01", "确定创作方向", "明确商品、人物或门店的传播目标，选择适合的平台比例和画面风格。"],
  ["02", "上传并设置素材", "上传图片、首尾帧或动作参考视频，再选择镜头预设与生成参数。"],
  ["03", "生成与比较结果", "任务进入生成队列，完成后直接预览，并保留参数以便再次生成。"],
  ["04", "下载并持续优化", "将结果用于短视频和广告渠道，根据反馈继续制作新的创意版本。"],
];

const capabilities = [
  { title: "电影镜头预设", text: "推近、环绕、手持、轨道和快速拉远。", image: media.perfume },
  { title: "首尾帧控制", text: "锁定视频开始和结束画面，控制转场方向。", image: media.skincare },
  { title: "动作参考", text: "用参考视频驱动人物节奏、动作和姿态。", image: media.botanical },
  { title: "灵活画面比例", text: "支持竖屏、方形和横屏社交媒体格式。", image: media.restaurant },
  { title: "视频重绘", text: "以现有视频为基础修改风格和画面表达。", image: media.cream },
  { title: "异步任务工作台", text: "任务持续运行，历史、进度和结果不会因刷新丢失。", image: media.perfume },
];

const useCases = [
  { title: "电商商品广告", tag: "PRODUCT", text: "把商品主图快速制作成竖屏广告和上新素材。", image: media.skincare },
  { title: "本地门店宣传", tag: "LOCAL", text: "让环境、美食和服务项目图片形成有镜头感的短片。", image: media.restaurant },
  { title: "创作者社媒内容", tag: "SOCIAL", text: "用人物和角色素材制作有节奏的短视频片段。", image: media.botanical },
  { title: "品牌概念视觉", tag: "BRAND", text: "低成本验证产品大片、视觉风格和创意方向。", image: media.perfume },
];

const faqs = [
  ["映作是如何生成视频的？", "选择生成模式并上传所需素材，设置描述、比例、时长和镜头运动后，系统会创建异步任务并在完成后返回视频结果。"],
  ["上传的图片和视频是否安全？", "素材与任务按匿名工作区隔离，其他访客无法读取。正式账号系统接入后将进一步绑定用户身份和数据策略。"],
  ["现在支持哪些生成方式？", "当前核心层支持文生视频、图生视频、首尾帧、动作控制和视频重绘五种工作流。"],
  ["视频可以用于哪些平台？", "可以选择 9:16、1:1 和 16:9，分别适配短视频、方形内容和横屏视频渠道。"],
  ["目前生成的是真实 AI 视频吗？", "上传、任务、进度和结果管理都是真实系统；当前底层为模拟模型，接入正式视频 API 后会替换为真实生成结果。"],
  ["后续会增加登录和支付吗？", "会。登录、会员和支付将使用独立模板接入，不会改变当前素材与生成任务核心。"],
];

export default function Home() {
  return (
    <main className="marketing-page">
      <div className="announcement">AI 视频生成核心版本开放测试 <a href="/studio">立即体验 ↗</a></div>
      <header className="marketing-nav">
        <a className="brand brand-dark" href="#top" aria-label="映作首页"><span className="brand-mark">Y</span><span>映作</span><small>YINGZO</small></a>
        <nav aria-label="网站导航">
          <a href="#top">首页</a><a href="#features">核心特性</a><a href="#how">使用方法</a><a href="#use-cases">应用场景</a><a href="#faq">常见问题</a>
        </nav>
        <a className="nav-cta" href="/studio">开始创作 <span>↗</span></a>
      </header>

      <section className="marketing-hero" id="top" style={{ backgroundImage: `url(${media.perfume})` }}>
        <div className="hero-shade" />
        <div className="hero-content">
          <p>AI IMAGE & VIDEO GENERATOR</p>
          <h1>让每一张图片<br />成为有镜头感的视频</h1>
          <span>面向短视频创作者和商家的 AI 视频工作台。从商品图、人物图或门店图开始，快速生成可发布的商业内容。</span>
          <div className="hero-actions"><a className="hero-primary" href="/studio">免费开始创作 ↗</a><a className="hero-secondary" href="#how">了解使用方法</a></div>
        </div>
        <div className="hero-facts"><span>图生视频</span><span>镜头控制</span><span>首尾帧</span><span>动作参考</span></div>
      </section>

      <section className="technology-section">
        <div className="section-kicker"><span>01</span><p>技术与产品</p></div>
        <div className="technology-grid">
          <div className="technology-copy"><p className="lime-label">POWERED BY GENERATIVE VIDEO</p><h2>从静态素材到动态商业内容</h2><p>映作把图片、文字描述、动作参考和镜头控制组合在一个工作区中。用户不需要理解复杂的模型参数，也可以从模板开始创建视频；需要精细控制时，再逐步展开高级选项。</p><a href="/studio">进入视频工作台 ↗</a></div>
          <div className="technology-media"><img src={media.botanical} alt="护肤品商业影像示例" /><span>IMAGE → MOTION</span></div>
        </div>
        <div className="feature-strip"><span>异步生成</span><span>素材隔离</span><span>自定义风格</span><span>多比例输出</span></div>
      </section>

      <section className="advantages-section" id="features">
        <div className="section-kicker light"><span>02</span><p>为什么选择映作</p></div>
        <div className="section-title-row"><h2>为持续创作而设计</h2><p>保留专业控制，但把每一步压缩成商家和创作者可以理解的操作。</p></div>
        <div className="advantage-grid">{advantages.map((item) => <article key={item.index}><span>{item.index}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
      </section>

      <section className="how-section" id="how">
        <div className="section-kicker"><span>03</span><p>使用方法</p></div>
        <div className="section-title-row dark"><h2>四步完成一条 AI 视频</h2><p>从创意方向到结果下载，所有生成任务都保存在同一个工作区。</p></div>
        <div className="steps-list">{steps.map(([index, title, text]) => <article key={index}><span>{index}</span><div><h3>{title}</h3><p>{text}</p></div><b>↗</b></article>)}</div>
        <a className="wide-cta" href="/studio">现在开始创建视频 <span>↗</span></a>
      </section>

      <section className="capabilities-section">
        <div className="section-kicker light"><span>04</span><p>高级能力</p></div>
        <div className="section-title-row"><h2>一个工作台，多种生成方式</h2><p>当前先搭建统一工作流，正式模型接入后继续扩展角色一致性与电影光学控制。</p></div>
        <div className="capability-grid">{capabilities.map((item) => <article key={item.title}><div><img src={item.image} alt="" loading="lazy" /><span>↗</span></div><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
      </section>

      <section className="numbers-section">
        <div><strong>5</strong><span>种核心生成模式</span></div><div><strong>3</strong><span>种主流视频比例</span></div><div><strong>100%</strong><span>任务历史可恢复</span></div><div><strong>1</strong><span>套统一模型适配层</span></div>
      </section>

      <section className="use-cases-section" id="use-cases">
        <div className="section-kicker"><span>05</span><p>应用场景</p></div>
        <div className="section-title-row dark"><h2>从商品上新到日常内容</h2><p>核心功能围绕真实商业素材设计，而不是只展示技术演示。</p></div>
        <div className="use-case-grid">{useCases.map((item) => <article key={item.title}><div><img src={item.image} alt={`${item.title}示例`} loading="lazy" /><span>{item.tag}</span></div><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
      </section>

      <section className="audience-section">
        <div className="audience-copy"><p className="lime-label">BUILT FOR SMALL TEAMS</p><h2>少一点制作成本，多一点创意测试</h2><p>短视频创作者、电商商家和本地门店可以利用已有素材快速制作多个方向，先验证内容，再决定是否投入正式拍摄。</p><a href="/studio">体验核心生成流程 ↗</a></div>
        <div className="audience-roles"><article><span>SC</span><div><h3>短视频创作者</h3><p>持续生产人物、角色和社媒视频片段。</p></div></article><article><span>EC</span><div><h3>电商商家</h3><p>把商品图变成上新、投放和详情页视频。</p></div></article><article><span>LB</span><div><h3>本地商家</h3><p>用门店、菜品和服务素材制作宣传内容。</p></div></article></div>
      </section>

      <section className="faq-section" id="faq">
        <div className="section-kicker light"><span>06</span><p>常见问题</p></div>
        <div className="faq-layout"><div><h2>还有问题？</h2><p>这里集中说明当前核心版本的范围和后续接入方式。</p><a href="/studio">打开工作台 ↗</a></div><div className="faq-list">{faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></div>
      </section>

      <section className="final-cta" style={{ backgroundImage: `url(${media.restaurant})` }}><div /><p>READY TO CREATE?</p><h2>开始制作你的第一条 AI 视频</h2><a href="/studio">进入映作工作台 ↗</a></section>
      <footer className="marketing-footer"><div><a className="brand" href="#top"><span className="brand-mark">Y</span><span>映作</span></a><p>面向短视频创作者和商家的 AI 视频生成工作台。</p></div><div><strong>快速链接</strong><a href="/studio">视频生成</a><a href="#features">核心特性</a><a href="#how">使用方法</a></div><div><strong>产品</strong><a href="#use-cases">应用场景</a><a href="#faq">常见问题</a><span>核心版本 V0.2</span></div></footer>
    </main>
  );
}
