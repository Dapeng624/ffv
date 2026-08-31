"use client";

/* eslint-disable @next/next/no-img-element -- Prototype supports local blob previews and external editorial media. */

import { ChangeEvent, useMemo, useState } from "react";

type Template = {
  name: string;
  category: string;
  image: string;
  prompt: string;
};

const templates: Template[] = [
  {
    name: "奢感推近",
    category: "商品广告",
    image:
      "https://images.unsplash.com/photo-1598634222670-87c5f558119c?auto=format&fit=crop&w=900&q=85",
    prompt: "镜头缓慢推近产品，硬光扫过瓶身，玻璃反射细腻，奢华广告质感",
  },
  {
    name: "纯净护肤",
    category: "商品广告",
    image:
      "https://images.unsplash.com/photo-1613803745799-ba6c10aace85?auto=format&fit=crop&w=900&q=85",
    prompt: "柔和自然光移动，产品轻微旋转，干净高级的护肤广告画面",
  },
  {
    name: "植物实验室",
    category: "社媒内容",
    image:
      "https://images.unsplash.com/photo-1636918191572-c2e64186d918?auto=format&fit=crop&w=900&q=85",
    prompt: "叶片轻轻晃动，镜头环绕护肤品，清新自然的实验室氛围",
  },
  {
    name: "探店推进",
    category: "门店宣传",
    image:
      "https://images.unsplash.com/photo-1718578061045-b17fe1dbbd77?auto=format&fit=crop&w=900&q=85",
    prompt: "镜头平稳进入餐厅，灯光逐渐亮起，电影感探店开场",
  },
];

const categories = ["为你推荐", "商品广告", "人物短片", "门店宣传", "热门特效"];

const works = [
  { name: "香水秋季上新", status: "已完成", time: "今天 14:32", image: templates[0].image },
  { name: "护肤套装种草", status: "生成中", time: "今天 14:28", image: templates[1].image },
  { name: "周末探店预告", status: "已退款", time: "昨天 20:16", image: templates[3].image },
];

