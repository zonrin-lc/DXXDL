# 数量级题库来源核验台账

- 数据基线：`size-it-up-mobile/data/pools.json` v2.7.2
- 更新日期：2026-10-24
- 重要：URL 存在不等于来源已核验；`pending_source_page_review` 不代表事实审核通过。
- 当前 50 道题中，44 道仍处于发布池但来源页面复核未完成；6 道已改为 `status: "review"`，不纳入新的发布/兜底题池。
- 旧的 `dailySchedule` 历史映射未重写；`num-20` 曾被安排到 2026-10-20，属于历史内容记录。不要为修复当前发布池而静默改写已发布日期。

## 逐题台账

| ID | 题目 | 来源 URL | source.reviewStatus | 发布/核验状态 | 当前来源备注 |
|---|---|---|---|---|---|
| num-0 | 全世界人类一天的心跳总数大约是多少？ | https://population.un.org/wpp/ | pending_source_page_review | 待逐页核验 | 以约80亿人口×每人每天约10万次心跳估算数量级；人口与个人心率均为近似值。 |
| num-1 | 胡夫大金字塔的总重量大约是多少？ | https://www.nature.com/articles/s40494-025-02018-w | pending_source_page_review | 待逐页核验 | 约230万块石块、平均约2.5吨，乘积约575万吨；题目结果为近似估计。 |
| num-2 | 地球上现存树木的总数大约是多少？ | https://www.nature.com/articles/nature14967 | pending_source_page_review | 待逐页核验 | 研究估计全球树木约3.04万亿棵；研究估计每年砍伐超过150亿棵，非等同于净减少量。 |
| num-3 | 全世界一年要喝掉多少杯咖啡？ | https://icocoffee.org/documents/cy2024-25/coffee-development-report-2022-23.pdf | pending_source_page_review | 待逐页核验 | 报告引用全球每日约30亿杯咖啡；按365天换算约1.095万亿杯，游戏答案修订为约1.1万亿杯。仍需直接核对报告页面中的原始口径后才能将来源状态改为 verified。 |
| num-4 | 月球的质量大约是多少？ | https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html | verified | 已标记复核（仍需审查证据） | 已核对NASA表格中的月球质量0.07346×10^24千克；游戏答案7.35×10^22千克为合理四舍五入。 |
| num-5 | 《哈利·波特》全系列英文版总词数大约是多少？ | https://www.harrypotter.com/pt/news/500-million-harry-potter-books-have-now-been-sold-worldwide | needs-review | 暂缓发布 / review | 官方文章给出七部英文原著总词数约1,100,086；词数会因版本及计数方式略有差异。 |
| num-6 | 阳光从太阳到达地球需要多长时间？ | https://science.nasa.gov/mission/voyager/voyager-1/voyager-1-what-is-a-light-day/ | pending_source_page_review | 待逐页核验 | 太阳光到地球约8分20秒；499秒是近似平均光行时，按约数使用。 |
| num-7 | 人体内大约有多少个细胞？ | https://pubmed.ncbi.nlm.nih.gov/23829164/ | pending_source_page_review | 待逐页核验 | 2013年研究估算参考值约3.72×10¹³个细胞；不同人体大小和统计方法会改变估值。 |
| num-8 | 地球上的蚂蚁总数大约是多少？ | https://pmc.ncbi.nlm.nih.gov/articles/PMC9546634/ | pending_source_page_review | 待逐页核验 | 研究估算全球蚂蚁约19.8×10¹⁵只，取数量级近似为2×10¹⁶只。 |
| num-9 | 地球的质量大约是多少？ | https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html | verified | 已标记复核（仍需审查证据） | 已核对NASA表格中的地球质量5.9722×10^24千克；游戏答案5.97×10^24千克为合理四舍五入。 |
| num-10 | 长江一年流入海洋的水量大约是多少？ | https://www.britannica.com/place/Yangtze-River | pending_source_page_review | 待逐页核验 | 以文献给出的多年平均流量量级折算全年水量；径流量受年份和测量口径影响，答案为粗估值。 |
| num-11 | 一个人一生的心跳总数大约是多少？ | https://my.clevelandclinic.org/health/diagnostics/heart-rate | pending_source_page_review | 待逐页核验 | 按80年、平均约70次/分钟计算约29.4亿次；寿命和心率的个体差异很大。 |
| num-12 | 全球每年大约有多少次可探测的地震？ | https://www.usgs.gov/programs/earthquake-hazards/cool-earthquake-facts | pending_source_page_review | 待逐页核验 | USGS称全球每年约50万次可探测地震；约10万次可被人感知，约100次造成损害，题干需明确“可探测”。 |
| num-13 | 大堡礁的总长度大约是多少？ | https://oceanservice.noaa.gov/facts/gbrlargeststructure.html | pending_source_page_review | 待逐页核验 | NOAA给出大堡礁系统长度约2300千米。 |
| num-14 | 2024年中国快递业务量大约是多少件？ | https://www.mot.gov.cn/shuju/fenxigongbao/hangyegongbao/202512/t20251230_4192148.html | pending_source_page_review | 待逐页核验 | 改为2024年度口径；全国快递业务量约1750.8亿件，不再使用无年份的1700亿估值。 |
| num-15 | 一支圆珠笔大约能写出多长的字迹？ | https://bic-japan.co.jp/quality/ | pending_source_page_review | 待逐页核验 | BIC日本页面介绍笔芯书写距离测试标准，约2千米作为示例近似值；不同型号有差异。 |
| num-16 | 英文维基百科的条目总数大约是多少？ | https://meta.wikimedia.org/wiki/English_Wikipedia/en | pending_source_page_review | 待逐页核验 | 条目数是动态数字，题目用约700万条的数量级，不应当作永久不变的精确总数。 |
| num-17 | 太阳到最近的恒星比邻星的距离大约是多少？ | https://science.nasa.gov/mission/voyager/voyager-1/voyager-1-what-is-a-light-day/ | pending_source_page_review | 待逐页核验 | 比邻星约4.24光年；以光年换算约4.0×10¹³千米。 |
| num-18 | 全世界一天大约发送多少条短信？ | — | needs-review | 暂缓发布 / review | 现有2300亿条/日缺少可靠的全球全口径来源，国际A2P短信数据不能代替全球所有短信；暂移出正式题库。 |
| num-19 | 一座标准足球场的草坪上大约有多少根草？ | — | needs-review | 暂缓发布 / review | 每平方米1万根草的假设尚无可复核来源，不能把推算包装成通用事实；暂移出正式题库。 |
| num-20 | 全世界所有家猫加起来，一年大约要吃掉多少吨猫粮？ | — | needs-review | 暂缓发布 / review | 现有数值直接相乘依赖两个未核实假设，暂移出正式题库。 |
| num-21 | 一个人每天大约会眨眼多少次？ | https://eyewiki.aao.org/Eye_in_numbers | pending_source_page_review | 待逐页核验 | 正常眨眼频率资料常见约12–20次/分钟；按清醒约16小时折算得到约1.15万–1.92万次。 |
| num-22 | 银河系大约有多少颗恒星？ | https://science.nasa.gov/universe/exoplanets/our-milky-way-galaxy-how-big-is-space/ | pending_source_page_review | 待逐页核验 | NASA给出的银河系恒星数估计约1000亿至4000亿颗。 |
| num-23 | 一个成年人体内的血液总量大约是多少升？ | https://my.clevelandclinic.org/health/diagnostics/16793-blood-volume-testing | pending_source_page_review | 待逐页核验 | 资料称成人平均血量约5升；3.5–5.5升为不同体型成人的宽泛估算区间，不是医学诊断范围。 |
| num-24 | 太阳表面（光球层）的温度大约是多少摄氏度？ | https://science.nasa.gov/sun/facts/ | pending_source_page_review | 待逐页核验 | NASA称太阳光球层温度约5500摄氏度；题目采用5000–6000度宽区间。 |
| num-25 | 世界海洋的平均深度大约是多少米？ | https://oceanexplorer.noaa.gov/ocean-fact/ocean-depth/ | pending_source_page_review | 待逐页核验 | NOAA资料给出的海洋平均深度约3682米。 |
| num-26 | 月球到地球的距离大约是多少千米？ | https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html | verified | 已标记复核（仍需审查证据） | 已核对NASA资料明确写出月地距离约357,000–407,000千米；题库区间按其范围修正。 |
| num-27 | 全球人均预期寿命大约是多少年？ | https://www.un.org/en/global-issues/population | pending_source_page_review | 待逐页核验 | 联合国资料给出2024年全球预期寿命约73.3岁；范围按约数呈现。 |
| num-28 | 一天大约有多少秒？ | https://www.nist.gov/pml/time-and-frequency-division/time-realization/leap-seconds | pending_source_page_review | 待逐页核验 | 按名义日24小时×60分钟×60秒=86,400秒计算；此处是日常单位换算，不讨论闰秒的特殊计时规则。 |
| num-29 | 一位成年人全身大约有多少块骨头？ | https://bionumbers.hms.harvard.edu/bionumber.aspx?id=102383&s=n&v=2 | pending_source_page_review | 待逐页核验 | 成年人体骨骼常见计数为206块；个体差异和骨骼融合会造成少量差异。 |
| num-30 | 长江的全长大约是多少千米？ | https://english.www.gov.cn/news/202601/05/content_WS695b59a8c6d00ca5f9a0869a.html | pending_source_page_review | 待逐页核验 | 中国政府网介绍长江干流全长约6300千米。 |
| num-31 | 赤道的周长大约是多少千米？ | https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html | derived | 已标记复核（仍需审查证据） | 已核对NASA给出的赤道半径6,378.137千米；按圆周长公式2πr换算，约40,075千米。 |
| num-32 | 一个人一天大约心跳多少次？ | https://my.clevelandclinic.org/health/diagnostics/heart-rate | pending_source_page_review | 待逐页核验 | 按平均约70次/分钟×1440分钟/天≈100,800次；这是方便估测的数量级，不是人人相同的实测均值。 |
| num-33 | 亚马逊河的全长大约是多少千米？ | https://www.britannica.com/place/Amazon-River | pending_source_page_review | 待逐页核验 | 常见长度估算约6400千米；亚马逊河与尼罗河长度排序会受源头和测量口径影响，已在说明中提示争议。 |
| num-34 | 按太阳日计算，地球自转一周大约是多少分钟？ | https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html | derived | 已标记复核（仍需审查证据） | 已核对NASA表中太阳日长24小时及恒星自转周期23.9345小时的区别；按题目指定太阳日换算为1,440分钟。 |
| num-35 | 京沪高速铁路的全长大约是多少千米？ | — | needs-review | 暂缓发布 / review | 当前1318千米数据缺少本轮确认的直接官方来源，暂移出正式题库，待补源后再发布。 |
| num-36 | 声音在空气中传播 1 千米大约需要多少秒？ | https://ia.cpuc.ca.gov/environment/info/esa/lakeview/resources/4-13_noise.pdf | pending_source_page_review | 待逐页核验 | 资料给出20℃空气中声速约343米/秒；1000÷343≈2.9秒，取约3秒。 |
| num-37 | 地球上的水大约有多少立方米？ | https://www.usgs.gov/faqs/how-much-natural-water-there | pending_source_page_review | 待逐页核验 | USGS给出的地球总水量约13.86亿立方千米，换算约1.386×10¹⁸立方米。 |
| num-38 | 河马一次潜水大约能屏息多少分钟？ | https://www.tokyo-zoo.net/en/ueno/encyclopedia/hippopotamus/index.html | pending_source_page_review | 待逐页核验 | 动物园资料介绍河马可以在水下停留超过5分钟；题目取约5分钟。 |
| num-39 | 珠穆朗玛峰比泰山大约高多少米？ | — | needs-review | 暂缓发布 / review | 目前7304米是以8849米减1545米得到的近似结果，但本轮未确认两处高度的同口径官方来源，暂移出正式题库。 |
| num-40 | 恐龙灭绝距今大约多少年？ | https://pubmed.ncbi.nlm.nih.gov/25065505/ | pending_source_page_review | 待逐页核验 | 非鸟类恐龙的大灭绝发生于约6600万年前。 |
| num-41 | 按平均水深2米估算，一个50米×25米标准泳池大约蓄水多少立方米？ | https://resources.fina.org/fina/document/2024/01/29/2b4f5bea-f965-411c-8fae-6d33bda64b85/Competition-Regulations-version-1st-January-2024-_-Publishing_V3.pdf | pending_source_page_review | 待逐页核验 | 50×25米泳池尺寸可由赛事规则核对；答案2500立方米还依赖“平均水深2米”的显式假设。 |
| num-42 | 成年人平静时每分钟大约呼吸多少次？ | https://medlineplus.gov/ency/article/007198.htm | pending_source_page_review | 待逐页核验 | MedlinePlus给出的成年人静息呼吸频率常见范围为12–20次/分钟。 |
| num-43 | 一个成年人头上大约有多少根头发？ | https://jamanetwork.com/journals/jamadermatology/fullarticle/419780 | pending_source_page_review | 待逐页核验 | 常见成人头发量估计约10万根；不同人群、发色、年龄和个体差异明显。 |
| num-44 | 一位成年人大约有多少颗牙齿？ | https://my.clevelandclinic.org/health/articles/24655-teeth | pending_source_page_review | 待逐页核验 | 大多数成年人有32颗恒牙；部分人因智齿未萌出或拔除而约28颗。 |
| num-45 | 马里亚纳海沟最深处大约有多深？ | https://oceanexplorer.noaa.gov/ocean-fact/ocean-depth/ | pending_source_page_review | 待逐页核验 | NOAA资料列挑战者深渊深度约10,935米；不同测次和基准会有差异。 |
| num-46 | 地球的年龄大约是多少年？ | https://pubs.usgs.gov/gip/geotime/age.html | pending_source_page_review | 待逐页核验 | USGS给出地球年龄约45.4亿年，误差小于1%；原题区间少了一个数量级，本轮已修正。 |
| num-47 | 一只家猫每天大约睡多少小时？ | https://www.cats.org.uk/help-and-advice/cat-behaviour/cats-and-sleep | pending_source_page_review | 待逐页核验 | 猫每天常见睡眠时间约12–18小时；年龄和个体差异会改变睡眠时间。 |
| num-48 | 成年人的体温大约是多少摄氏度？ | https://medlineplus.gov/ency/article/002341.htm | pending_source_page_review | 待逐页核验 | MedlinePlus给出的健康成年人常见体温约36.5–37.3℃；测量位置与时间会有差异。 |
| num-49 | 一个成年人每天大约走多少步？ | https://pubmed.ncbi.nlm.nih.gov/40713949/ | pending_source_page_review | 待逐页核验 | 采用约4000–8000步的宽泛参考范围；这不是适用于所有人的硬性健康目标，受年龄和生活方式影响。 |

