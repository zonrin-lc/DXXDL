# 比大小（Scale Sense）

移动端 H5 优先的尺度感与数量级直觉益智游戏：看图/读题估比例与数量级，揭晓真实倍数。

- **主设计文档**：[`GDD-v1.5.md`](GDD-v1.5.md)（唯一基准，变更记录见文末）
- **游戏工程**：[`size-it-up-mobile/`](size-it-up-mobile/)（源码 + 题库 + 构建）
- **发布产物**：`size-it-up-mobile/index.html`——单 HTML 零依赖（JS/CSS/题库/插画全部内联，约 12.5 MB，含 57 张 data URI 插画）

## 玩法

11 种模式：8 个视觉模式（日常/影视/地理/重量/面积/体积/速度/随机遭遇）+ 3 个数值模式（每日一题/生存/练习）。重量与体积按立方根、面积按平方根渲染，滑块量程固定 10⁻⁶~10⁶。

## 开发

```bash
cd size-it-up-mobile
npm ci
npm run verify   # 单测 + 题库结构校验 + 带宽审计 + 来源门禁 + 构建
```

| 命令 | 作用 |
| --- | --- |
| `npm run test` | vitest 单元测试 |
| `npm run check` | 题库结构校验 + 发布带宽审计 |
| `npm run audit:sources` | 来源门禁（发布题必须有可追溯来源与复核状态） |
| `npm run build` | 产出单文件 `index.html`（fail-closed：素材/对象表缺失即失败） |

要求 Node.js ≥ 22（与 CI 一致）。CI 见 `.github/workflows/size-it-up-mobile-verify.yml`。

## 题库与内容管线

- `data/pools.json`：唯一题库事实来源（版本化热更新包），结构契约见 GDD 6.4/6.7
- `data/objects.json`：随机遭遇层对象表，由 `node tools/extract-objects.mjs` 从 pools.json 生成（**不要手改**）
- 新增题目：编辑 pools.json（status 先用 `review`），补来源与复核证据后改 `published`，跑 `npm run verify` 门禁
- 每日题：`dailySchedule` 排期优先，未排期日期走 `fallbackPools` 版本化兜底（只引用 published 题）

## 历史文档说明

仓库根部的审计与核验文档（`AUDIT-RELEASE-READINESS-2026-10.md`、`NUMERIC-QUESTION-SOURCE-REVIEW.md`、`RELEASE-CANDIDATE-CHECKLIST.md`）是 2026-10 月发布候选阶段的**时点记录**，其中描述的题库版本、分支状态与工具链已被后续迭代超越；当前状态以 GDD 变更记录与 `npm run verify` 结果为准。
