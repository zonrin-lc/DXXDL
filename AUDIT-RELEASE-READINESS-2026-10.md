# 《比大小》成熟小游戏发布审查记录

- 审查日期：2026-10-26
- 审查基线：`main` 当前公开版本；设计基线 `GDD-v1.5.md`
- 审查类型：静态代码与设计一致性审查
- 重要限制：本次通过仓库文件进行静态审查；自动化验证由 GitHub Actions 执行，但未在真实设备运行游戏，也未验证具体广告 SDK。本文不把未完成的设备/广告验收标记为通过。

## 结论

项目已有模块化核心逻辑、单元测试、题库校验和构建流程；发布候选分支已加入每日题、连胜、来源元数据与广告适配测试。但必须区分默认分支状态、候选分支 CI 和真实平台验收；自动化成功不代表题库内容、广告或设备已经通过。

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
- 最新候选分支数据包 v2.8.2 共 50 道数量级题：**41 道在发布池，均有 `verified/derived` 状态与 `source.reviewEvidence`；9 道转为 `review` 并从当前候选兜底快照排除**。默认 `main` 仍为 v2.8.1，42 道处于 published，8 道处于 review；其中 `num-5` 的 `reviewNote` 已承认现有来源无法支持词数，但 `reviewStatus` 仍为 `verified`，且 `2026-11-01` 排期仍指向 `num-5`。候选分支已纠正此矛盾，改为将 `num-5` 隔离并把未发布日期改为 `num-38`。
- 自动化现在强制校验 URL 字段、显式来源状态和未来排期是否指向非发布题；自动化通过只说明元数据格式完整，并不表示 URL 可用或源文支持答案。
- 验收：每道题补上可支持答案的源文位置、单位、定义、换算公式和复核日期后，才可从 pending 改为 verified/derived；高争议或缺少直接来源的题保持 draft。

### P1-2 视觉估测操作精度要在窄屏上验证

- 代码：`src/core/scale.js` 已实现固定全局对数映射、1% 乘法微调与比例钳制。
- 风险：核心数学函数正确，不代表触控操作足够精准。GDD 要求窄屏设备可稳定进入满分区间，单靠滑块的物理像素精度可能不足。
- 验收：在 320–390 CSS px 宽的真实设备上，验证滑块、微调按钮、长按、键盘、拖拽（若已接入 UI）是否同步到同一个 `q`；锁定后不能改值或重复提交；测试极端比例、舞台缩放和辅助技术。
- 注意：`qFromDrag()` 纯函数存在不代表拖拽交互已经接入实际页面。

### P1-3 构建与题库校验要成为合并门槛

