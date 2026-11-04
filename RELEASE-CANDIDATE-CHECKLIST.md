# 《比大小》发布候选验收清单

> 状态：待人工/目标设备验收。CI 通过不等于真实设备、广告 SDK 或内容事实审核通过。
> 分支：`audit/release-readiness-2026-10`

## A. 自动化门槛

- [x] GitHub Actions 执行 `npm ci`
- [x] `npm audit --omit=dev`：生产依赖 0 vulnerabilities（以本次工作流结果为准）
- [x] `npm run verify`：单测、题库校验、来源审计、构建均通过
- [x] 候选分支 CI 的 `npm audit --audit-level=high` 通过（0 high / 0 critical），`npm audit --omit=dev` 为 0 生产漏洞
- [ ] 处理或书面接受候选分支全量 `npm audit` 的 4 项 moderate（Jimp 0.22.12 → `file-type` ASF parser）；不把该残余描述为 0 漏洞
- [ ] 修复默认 `main` 的依赖安全门槛：当前 Jimp 1.6.1 且 workflow 的审计摘要 `continue-on-error: true`，需评估 lockfile 并阻断 high/critical 风险
- [ ] 记录发布候选构建产物的 SHA-256、版本号和对应 commit

## B. 手机/浏览器实测（每项记录设备、系统、浏览器、结果、录屏/截图）

| 场景 | 验收步骤 | 通过标准 | 结果 |
|---|---|---|---|
| 首次进入 | 清空站点数据后进入游戏并完成首题 | 无说明书也能完成估测、锁定、揭晓；无阻断错误 | 待测 |
| 窄屏布局 | 320、360、390 CSS px 宽度测试 | 无横向溢出；题目、数值、按钮可读可触 | 待测 |
| 估测操作 | 滑块、微调按钮、键盘（若支持）反复切换 | 所有输入同步到同一答案；锁定后数值不再变化 | 待测 |
| 重复提交 | 连续快速点击提交/揭晓 | 一题只结算一次，不重复加分或连胜 | 待测 |
| 后台计时 | 生存模式切后台 5/30/60 秒后返回 | 剩余时间按真实经过时间计算；超时只结算一次 | 待测 |
| 锁屏恢复 | 锁屏后等待，再解锁恢复 | 无计时冻结、额外时间、界面卡死或重复结算 | 待测 |
| 快速切后台 | 10 次快速前后台切换 | 无重复计时器、重复结算或输入状态错乱 | 待测 |
| 跨日连胜 | 当日重复进入、跨日、跳过一天 | 同日幂等；连续日递增；断签按规则重置 | 待测 |
| 时钟回拨/前拨 | 修改系统日期后重开游戏 | 不凭空增加成绩/连胜；状态有确定且可解释的结果 | 待测 |
| 存档异常 | 旧格式、空值、损坏 JSON、清空存档 | 安全恢复；不崩溃、不重复发奖 | 待测 |
| 弱网/离线 | 热更新请求失败、离线启动 | 使用有效缓存或内置兜底；坏包不覆盖有效缓存 | 待测 |
| 资源失败 | 图片/字体资源失败或慢加载 | 有合理占位/降级；核心玩法可继续 | 待测 |
| 可访问性 | 键盘焦点、读屏标签、减少动态效果 | 核心操作可理解、可操作，焦点可见 | 待测 |

## C. 广告奖励验收（仅在确认 SDK/平台并接入后执行）

- [ ] 广告未加载：可返回玩法，不扣权益、不锁死 UI
- [ ] 用户主动关闭/播放中断：不发奖励
- [ ] 播放完成但奖励回调延迟：状态可恢复，不重复复活
- [ ] 平台重复触发奖励回调：复活最多一次
- [ ] 玩家在广告过程中退出/切后台：返回后状态一致
- [ ] SDK 返回失败/无填充：明确反馈并允许继续
- [ ] 广告奖励不改变每日正式成绩、不提供补签
- [ ] 验证平台要求的隐私同意、年龄/地区规则及广告标识配置

