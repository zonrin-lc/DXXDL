# 《比大小》成熟小游戏发布审查记录

- 审查日期：2026-10-24
- 审查基线：`main` 当前公开版本；设计基线 `GDD-v1.5.md`
- 审查类型：静态代码与设计一致性审查
- 重要限制：本次通过仓库文件进行静态审查；自动化验证由 GitHub Actions 执行，但未在真实设备运行游戏，也未验证具体广告 SDK。本文不把未完成的设备/广告验收标记为通过。

## 结论

项目已有模块化核心逻辑、7 组单元测试、题库校验脚本和构建流程，具备继续工程化的基础。但 GDD v1.5 已明确列出多项“需改代码与回归测试”的发布门槛，不能因为规范已写入 GDD 就认定功能已验收。

当前建议状态：**不建议直接作为成熟正式版发布；适合进入有明确验收门槛的发布候选阶段。**

## P0：发布前必须关闭

### P0-1 每日题兜底版本漂移（代码修复已提交，仍需后续发布流程约束）

- 代码：`size-it-up-mobile/src/core/daily.js` 的 `resolveDailyQuestionId()`、`pickFallback()`
- 已修复：未显式排期的日期现在按 `effectiveFrom` 选择当日生效的兜底快照；新版本不会仅因排在数组末尾就改写更早日期。生产题库为现有快照补了迁移基线，版本化快照的生效日期由 `validatePack()` 校验。
- 回归覆盖：新增测试验证未来版本生效前后选用不同快照，且旧日期继续使用原快照。
- 发布规则：未来新增 fallback 版本必须填写真实生效日期；已正式运营日期仍建议明确写入 `dailySchedule`，以避免题目内容/答案解释在热更新时发生变化。
- 验收状态：本分支 CI 已通过单测、题库校验和构建；仍需在未来版本变更时继续执行排期快照比对。

### P0-2 生存模式后台计时（源码实现已有，真实设备验收仍未完成）

- 代码：`src/core/survival.js` 的 `makeTimer()`；`src/ui/numeric.js` 的 `visibilitychange`、`checkTimeout()`。
- 静态核对：当前实现使用时间戳 deadline 计算剩余时间，恢复前台时立即检查是否超时，不再依赖 interval 触发次数累计时间。GDD 中的旧问题描述与当前源码不完全同步。
- 风险：浏览器后台策略、系统休眠/恢复和实际交互仍可能产生平台差异，静态代码与单元测试不能代替手机验证。
- 验收：在目标手机浏览器测试前台、后台 5/30/60 秒、锁屏恢复、快速反复切后台等场景；核对超时只结算一次、恢复时答案锁定状态正确。

### P0-3 连胜与每日成绩必须完成端到端核验

- 代码入口：`size-it-up-mobile/src/core/streak.js`；测试：`size-it-up-mobile/test/streak.test.js`
- 设计基线：GDD 要求同日幂等、连续日递增、断签重置，首期不提供广告补签。
- 风险：单测覆盖不等于页面提交流程、存档迁移、重复提交和跨日恢复都正确。
- 修复/验收：核对页面完成事件与存档写入是否只触发一次；同日多次进入不重复加连胜；跨日、跳日、修改系统日期、清空/损坏存档、旧版本存档迁移都有明确结果；广告不得补签。

## P1：发布候选前必须完成

### P1-1 题库审核元数据与实际内容口径需一致

- 代码：`size-it-up-mobile/src/core/question.js` 的 `validatePack()`；数据：`size-it-up-mobile/data/pools.json`
- 已有校验：稳定 ID、正尺寸、视觉题固定量程、比较维度、难度、部分来源字段、数量级答案类型与每日排期引用。
- 已加强：数量级已发布题强制校验 `source.year` 和单位；版本化兜底快照强制有效的 `effectiveFrom`；新增单测覆盖。
- 内容审查阶段性结果：数据包 v2.7.1 中有 44 道题仍保留 published 状态并填入候选来源 URL；另外 6 道转为 draft（包括总词数缺少直接证据的 num-5，以及 num-18/19/20/35/39）。但 **44 道的 `source.reviewStatus` 目前均为 `pending_source_page_review`**：来源网页尚未逐页与答案做完原文/表格核对，不能称为事实审核通过。
- 自动化现在强制校验 URL 字段、显式来源状态和未来排期是否指向非发布题；自动化通过只说明元数据格式完整，并不表示 URL 可用或源文支持答案。
- 验收：每道题补上可支持答案的源文位置、单位、定义、换算公式和复核日期后，才可从 pending 改为 verified/derived；高争议或缺少直接来源的题保持 draft。