- 工程：`size-it-up-mobile/package.json` 定义 `npm run verify`，顺序为单测、题库校验、构建。
- 最新候选分支验证：GitHub Actions run [#40104311255](https://github.com/zonrin-lc/DXXDL/actions/runs/40104311255) 的全部步骤成功（依赖高危/严重门槛、生产依赖审计、测试/内容校验/构建、严格数量级题源门槛及素材处理）。最近一次包含运行时代码与题库变更的完整验证 [#40104201897](https://github.com/zonrin-lc/DXXDL/actions/runs/40104201897) 报告 112 项测试通过，并处理 57 个原始图片资源。严格题源门槛只覆盖 `numeric`，不覆盖 150 道视觉估测题，不能据此宣称全游戏内容已审完。默认 `main` 的工作流仍仅汇总全量开发依赖告警（`continue-on-error: true`），并未把 high/critical 依赖告警作为阻断门槛。
- 建议：每次候选发布前执行 `npm ci` 与 `npm run verify`；将结果保留在 CI 或发布记录；任何一项失败即阻止发布。
- 还需检查构建产物是否包含最新源码/题库、图片资源是否完整、无控制台错误、无意外外部运行时依赖。

### P1-4 广告奖励状态机需要 SDK 与平台实测

- 设计基线：GDD v1.5 将首期广告收敛为生存模式主动选择复活。
- 待验收：广告不可用、加载失败、播放中断、未完播、完播回调延迟、奖励回调重复、玩家退出/恢复等状态。
- 验收：奖励只发放一次；只有平台确认满足奖励条件才复活；失败时不扣除玩家权益、不锁死界面；不通过广告修改每日正式成绩或补签。
- 备注：本次未确认具体广告 SDK 与目标发布平台，不能认定广告系统已可上线。

### P1-5 开发工具依赖存在安全告警（生产依赖暂未发现漏洞）

- 当前候选分支将 Jimp 固定回兼容的 `0.22.12`，`npm audit --audit-level=high` 通过（0 high / 0 critical），`npm audit --omit=dev` 通过（0 生产依赖漏洞）；但全量 `npm audit` 仍有 **4 项 moderate**，位于 `file-type` / Jimp 本地素材处理工具依赖树，涉及畸形 ASF 输入解析器异常循环。PNG/JPEG 魔数校验缩小了素材工具输入面，但并未消除 advisory。
- 默认 `main` 目前仍使用 Jimp `1.6.1`，且其 workflow 只运行可继续失败的告警摘要而非阻断式 high/critical gate。之前同版本迁移试验报告过 29 项 high，因此必须对 `main` 的精确锁文件重新审计；不能把候选分支的依赖结论套用到 `main`。
- 影响与原则：开发工具告警不是已知的生产运行时漏洞，但素材处理/CI 供应链仍有风险。不得使用未经素材流水线回归验证的强制升级或降级。
- 影响：当前并非游戏运行时依赖漏洞，但会影响开发/CI/素材处理工具的供应链安全，不能因为是 devDependency 就忽略。
- 处理原则：不要直接执行 `npm audit fix --force`，因为建议的 Jimp 主要版本降级可能破坏素材处理脚本。需要逐项确认修复版本、更新 lockfile，并运行素材处理、测试和构建回归。
- 候选分支 CI 对 high/critical 开发依赖告警实施阻断，并单独检查生产依赖；默认 `main` 目前尚未同步该阻断策略。

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
| 自动化测试 | 候选分支 run [40104311255](https://github.com/zonrin-lc/DXXDL/actions/runs/40104311255) 所有步骤成功；此前完整代码/数据验证 run [40104201897](https://github.com/zonrin-lc/DXXDL/actions/runs/40104201897) 报告 112 tests passed，素材处理成功 | 仅证明候选分支自动化通过；不是 main、广告 SDK 或真机验收 |
| 数量级题库 | 候选分支 v2.8.2：41 道发布、证据状态为 verified/derived；9 道 review 已排除于当前兜底池。main 仍为 v2.8.1，11-01 排期仍指 num-5 | 当前数值题候选池有证据；main 排期需合入修复；历史日期不自动重写 |
| 安全依赖 | 候选分支：0 high/critical，4 moderate dev-only，生产依赖审计为 0；main 仍使用 Jimp 1.6.1，且依赖告警未设阻断 | 对 main 单独执行当前锁文件审计；保留候选分支 4 项 moderate 风险或单独替换素材库 |
| TapTap 广告 | 条件式 H5 激励视频适配器、空广告位配置和 mock SDK 测试已提交；完播逻辑只接受 `isEnded === true` | 真实广告位 ID 未配置；正式包型/运行环境兼容性、广告审核、填充率、Android/iOS 真机流程未验收 |
| Android/iOS | 测试矩阵文档已建立 | 本轮未访问真实设备/平台后台，因此所有真机项仍为待测 |

**最终发布决策：Not Ready / 不可宣称已达到正式发布标准。** PR #1 继续保持 Draft，直到源文核验、剩余开发依赖安全问题、正式广告位和双端真机验收均有证据。


## 2026-10-24 后续推进记录

- 数量级题库：通过 NASA、USGS、NOAA、PNAS/Nature、PubMed、MedlinePlus、Cleveland Clinic、Harvard BioNumbers、OpenStax、Smithsonian、PBS NOVA、国家邮政局/加拿大政府等可追溯页面，已为当前 41 道发布池题补齐 `source.reviewEvidence`；9 道不确定题转入 review，不进入新的兜底题池。详见 [逐题台账](NUMERIC-QUESTION-SOURCE-REVIEW.md)。
- 题目修订：候选分支金字塔重量按 PBS NOVA 页面直接列出的约650万吨；长江题改为平均年径流量口径；成人血量改为约5升点答案；亚马逊河长度约6300千米；月地距离区间下限为357,000千米。
- CI：候选分支已设置 `npm audit --audit-level=high` 阻断门槛及 `npm run audit:sources:release`；最新 run [40104311255](https://github.com/zonrin-lc/DXXDL/actions/runs/40104311255) 全部步骤成功。该来源脚本仅校验数量级题，视觉池核验仍缺失。
- 广告：奖励只接受 `onClose({ isEnded: true })`；增加首次页面启动60秒内不展示广告的保护及对应单元测试。真实广告位 ID 仍为空；实际宿主类型尚待确认，因此不能宣称平台广告已上线。
- Android/iOS：本轮没有真实设备或 TapTap 平台沙箱可用，所有设备/平台验收仍标记待执行。


## Dependency security decision (2026-10-24)

- A controlled Jimp 1.6.1 migration was trialed in CI, but `npm audit` found 29 high-severity advisories through Jimp's transitive `zod` dependency (the available forced fix would downgrade Jimp back to 0.22.12). The migration was therefore reverted; package-lock remains on Jimp 0.22.12 and the compatible legacy asset API.
- Current accepted residual: full `npm audit` reports 4 moderate advisories for `file-type` through `@jimp/core`/Jimp 0.22.12, concerning an ASF parser infinite loop on malformed input. The release gate blocks high/critical advisories, and production dependency audit is separate. This residual is limited to the local development asset processor, not the shipped runtime.
- Mitigation added: `tools/build-assets.mjs` validates PNG/JPEG magic bytes before passing files to Jimp; tests reject ASF and arbitrary file signatures. This narrows the vulnerable parser exposure, but does not remove the advisory from the dependency tree.
- Release decision: do not force-upgrade Jimp to 1.6.1 while it introduces high advisories. Keep the moderate residual documented; if the project later accepts untrusted asset uploads or additional formats, replace the processor with a separately audited library and re-run the asset pipeline regression suite.


## Jimp 依赖处理结论（最新）

- 当前锁文件保留 Jimp 0.22.12；`npm audit --audit-level=high` 与生产依赖审计通过。
- 全量 `npm audit` 在候选分支仍报告 4 项 moderate（`file-type` ASF 解析器异常循环，位于本地素材处理依赖树）；Jimp 1.6.1 曾在迁移试验中引入 29 项 high，因此候选分支已回退到 0.22.12。
- 最新候选分支 run [40104311255](https://github.com/zonrin-lc/DXXDL/actions/runs/40104311255) 完成且所有步骤成功。最近一次代码/题库变更验证 run [40104201897](https://github.com/zonrin-lc/DXXDL/actions/runs/40104201897) 报告 112 项测试通过和 57 个原始图片处理成功；其后仅有审查文档改动。


## 2026-10-26 再审查：默认分支与候选分支必须区分

- 默认 `main` 的数据包仍为 v2.8.1：42 道数量级题为 published、8 道为 review；`2026-11-01` 排期仍使用 `num-5`。这道题的 `reviewNote` 已说明现有链接无法支撑其英文总词数，但 `reviewStatus` 仍标成 `verified`。候选分支 v2.8.2 已纠正为 review，并将尚未发布的 2026-11-01 改为 `num-38`（revision 3）；这项修复目前**未合入 main**。
- 视觉估测池共有 150 条已发布记录（`everyday` / `pop` / `geo`）。当前复审发现 150/150 均没有 `source.url` 或 `source.reviewEvidence`，来源名均为泛化的“公开资料估算”。`tools/audit-sources.mjs` 只检查 `numeric`，所以现有严格来源门槛不覆盖这 150 条视觉题。已建立 [Issue #10](https://github.com/zonrin-lc/DXXDL/issues/10)；完成逐条依据与审核器扩展前，不得宣称全题库事实审核通过。
- 默认 `main` 依旧使用 Jimp 1.6.1，依赖告警步骤设置了 `continue-on-error: true`，并不阻断 high/critical advisories。候选分支使用 Jimp 0.22.12，并通过 high/critical gate；仍须单独处理或明确接受 4 项 moderate dev-only advisory。
- PR #1 仍为 Draft、尚未合并。GitHub compare 当前报告候选分支相对 `main` 为 diverged（121 commits ahead、1 behind）；合并前应核对最终 PR diff 和历史，优先考虑清晰的 squash/rebase 策略。
- 广告配置仍无真实 `adUnitId`；TapTap H5 与 TapTap 制造/游戏工坊运行时尚未确认。Android/iOS 真机、平台沙箱、广告库存/回调/审核流程仍全部待验收。

**本轮结论：候选分支自动化 CI 通过，但默认分支仍存在题源与依赖门槛未修复；150 条视觉题尚未逐项来源复核；广告和双端设备验收未完成。不能合入正式发布或标记为 Ready for Release。**