## D. 内容审核

- [x] 候选分支数量级题库 v2.8.2：50 道中 41 道发布且有 `verified/derived` 证据，9 道转入 `review` 并排除于当前兜底池
- [x] 争议数值题已隔离；候选分支将未发布的 2026-11-01 从 `num-5` 改为 `num-38`（revision 3），历史已发布排期不回写
- [ ] **视觉题源核验阻断项：150 道 `everyday/pop/geo` 项目全部缺少 `source.url` 和 `source.reviewEvidence`，当前严格来源脚本没有覆盖这些数组；须逐条补证或隔离并扩展 gate（见 [Issue #10](https://github.com/zonrin-lc/DXXDL/issues/10)）
- [ ] 对每道视觉题核对参照物、目标物、维度、尺寸范围、资产 ID 与来源口径
- [ ] 再审查默认 `main`：当前 v2.8.1 仍将来源不足的 `num-5` 标为 verified 并排期在 2026-11-01；需先合入候选修复并验证主分支
- [ ] 题库变更后检查已发布每日题映射，不改写已发布日期

## E. 发布决策

- [x] 候选分支最新 run [40104311255](https://github.com/zonrin-lc/DXXDL/actions/runs/40104311255) 所有步骤成功；
- [ ] 自动化 CI 在最终发布候选 commit（含最终的内容审核修复、依赖决策与平台配置）上再次通过
- [ ] 内容审核负责人确认题库来源
- [ ] 目标设备验收记录完整
- [ ] 若接广告，SDK/平台测试通过
- [ ] 无 P0/P1 未关闭项后，才将 PR 从 Draft 转 Ready for review
- [ ] 发布前确认回滚版本、缓存兼容性和线上问题反馈入口


## TapTap 官方广告接入（待宿主确认/实机验收）

- [x] 代码层只在平台报告 `onClose({ isEnded: true })` 时返回完成结果；提前关闭不发奖。
- [x] 已增加首屏启动后 60 秒保护，保护期内不展示激励广告入口；时间判断使用单调页面计时。
- [x] 已有单元测试覆盖广告位缺失、正常完播、提前关闭、加载失败、并发尝试与启动保护期。
- [ ] 确认最终宿主到底是 **TapTap H5 小游戏** 还是 **TapTap 制造/游戏工坊运行时**。当前适配器使用 `tap.createRewardedVideoAd`，只对应 TapTap H5 小游戏 API；若是制造/游戏工坊的另一套 SDK，不可直接视为兼容。
- [ ] 在对应开发者后台创建并审核正式激励视频广告位，把真实 `adUnitId` 写入 `src/platform/taptap-config.js`。当前 ID 为空，生产环境不会播放广告，也不会发放复活奖励。
- [ ] 在 TapTap 测试环境验证无广告库存、加载失败、未完播、重复/延迟回调、前后台恢复、重复点击、复活仅一次、首次启动保护期等情况。
- [ ] 核对最终平台广告政策、隐私同意和审核要求；本地单元测试不能替代平台沙箱或真实广告回调测试。


## Development dependency risk decision

- [x] 候选分支 CI blocks high/critical npm advisories; latest run `40104311255` succeeded with Jimp 0.22.12.
- [ ] 默认 `main` 仍未同步该阻断策略；其 workflow 当前只汇总依赖警告且 `continue-on-error: true`。
- [x] Asset pipeline rejects inputs whose magic bytes are not PNG/JPEG before calling Jimp, mitigating the known malformed-ASF parser advisory for this local-only tool.
- [ ] Full `npm audit` still reports 4 moderate `file-type` advisories through Jimp 0.22.12. A Jimp 1.6.1 trial introduced 29 high `zod` advisories and was reverted. Do not mark dependency tree fully clean; replace Jimp in a separately tested future change if policy requires zero advisories.