### P1-2 视觉估测操作精度要在窄屏上验证

- 代码：`src/core/scale.js` 已实现固定全局对数映射、1% 乘法微调与比例钳制。
- 风险：核心数学函数正确，不代表触控操作足够精准。GDD 要求窄屏设备可稳定进入满分区间，单靠滑块的物理像素精度可能不足。
- 验收：在 320–390 CSS px 宽的真实设备上，验证滑块、微调按钮、长按、键盘、拖拽（若已接入 UI）是否同步到同一个 `q`；锁定后不能改值或重复提交；测试极端比例、舞台缩放和辅助技术。
- 注意：`qFromDrag()` 纯函数存在不代表拖拽交互已经接入实际页面。

### P1-3 构建与题库校验要成为合并门槛

- 工程：`size-it-up-mobile/package.json` 定义 `npm run verify`，顺序为单测、题库校验、构建。
- 本次状态：GitHub Actions 工作流已升级到 checkout/setup-node v5 与 Node 22，并增加 PR 目标为审查分支时的验证触发器。提交 `8713984` 对应的审查分支 PR 合并验证运行 [#40102208399](https://github.com/zonrin-lc/DXXDL/actions/runs/40102208399) 已成功：108 项单测、题库结构校验、来源元数据审计和 H5 构建通过。日志同时明确：44 道题仍处于 `pending_source_page_review`，这不是内容事实核验通过。生产依赖审计为 0 项，但开发工具依赖仍有 32 项告警，见 P1-5。后续每次改动仍须以最新提交对应的 CI 结果为准。
- 建议：每次候选发布前执行 `npm ci` 与 `npm run verify`；将结果保留在 CI 或发布记录；任何一项失败即阻止发布。
- 还需检查构建产物是否包含最新源码/题库、图片资源是否完整、无控制台错误、无意外外部运行时依赖。

### P1-4 广告奖励状态机需要 SDK 与平台实测

- 设计基线：GDD v1.5 将首期广告收敛为生存模式主动选择复活。
- 待验收：广告不可用、加载失败、播放中断、未完播、完播回调延迟、奖励回调重复、玩家退出/恢复等状态。
- 验收：奖励只发放一次；只有平台确认满足奖励条件才复活；失败时不扣除玩家权益、不锁死界面；不通过广告修改每日正式成绩或补签。
- 备注：本次未确认具体广告 SDK 与目标发布平台，不能认定广告系统已可上线。

### P1-5 开发工具依赖存在安全告警（生产依赖暂未发现漏洞）

- 原锁文件的 `npm audit` 曾报告开发依赖树 **32 项告警：1 moderate、29 high、2 critical**。已将 Vitest 升级至 `4.1.12`，并在 [PR #4](https://github.com/zonrin-lc/DXXDL/pull/4) 合并进审查分支；合并结果上的 CI 显示开发依赖告警降至 **29 项 high、0 critical、0 moderate**，生产依赖 `npm audit --omit=dev` 为 **0 vulnerabilities**。剩余告警主要位于 Jimp 1.6.1 的 `@jimp/*` 插件/核心依赖与关联传递树。尝试非强制 `npm audit fix --package-lock-only` 未产生经验证的 lockfile 改动；没有强制降级 Jimp，以免破坏 `tools/build-assets.mjs`。这仍是未关闭的发布安全门槛。
- 影响：当前并非游戏运行时依赖漏洞，但会影响开发/CI/素材处理工具的供应链安全，不能因为是 devDependency 就忽略。
- 处理原则：不要直接执行 `npm audit fix --force`，因为建议的 Jimp 主要版本降级可能破坏素材处理脚本。需要逐项确认修复版本、更新 lockfile，并运行素材处理、测试和构建回归。
- CI 已加入依赖告警摘要与生产依赖审计；开发依赖告警目前只报告、不阻断。

## P2：体验与运营优化

1. 首次进入：让新玩家不看长教程也能在第一题理解“观察—估测—锁定—揭晓—解释”。
2. 揭晓反馈：先突出正确值、玩家偏差和本题得分，再呈现解释；避免把“线性偏差百分比”和“对数计分”混成一个口径。
3. 模式聚焦：优先把日常视觉模式和每日数量级挑战打磨完整，再扩展主题内容。
4. 内容运营：提供题目纠错报告的真实反馈路径；如果本地版只是复制文本，应明确写“复制反馈报告”，不能提示已发送。
5. 轻量数据：先记录首题完成率、揭晓后继续率、退出位置、每日题完成率、纠错率、广告奖励成功率；取得基线前不设虚构目标。
6. 无障碍与设备：检查键盘焦点、读屏标签、减少动态效果、触控区域、横竖屏/窄屏布局、弱网与资源加载失败。

## 建议的发布闸门

- [ ] P0-1 每日题历史映射稳定，并有自动化回归测试
- [ ] P0-2 生存模式后台/恢复计时在目标设备通过
- [ ] P0-3 连胜、重复提交、跨日与存档迁移通过
- [ ] P1-1 题库发布校验与人工事实审核通过
- [ ] P1-2 窄屏估测精度与锁定状态通过
- [ ] P1-3 `npm run verify` 通过并保留日志
- [ ] P1-4 广告 SDK 的成功/失败/重复回调测试通过（若本版本接广告）
- [ ] 发布候选包完成真实手机试玩与回归

## 本轮已做 / 未做

- 已做：检查 GDD v1.5、`daily.js`、`question.js`、`scale.js`、`scoring.js`、`streak.js`、题库和 `package.json`；在审查分支修改每日题兜底版本选择、题库发布字段校验和连胜日期回拨保护；补充对应回归测试；新增 GitHub Actions 验证工作流。
- 已修改的文件：`size-it-up-mobile/src/core/daily.js`、`data/pools.json`、`src/core/question.js`、`src/core/streak.js`、`test/daily.test.js`、`test/question.test.js`、`test/streak.test.js`、`.github/workflows/size-it-up-mobile-verify.yml`。
- 额外发现并修正：数量级题 `num-49` 的答案单位原为“次”，与题意“每天走多少步”不符，现已改为“步”并加入单位白名单及回归测试；旧存档迁移原先可能把历史最长连胜误作当前连胜，现改为按最近连续日期段恢复并补测。
- 重要说明：兜底快照现有版本以 `1970-01-01` 作为迁移基线，保留现有最新快照对当前日期的既有选择；以后新建快照必须填写真实的未来生效日期，校验器会拒绝混入缺失生效日期的版本化快照。历史上此前已发出的未排期日期没有独立存档时，无法凭空恢复当时真实使用的旧版本。
- 未做：未在本次环境直接执行本地 Node 命令（由 GitHub Actions 执行）；未在真实设备测试；未验证广告 SDK；未做玩家留存或商业化数据分析。
- 下一步建议：等待并核对自动化工作流结果；若失败先修复回归；之后继续排查生存计时是否在 UI 中实际使用 deadline、核对真实页面的触控/锁定状态、补充广告奖励状态机验收，再进行真实手机测试。


## 新增交付物（2026-10-24）

- [发布候选验收清单](RELEASE-CANDIDATE-CHECKLIST.md)：包含窄屏、后台计时、锁屏恢复、连胜/存档、弱网、资源失败、可访问性及广告奖励状态机的逐项验收表。
- [数量级题库来源核验台账](NUMERIC-QUESTION-SOURCE-REVIEW.md)：逐项列出 50 道题的来源补证与口径复核状态。该文件是待办台账，不代表事实核验已完成，也不人为填入未经验证的链接。
- 本分支的 PR 仍为 Draft，尚未合并。开发依赖安全告警、题库来源复核、真实设备测试和广告 SDK/平台确认仍是发布阻断项。


## 当前分支状态补充（2026-10-24）

- 题库：v2.7.1；44 道 published 题有候选来源链接，但所有源页直证状态均为 pending；6 道题已 draft。此状态不是正式内容验收通过。
- TapTap 广告：增加条件式 H5 激励视频适配层与 mock SDK 测试；广告位 ID 仍为空。当前代码只能在 TapTap H5 运行时实际暴露官方 API 且广告位审核配置完成后尝试启用。Android/iOS 真机、广告填充、审核、奖励回调和退出恢复都尚未验收。
- 依赖：Vitest 4.1.12 与重新生成的 lockfile 在 PR #4；老版本 npm audit 曾报告 32 个 dev advisories。PR #4 测试需针对当前审查分支合并结果再确认；Jimp / 其传递树仍需单独处理。
- 发布结论：不建议发布。需要先完成 source page review、依赖安全审计、正式 TapTap H5 包型/广告位验证、Android 与 iOS 实机测试，并取得最终候选构建 CI 记录。


## 发布状态面板（2026-10-24 更新）

| 项目 | 当前可核实状态 | 尚未完成 |
|---|---|---|
| 自动化测试 | CI run [40102208399](https://github.com/zonrin-lc/DXXDL/actions/runs/40102208399) 成功；108 tests passed；题库校验与 H5 build 通过 | 该运行在删除临时依赖排查 workflow 前后源码相同；后续源文件改变仍需重新运行 |
| 数量级题库 | 数据包 v2.7.1；44 道 published 有候选 URL；6 道 draft；未来排期未指向 draft | 44 道候选来源的网页原文尚未逐题核对，全部标记 pending；不能视为内容批准 |
| 安全依赖 | Vitest 4.1.12 已合入审查分支；当前审计记录 29 high、0 critical、0 moderate；生产依赖 0 vulnerabilities | Jimp 相关开发工具漏洞仍未关闭；非强制 audit fix 未产生新的 lockfile；禁止未经测试的强制降级 |
| TapTap 广告 | 条件式 H5 激励视频适配器、空广告位配置和 mock SDK 测试已提交；完播逻辑只接受 `isEnded === true` | 真实广告位 ID 未配置；正式包型/运行环境兼容性、广告审核、填充率、Android/iOS 真机流程未验收 |
| Android/iOS | 测试矩阵文档已建立 | 本轮未访问真实设备/平台后台，因此所有真机项仍为待测 |

**最终发布决策：Not Ready / 不可宣称已达到正式发布标准。** PR #1 继续保持 Draft，直到源文核验、剩余开发依赖安全问题、正式广告位和双端真机验收均有证据。


## 2026-10-24 后续推进记录

- 数量级题库：通过 NASA、USGS、NOAA、PNAS/Nature、PubMed、MedlinePlus、Cleveland Clinic、Harvard BioNumbers、OpenStax、Smithsonian、PBS NOVA、国家邮政局/加拿大政府等可追溯页面，已为当前 41 道发布池题补齐 `source.reviewEvidence`；9 道不确定题转入 review，不进入新的兜底题池。详见 [逐题台账](NUMERIC-QUESTION-SOURCE-REVIEW.md)。
- 题目修订：金字塔质量按约230万块×2.5吨修订为约580万吨；长江水量题改为年径流量口径；成人平均血量改为5升点答案；亚马逊河长度修订为约6300千米；月地距离下限修订为357,000千米。
- CI：新增 `npm audit --audit-level=high` 作为高危/严重开发依赖阻断门槛；新增 `npm run audit:sources:release`，要求所有发布池题、未来排期和最新兜底题都有证据支持。需以最新 Actions 结果确认这些门槛在当前提交上实际通过。
- 广告：奖励只接受 `onClose({ isEnded: true })`；增加首次页面启动60秒内不展示广告的保护及对应单元测试。真实广告位 ID 仍为空；实际宿主类型尚待确认，因此不能宣称平台广告已上线。
- Android/iOS：本轮没有真实设备或 TapTap 平台沙箱可用，所有设备/平台验收仍标记待执行。


## Dependency security decision (2026-10-24)

- A controlled Jimp 1.6.1 migration was trialed in CI, but `npm audit` found 29 high-severity advisories through Jimp's transitive `zod` dependency (the available forced fix would downgrade Jimp back to 0.22.12). The migration was therefore reverted; package-lock remains on Jimp 0.22.12 and the compatible legacy asset API.
- Current accepted residual: full `npm audit` reports 4 moderate advisories for `file-type` through `@jimp/core`/Jimp 0.22.12, concerning an ASF parser infinite loop on malformed input. The release gate blocks high/critical advisories, and production dependency audit is separate. This residual is limited to the local development asset processor, not the shipped runtime.
- Mitigation added: `tools/build-assets.mjs` validates PNG/JPEG magic bytes before passing files to Jimp; tests reject ASF and arbitrary file signatures. This narrows the vulnerable parser exposure, but does not remove the advisory from the dependency tree.
- Release decision: do not force-upgrade Jimp to 1.6.1 while it introduces high advisories. Keep the moderate residual documented; if the project later accepts untrusted asset uploads or additional formats, replace the processor with a separately audited library and re-run the asset pipeline regression suite.


## Jimp 依赖处理结论（最新）

- 当前锁文件保留 Jimp 0.22.12；`npm audit --audit-level=high` 与生产依赖审计通过。
- 全量 `npm audit` 仍报告 4 项 moderate（`file-type` 的 ASF 解析器异常循环，位于本地开发素材工具依赖树）。尝试升级到 Jimp 1.6.1 后，CI 发现其传递 `zod` 依赖引入 29 项 high，因此已撤销该升级，未把更差的依赖树带入候选版本。
- 已在素材流水线中增加 PNG/JPEG 魔数白名单检查，并增加测试拒绝 ASF/任意字节输入；最新完整代码验证 [40103993656](https://github.com/zonrin-lc/DXXDL/actions/runs/40103993656) 的测试、严格来源门槛、构建和素材处理步骤均为 success。后续文档提交的 CI 仍在跑，需以最新 Actions 结果为准。