## 已执行的内容修订

1. `num-3` 全球咖啡年消费：答案由 8000 亿杯改为约 1.1 万亿杯，与现有备注中的“每日约 30 亿杯 × 365 天 ≈ 1.095 万亿杯”保持一致。该来源仍需核对原报告具体页面/口径。
2. `num-5`、`num-18`、`num-19`、`num-20`、`num-35`、`num-39` 转为 `status: "review"`。其中 `num-18`、`num-19`、`num-20`、`num-35`、`num-39` 缺少本轮确认的充分来源或口径；`num-5` 的来源页面也尚未完成确认。
3. 当前兜底快照 v4 不含以上待审题；历史快照保留原状以避免静默改写旧日期。

## 复核完成标准

每道题需记录：
- 能直接支持题目所用数字/区间的原始页面 URL（不是只链接到机构首页）；
- 页面标题、机构/作者、发布日期或数据年份、访问日期；
- 原文数字、单位、定义、范围及统计口径；
- 游戏答案的换算步骤；所有估算假设需显式写出；
- 复核人、复核日期、结论（通过 / 修订 / 改写 / 下架）。

仅当证据已逐页核对、数值与口径一致后，才能把 `source.reviewStatus` 改为 `verified` 或 `derived`。不要仅为通过构建而更改状态。