export default function Home() {
  const [activeTemplate, setActiveTemplate] = useState(templates[0]);
  const [prompt, setPrompt] = useState(templates[0].prompt);
  const [ratio, setRatio] = useState("9:16");
  const [duration, setDuration] = useState("5 秒");
  const [category, setCategory] = useState(categories[0]);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "ready">("idle");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [playing, setPlaying] = useState(false);

  const previewImage = uploadUrl ?? activeTemplate.image;
  const creditCost = duration === "10 秒" ? 20 : 10;
  const visibleTemplates =
    category === "为你推荐" || category === "人物短片" || category === "热门特效"
      ? templates
      : templates.filter((template) => template.category === category);
  const statusText = useMemo(
    () =>
      status === "ready"
        ? "参数已就绪，正式版将在这里创建生成任务"
        : `预计消耗 ${creditCost} 积分`,
    [creditCost, status],
  );

  function selectTemplate(template: Template) {
    setActiveTemplate(template);
    setPrompt(template.prompt);
    setStatus("idle");
    setPlaying(false);
  }

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadUrl(URL.createObjectURL(file));
    setStatus("idle");
  }

  return (
    <main className="app-shell">
      <header className="topbar" id="top">
        <a className="brand" href="#top" aria-label="映作首页">
          <span className="brand-mark">Y</span>
          <span>映作</span>
          <small>YINGZO</small>
        </a>

        <nav className="primary-nav" aria-label="主要导航">
          <a className="active" href="#create">生成</a>
          <a href="#templates">模板</a>
          <a href="#works">我的作品</a>
          <a href="#pricing">价格</a>
        </nav>

        <div className="account-actions">
          <button className="credit-pill" type="button" title="账户积分">
            <span className="credit-dot" /> 120 积分
          </button>
          <button className="avatar-button" type="button" title="账户菜单" aria-label="打开账户菜单">
            DP
          </button>
        </div>
      </header>

      <section className="workspace" id="create">
        <div className="control-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">AI VIDEO STUDIO</p>
              <h1>把一张商品图，变成能投放的视频</h1>
            </div>
            <span className="version-badge">MVP</span>
          </div>

          <div className="field-group">
            <div className="field-label-row">
              <label htmlFor="image-upload">参考图片</label>
              <span>PNG / JPG · 最大 10MB</span>
            </div>
            <label className="upload-box" htmlFor="image-upload">
              <span className="upload-icon">+</span>
              <span>
                <strong>{uploadUrl ? "已上传参考图片" : "上传商品、人物或门店图片"}</strong>
                <small>{uploadUrl ? "点击替换当前图片" : "清晰主体更容易获得稳定结果"}</small>
              </span>
              <input id="image-upload" type="file" accept="image/png,image/jpeg" onChange={handleUpload} />
            </label>
          </div>

          <div className="field-group">
            <div className="field-label-row">
              <label htmlFor="prompt">画面描述</label>
              <button className="text-action" type="button" onClick={() => setPrompt(activeTemplate.prompt)}>
                优化描述
              </button>
            </div>
            <textarea
              id="prompt"
              value={prompt}
              maxLength={500}
              onChange={(event) => {
                setPrompt(event.target.value);
                setStatus("idle");
              }}
            />
            <span className="character-count">{prompt.length} / 500</span>
          </div>

          <div className="two-column-fields">
            <fieldset className="field-group compact">
              <legend>视频比例</legend>
              <div className="segmented-control">
                {["9:16", "1:1", "16:9"].map((item) => (
                  <button
                    className={ratio === item ? "selected" : ""}
                    key={item}
                    type="button"
                    onClick={() => setRatio(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="field-group compact">
              <legend>视频时长</legend>
              <div className="segmented-control two-items">
                {["5 秒", "10 秒"].map((item) => (
                  <button
                    className={duration === item ? "selected" : ""}
                    key={item}
                    type="button"
                    onClick={() => setDuration(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <button
            className="advanced-toggle"
            type="button"
            aria-expanded={advancedOpen}
            onClick={() => setAdvancedOpen((value) => !value)}
          >
            <span>高级设置</span>
            <span aria-hidden="true">{advancedOpen ? "⌃" : "⌄"}</span>
          </button>

          {advancedOpen && (
            <div className="advanced-fields">
              <label>
                <span>镜头稳定性</span>
                <select defaultValue="balanced">
                  <option value="balanced">均衡</option>
                  <option value="stable">更稳定</option>
                  <option value="dynamic">更有动感</option>
                </select>
              </label>
              <label className="switch-row">
                <span>自动优化描述</span>
                <input type="checkbox" defaultChecked />
              </label>
            </div>
          )}

          <div className="generate-block">
            <button className="generate-button" type="button" onClick={() => setStatus("ready")}>
              <span>生成视频</span>
              <span className="button-cost">{creditCost} 积分 ↗</span>
            </button>
            <p className={status === "ready" ? "ready" : ""}>{statusText}</p>
          </div>
        </div>

        <div className="preview-stage">
          <div className="stage-toolbar">
            <div className="stage-title">
              <span className="live-dot" />
              <span>预览画布</span>
              <span className="stage-meta">{ratio} · {duration} · 1080p</span>
            </div>
            <div className="stage-actions">
              <button type="button" title="适应画布" aria-label="适应画布">⌗</button>
              <button type="button" title="更多操作" aria-label="更多操作">•••</button>
            </div>
          </div>

          <div className="canvas-area">
            <div className={`video-frame ratio-${ratio.replace(":", "-")} ${playing ? "playing" : ""}`}>
              <img src={previewImage} alt={`${activeTemplate.name}模板预览`} />
              <div className="frame-overlay" />
              <button
                className="play-button"
                type="button"
                aria-label={playing ? "暂停模板预览" : "播放模板预览"}
                onClick={() => setPlaying((value) => !value)}
              >
                {playing ? "Ⅱ" : "▶"}
              </button>
              <div className="template-caption">
                <span>{activeTemplate.category}</span>
                <strong>{activeTemplate.name}</strong>
              </div>
            </div>
          </div>

          <div className="stage-footer">
            <span>{playing ? "正在模拟镜头运动" : "点击画面预览镜头节奏"}</span>
            <span>{playing ? "00:03 / 00:05" : "00:00 / 00:05"}</span>
          </div>
        </div>
      </section>

      <section className="template-section" id="templates">
        <div className="section-heading">
          <div>
            <p className="eyebrow">START WITH A LOOK</p>
            <h2>选一个经过验证的商业镜头</h2>
          </div>
          <button className="view-all" type="button">查看全部 18 个模板 ↗</button>
        </div>

        <div className="category-tabs" role="tablist" aria-label="模板分类">
          {categories.map((item) => (
            <button
              className={category === item ? "active" : ""}
              key={item}
              type="button"
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="template-grid">
          {visibleTemplates.map((template, index) => (
            <button
              className={`template-card ${activeTemplate.name === template.name ? "active" : ""}`}
              key={template.name}
              type="button"
              onClick={() => selectTemplate(template)}
            >
              <div className="card-media">
                <img src={template.image} alt={`${template.name}模板`} loading={index > 1 ? "lazy" : "eager"} />
                <span className="card-duration">5s</span>
                <span className="use-template" aria-hidden="true">+</span>
              </div>
              <div className="card-copy">
                <div>
                  <strong>{template.name}</strong>
                  <span>{template.category}</span>
                </div>
                <span className="card-cost">10 积分</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="works-section" id="works">
        <div className="section-heading">
          <div>
            <p className="eyebrow">RECENT OUTPUTS</p>
            <h2>我的作品</h2>
          </div>
          <div className="works-tabs" aria-label="作品状态筛选">
            <button className="active" type="button">全部</button>
            <button type="button">生成中</button>
            <button type="button">已完成</button>
          </div>
        </div>

        <div className="works-list">
          {works.map((work) => (
            <article className="work-row" key={work.name}>
              <div className="work-thumb"><img src={work.image} alt="" /></div>
              <div className="work-name">
                <strong>{work.name}</strong>
                <span>9:16 · 5 秒 · 奢感推近</span>
              </div>
              <span className={`work-status status-${work.status}`}>{work.status}</span>
              <time>{work.time}</time>
              <button type="button" aria-label={`打开${work.name}`}>↗</button>
            </article>
          ))}
        </div>
      </section>

      <section className="pricing-section" id="pricing">
        <div className="pricing-intro">
          <p className="eyebrow">SIMPLE CREDITS</p>
          <h2>按作品付费，成本始终看得见</h2>
          <p>从免费试做开始。生成失败自动返还积分，正式发布前不需要理解复杂模型参数。</p>
        </div>

        <div className="pricing-grid">
          <article className="price-card">
            <span className="plan-name">体验版</span>
            <h3>¥0</h3>
            <p>注册送 30 积分</p>
            <strong>约 3 条 5 秒视频</strong>
            <ul>
              <li>720p 输出</li>
              <li>带映作水印</li>
              <li>30 天作品保存</li>
            </ul>
            <button type="button">开始试做</button>
          </article>

          <article className="price-card featured">
            <span className="recommend-label">最适合小商家</span>
            <span className="plan-name">商家版</span>
            <h3>¥99 <small>/ 月</small></h3>
            <p>每月 500 积分</p>
            <strong>约 50 条 5 秒视频</strong>
            <ul>
              <li>1080p 无水印输出</li>
              <li>允许商业发布</li>
              <li>90 天作品保存</li>
            </ul>
            <button type="button">选择商家版</button>
          </article>

          <article className="price-card">
            <span className="plan-name">创作者版</span>
            <h3>¥199 <small>/ 月</small></h3>
            <p>每月 1,200 积分</p>
            <strong>约 120 条 5 秒视频</strong>
            <ul>
              <li>1080p 无水印输出</li>
              <li>优先生成队列</li>
              <li>180 天作品保存</li>
            </ul>
            <button type="button">选择创作者版</button>
          </article>
        </div>
      </section>

      <footer className="site-footer">
        <a className="brand" href="#top"><span className="brand-mark">Y</span><span>映作</span></a>
        <p>让每一张好图片，都有成为视频广告的机会。</p>
        <span>原型版本 V0.1</span>
      </footer>
    </main>
  );
}
