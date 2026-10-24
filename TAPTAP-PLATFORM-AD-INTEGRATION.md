# TapTap 广告适配接入与发布验收（DXXDL）

- 目标包型暂定：TapTap H5 小游戏（仓库构建产物是单文件 H5）。必须由发布负责人在 TapTap 开发者中心确认包型；若改为 Tap 小游戏/APK，不得直接复用本 H5 适配器。
- 实现状态：条件式代码适配层与 fake SDK 单测已加入分支；**尚未配置真实广告位 ID，尚未在 TapTap 开发环境/Android/iOS 真机验证，不可标记为广告上线完成。** 纯浏览器预览不是 TapTap 平台运行环境。

## 平台形态决策

TapTap 官方文档区分普通小游戏、H5 小游戏，以及 Tap 小游戏/APK。官方指南显示，开发者中心广告变现能力适用于星火、H5 小游戏和 TapTap 制造的游戏；Tap 小游戏和 APK 需走 Dirichlet（TapADN）广告联盟流程。上线前必须确认最终包型，不得把 H5 广告 API 跨用于 APK SDK。

- 小游戏介绍：https://developer.taptap.cn/minigameapidoc/quick-start/guide/minigames-intro/
- 广告接入指南：https://developer.taptap.cn/minigameapidoc/quick-start/mcp-guide/ad-integration-guide/
- 激励视频 API：https://developer.taptap.cn/minigameapidoc/dev/api/ad/tap.createRewardedVideoAd/
- 广告使用说明：https://developer.taptap.cn/minigameapidoc/dev/tutorial/open-capabilities/ad/ad/

## 当前代码实现

- `src/platform/taptap-rewarded-ad.js` 是针对 TapTap H5 小游戏运行时 API 的条件式适配器；只有在目标 H5 小游戏容器确实暴露 `tap.createRewardedVideoAd` 且广告位已配置时才启用。此项尚未在官方测试包或真机验证，必须先完成平台环境确认。
- 只使用 SDK 的 `onClose({ isEnded: true })` 作为完成信号；`show()` Promise resolve 仅表示展示调用成功，不代表完播。
- 无 API、无广告位 ID、加载失败、提前关闭、缺少结束回调、重复点击均不发放复活奖励。
- 游戏局内每局只能复活一次；观看成功后恢复3点生命；正式每日挑战不出现复活入口、不改变每日成绩。
- 复活状态记录到本局结果/分享文本，区分复活局。
- 适配器有 fake SDK 单元测试，覆盖缺 ID、完播、提前关闭、加载失败、并发调用；这些测试不是 TapTap 平台兼容性证明。
- 空配置文件 `src/platform/taptap-config.js` 中的广告位 ID 必须从开发者中心获取并经平台审核后才可填写；当前为空，所以生产界面会隐藏复活广告入口。

## 开通与配置操作（需开发者在平台后台完成）

1. 在 TapTap 开发者中心确认游戏包型为 H5 小游戏，并完成开发者/财务主体资料与广告变现开通申请。
2. 在平台后台创建激励视频广告位，取得该广告位 `adUnitId`；仅把公开广告位 ID 写入 `src/platform/taptap-config.js`，不把访问令牌、私钥或后台凭证写入前端。
3. 使用平台提供的测试模式/测试广告位进行联调，不能在普通 Chrome/Safari 预览中假定 `globalThis.tap` 存在。
4. 在 Android 与 iOS 各至少测试一轮：正常完播、提前关闭、无填充/加载失败、播放时切后台、断网、关闭应用/恢复、重复点击、快速连续触发。
5. 验证仅 `isEnded === true` 才复活；不通过“show() promise resolve”或页面返回推断完播。
6. 确认复活只生效一次，恢复3点生命，原有答题纪录保留，正式每日挑战/连胜/成绩未被广告改变。
7. 广告位通过平台审核后，执行正式候选包审核；在审核结果和真机记录归档前，保留 Draft 状态。

## 安全/体验边界

- 激励视频只能由玩家主动点击触发；广告不可用时继续游戏，不强制弹窗。
- 平台奖励回调是当前实现的客户端信任边界；如果 TapTap H5 广告能力支持服务端校验，接排行榜、账号同步或高价值奖励前应补服务端验证。当前本项目未实现服务端奖励校验。
- 应用重启后仅本地的 pending attempt 不足以证明广告成功；当前实现不靠本地存储自行补发复活。
- TapTap 平台规则/接口可能更新，上线前以当前开发者文档及开发者中心实际配置为准。若平台审核最终要求走 Dirichlet/TapADN（例如最终包型是 Tap 小游戏/APK），则应新增该 SDK 的专用适配器，而不是向本 H5 适配器填入不同体系的 adUnitId。

## Android / iOS 验收记录模板

| 字段 | 记录 |
|---|---|
| 包型 / 提审版本 | 待确认 |
| adUnitId / 测试广告位 | 待配置 |
| Android 设备、OS、TapTap 版本 | 待测 |
| iOS 设备、OS、TapTap 版本 | 待测 |
| 正常完播后复活一次 | 待测 |
| 提前关闭不复活 | 待测 |
| 无填充/加载失败不复活 | 待测 |
| 后台/恢复/锁屏状态一致 | 待测 |
| 重复回调无二次奖励 | 待测 |
| 每局最多一次复活 | 待测 |
| 每日正式成绩不受影响 | 待测 |
| 录屏/日志/验收人/日期 | 待附 |
