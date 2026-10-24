# 数量级题库逐题来源核验记录

- 核验日期：2026-10-24
- 数据包版本：2.7.0
- 审查原则：仅“verified”代表源文直接支持主要数据；“derived”代表题目答案还依赖文中注明的计算/假设；“needs-review”不得进入新的正式题库/每日排期。
- 本记录不代表已做 Android/iOS 实机测试或广告位审核。来源链接只针对该题的数据口径，不代表来源支持所有周边文案。

## 总体结果

- 数量级题共 50 道。
- 当前可进入正式题库的题：45 道（均需 CI 严格校验 URL 与 reviewStatus）。
- 暂时转为 draft 的题：num-18, num-19, num-20, num-35, num-39。原因主要是全球短信量、草叶根数、全球猫粮消费、京沪高铁长度、海拔差缺少足够直接的证据。
- 明确修复的问题：num-46 地球年龄区间修正为45亿–46亿年；num-14 快递问题固定为2024统计年度；num-11 生命周期心跳估算与公式一致；num-12 明确是“可探测地震”；num-41 写明泳池平均水深假设。

## 逐题台账

| ID | 题目 | 当前参考答案 | 来源 | 来源链接 | 核验状态 / 复核说明 |
|---|---|---:|---|---|---|
| num-0 | 全世界人类一天的心跳总数大约是多少？ | 800000000000000 次 | UN World Population Prospects + Cleveland Clinic heart-rate reference | [来源](https://population.un.org/wpp/) | derived；以约80亿人口×每人每天约10万次心跳估算数量级；人口与个人心率均为近似值。 |
| num-1 | 胡夫大金字塔的总重量大约是多少？ | 5900000 吨 | npj Heritage Science：胡夫金字塔石块数量与重量估算 | [来源](https://www.nature.com/articles/s40494-025-02018-w) | derived；约230万块石块、平均约2.5吨，乘积约575万吨；题目结果为近似估计。 |
| num-2 | 地球上现存树木的总数大约是多少？ | 3000000000000 棵 | Nature：Mapping tree density at a global scale | [来源](https://www.nature.com/articles/nature14967) | verified；研究估计全球树木约3.04万亿棵；研究估计每年砍伐超过150亿棵，非等同于净减少量。 |
| num-3 | 全世界一年要喝掉多少杯咖啡？ | 1100000000000 杯 | International Coffee Organization（ICO）咖啡发展报告 | [来源](https://icocoffee.org/documents/cy2024-25/coffee-development-report-2022-23.pdf) | derived；报告引用全球每日约30亿杯咖啡；换算成年约1.095万亿杯，取约1.1万亿杯。 |
| num-4 | 月球的质量大约是多少？ | 7.35e+22 千克 | NASA NSSDC Moon Fact Sheet | [来源](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html) | verified；采用NASA月球质量约7.35×10²²千克的近似值。 |
| num-5 | 《哈利·波特》全系列英文版总词数大约是多少？ | 1100086 词 | Wizarding World：Harry Potter books sold worldwide（官方系列网站） | [来源](https://www.harrypotter.com/pt/news/500-million-harry-potter-books-have-now-been-sold-worldwide) | verified；官方文章给出七部英文原著总词数约1,100,086；词数会因版本及计数方式略有差异。 |
| num-6 | 阳光从太阳到达地球需要多长时间？ | 499 秒 | NASA：Voyager 1—What is a light-day? | [来源](https://science.nasa.gov/mission/voyager/voyager-1/voyager-1-what-is-a-light-day/) | verified；太阳光到地球约8分20秒；499秒是近似平均光行时，按约数使用。 |
| num-7 | 人体内大约有多少个细胞？ | 37000000000000 个 | Bianconi et al.：An estimation of the number of cells in the human body（PubMed） | [来源](https://pubmed.ncbi.nlm.nih.gov/23829164/) | verified；2013年研究估算参考值约3.72×10¹³个细胞；不同人体大小和统计方法会改变估值。 |
| num-8 | 地球上的蚂蚁总数大约是多少？ | 20000000000000000 只 | PNAS：The abundance, biomass, and distribution of ants on Earth | [来源](https://pmc.ncbi.nlm.nih.gov/articles/PMC9546634/) | verified；研究估算全球蚂蚁约19.8×10¹⁵只，取数量级近似为2×10¹⁶只。 |
| num-9 | 地球的质量大约是多少？ | 5.97e+24 千克 | NASA NSSDC Earth Fact Sheet | [来源](https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html) | verified；NASA给出的地球质量约5.9722×10²⁴千克。 |
| num-10 | 长江一年流入海洋的水量大约是多少？ | 1000000000000 立方米 | Encyclopaedia Britannica：Yangtze River | [来源](https://www.britannica.com/place/Yangtze-River) | derived；以文献给出的多年平均流量量级折算全年水量；径流量受年份和测量口径影响，答案为粗估值。 |
| num-11 | 一个人一生的心跳总数大约是多少？ | 2900000000 次 | Cleveland Clinic：Heart Rate | [来源](https://my.clevelandclinic.org/health/diagnostics/heart-rate) | derived；按80年、平均约70次/分钟计算约29.4亿次；寿命和心率的个体差异很大。 |
| num-12 | 全球每年大约有多少次可探测的地震？ | 500000 次 | U.S. Geological Survey：Cool Earthquake Facts | [来源](https://www.usgs.gov/programs/earthquake-hazards/cool-earthquake-facts) | verified；USGS称全球每年约50万次可探测地震；约10万次可被人感知，约100次造成损害，题干需明确“可探测”。 |
| num-13 | 大堡礁的总长度大约是多少？ | 2300000 米 | NOAA National Ocean Service：What is the Great Barrier Reef? | [来源](https://oceanservice.noaa.gov/facts/gbrlargeststructure.html) | verified；NOAA给出大堡礁系统长度约2300千米。 |
| num-14 | 2024年中国快递业务量大约是多少件？ | 175080000000 件 | 中华人民共和国交通运输部：2024年邮政行业发展统计公报 | [来源](https://www.mot.gov.cn/shuju/fenxigongbao/hangyegongbao/202512/t20251230_4192148.html) | verified；改为2024年度口径；全国快递业务量约1750.8亿件，不再使用无年份的1700亿估值。 |
| num-15 | 一支圆珠笔大约能写出多长的字迹？ | 2000 米 | BIC Japan：品質・筆記距離試験 | [来源](https://bic-japan.co.jp/quality/) | verified；BIC日本页面介绍笔芯书写距离测试标准，约2千米作为示例近似值；不同型号有差异。 |
| num-16 | 英文维基百科的条目总数大约是多少？ | 7000000 条 | Meta-Wiki：English Wikipedia | [来源](https://meta.wikimedia.org/wiki/English_Wikipedia/en) | verified；条目数是动态数字，题目用约700万条的数量级，不应当作永久不变的精确总数。 |
| num-17 | 太阳到最近的恒星比邻星的距离大约是多少？ | 40000000000000 千米 | NASA：Voyager 1—What is a light-day? | [来源](https://science.nasa.gov/mission/voyager/voyager-1/voyager-1-what-is-a-light-day/) | verified；比邻星约4.24光年；以光年换算约4.0×10¹³千米。 |
| num-18 | 全世界一天大约发送多少条短信？ | 230000000000 条 | 待核验：全球短信总量缺少覆盖范围和可追溯的统一统计 | 未提供（待补） | needs-review；现有2300亿条/日缺少可靠的全球全口径来源，国际A2P短信数据不能代替全球所有短信；暂移出正式题库。 |
| num-19 | 一座标准足球场的草坪上大约有多少根草？ | 100000000 根 | 待核验：足球场草叶总数为高度依赖草种、维护和计数定义的推算 | 未提供（待补） | needs-review；每平方米1万根草的假设尚无可复核来源，不能把推算包装成通用事实；暂移出正式题库。 |
| num-20 | 全世界所有家猫加起来，一年大约要吃掉多少吨猫粮？ | 12000000 吨 | 待核验：全球家猫总量与单猫年食量没有足够统一来源 | 未提供（待补） | needs-review；现有数值直接相乘依赖两个未核实假设，暂移出正式题库。 |
| num-21 | 一个人每天大约会眨眼多少次？ | 12000–20000 次 | American Academy of Ophthalmology EyeWiki：Eye in Numbers | [来源](https://eyewiki.aao.org/Eye_in_numbers) | derived；正常眨眼频率资料常见约12–20次/分钟；按清醒约16小时折算得到约1.15万–1.92万次。 |
| num-22 | 银河系大约有多少颗恒星？ | 100000000000–400000000000 个 | NASA Science：Our Milky Way Galaxy—How Big Is Space? | [来源](https://science.nasa.gov/universe/exoplanets/our-milky-way-galaxy-how-big-is-space/) | verified；NASA给出的银河系恒星数估计约1000亿至4000亿颗。 |
| num-23 | 一个成年人体内的血液总量大约是多少升？ | 4–6 升 | Cleveland Clinic：Blood Volume Testing | [来源](https://my.clevelandclinic.org/health/diagnostics/16793-blood-volume-testing) | derived；资料称成人平均血量约5升；3.5–5.5升为不同体型成人的宽泛估算区间，不是医学诊断范围。 |
| num-24 | 太阳表面（光球层）的温度大约是多少摄氏度？ | 5000–6000 度 | NASA Science：Sun Facts | [来源](https://science.nasa.gov/sun/facts/) | verified；NASA称太阳光球层温度约5500摄氏度；题目采用5000–6000度宽区间。 |
| num-25 | 世界海洋的平均深度大约是多少米？ | 3500–3800 米 | NOAA Ocean Exploration：Ocean Depth | [来源](https://oceanexplorer.noaa.gov/ocean-fact/ocean-depth/) | verified；NOAA资料给出的海洋平均深度约3682米。 |
| num-26 | 月球到地球的距离大约是多少千米？ | 356000–407000 千米 | NASA：Daily Moon Guide | [来源](https://science.nasa.gov/moon/daily-moon-guide/) | verified；NASA给出的月地距离随轨道变化约356,400–406,700千米。 |
| num-27 | 全球人均预期寿命大约是多少年？ | 71–74 年 | United Nations：Population / global life expectancy | [来源](https://www.un.org/en/global-issues/population) | verified；联合国资料给出2024年全球预期寿命约73.3岁；范围按约数呈现。 |
| num-28 | 一天大约有多少秒？ | 86400 秒 | NIST：Time and Frequency Division—Leap Seconds | [来源](https://www.nist.gov/pml/time-and-frequency-division/time-realization/leap-seconds) | derived；按名义日24小时×60分钟×60秒=86,400秒计算；此处是日常单位换算，不讨论闰秒的特殊计时规则。 |
| num-29 | 一位成年人全身大约有多少块骨头？ | 206 个 | Harvard BioNumbers：Number of bones in adult human | [来源](https://bionumbers.hms.harvard.edu/bionumber.aspx?id=102383&s=n&v=2) | verified；成年人体骨骼常见计数为206块；个体差异和骨骼融合会造成少量差异。 |
| num-30 | 长江的全长大约是多少千米？ | 6300 千米 | 中国政府网：The Yangtze River | [来源](https://english.www.gov.cn/news/202601/05/content_WS695b59a8c6d00ca5f9a0869a.html) | verified；中国政府网介绍长江干流全长约6300千米。 |
| num-31 | 赤道的周长大约是多少千米？ | 40075 千米 | NASA NSSDC Earth Fact Sheet | [来源](https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html) | derived；采用NASA给出的地球赤道半径6378.137千米，按2πr折算约40,075千米。 |
| num-32 | 一个人一天大约心跳多少次？ | 100000 次 | Cleveland Clinic：Heart Rate | [来源](https://my.clevelandclinic.org/health/diagnostics/heart-rate) | derived；按平均约70次/分钟×1440分钟/天≈100,800次；这是方便估测的数量级，不是人人相同的实测均值。 |
| num-33 | 亚马逊河的全长大约是多少千米？ | 6400 千米 | Encyclopaedia Britannica：Amazon River | [来源](https://www.britannica.com/place/Amazon-River) | derived；常见长度估算约6400千米；亚马逊河与尼罗河长度排序会受源头和测量口径影响，已在说明中提示争议。 |
| num-34 | 按太阳日计算，地球自转一周大约是多少分钟？ | 1440 分钟 | NASA NSSDC Earth Fact Sheet | [来源](https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html) | derived；题目明确按太阳日计算：24小时=1440分钟；恒星日约23小时56分，二者不能混用。 |
| num-35 | 京沪高速铁路的全长大约是多少千米？ | 1318 千米 | 待核验：京沪高铁长度需要更直接的运营/铁路官方来源 | 未提供（待补） | needs-review；当前1318千米数据缺少本轮确认的直接官方来源，暂移出正式题库，待补源后再发布。 |
| num-36 | 声音在空气中传播 1 千米大约需要多少秒？ | 3 秒 | California Public Utilities Commission：Speed of Sound | [来源](https://ia.cpuc.ca.gov/environment/info/esa/lakeview/resources/4-13_noise.pdf) | derived；资料给出20℃空气中声速约343米/秒；1000÷343≈2.9秒，取约3秒。 |
| num-37 | 地球上的水大约有多少立方米？ | 1400000000000000000 立方米 | U.S. Geological Survey：How much water is there on, in, and above the Earth? | [来源](https://www.usgs.gov/faqs/how-much-natural-water-there) | verified；USGS给出的地球总水量约13.86亿立方千米，换算约1.386×10¹⁸立方米。 |
| num-38 | 河马一次潜水大约能屏息多少分钟？ | 5 分钟 | Ueno Zoo：Hippopotamus Encyclopedia | [来源](https://www.tokyo-zoo.net/en/ueno/encyclopedia/hippopotamus/index.html) | verified；动物园资料介绍河马可以在水下停留超过5分钟；题目取约5分钟。 |
| num-39 | 珠穆朗玛峰比泰山大约高多少米？ | 7304 米 | 待核验：珠峰与泰山海拔差需对两处权威测绘口径逐一锁定 | 未提供（待补） | needs-review；目前7304米是以8849米减1545米得到的近似结果，但本轮未确认两处高度的同口径官方来源，暂移出正式题库。 |
| num-40 | 恐龙灭绝距今大约多少年？ | 66000000 年 | PubMed：Late Cretaceous mass extinction | [来源](https://pubmed.ncbi.nlm.nih.gov/25065505/) | verified；非鸟类恐龙的大灭绝发生于约6600万年前。 |
| num-41 | 按平均水深2米估算，一个50米×25米标准泳池大约蓄水多少立方米？ | 2500 立方米 | World Aquatics Competition Regulations | [来源](https://resources.fina.org/fina/document/2024/01/29/2b4f5bea-f965-411c-8fae-6d33bda64b85/Competition-Regulations-version-1st-January-2024-_-Publishing_V3.pdf) | derived；50×25米泳池尺寸可由赛事规则核对；答案2500立方米还依赖“平均水深2米”的显式假设。 |
| num-42 | 成年人平静时每分钟大约呼吸多少次？ | 12–20 次 | MedlinePlus：Rapid shallow breathing | [来源](https://medlineplus.gov/ency/article/007198.htm) | verified；MedlinePlus给出的成年人静息呼吸频率常见范围为12–20次/分钟。 |
| num-43 | 一个成年人头上大约有多少根头发？ | 80000–150000 根 | JAMA Dermatology：scalp hair density and count | [来源](https://jamanetwork.com/journals/jamadermatology/fullarticle/419780) | verified；常见成人头发量估计约10万根；不同人群、发色、年龄和个体差异明显。 |
| num-44 | 一位成年人大约有多少颗牙齿？ | 28–32 个 | Cleveland Clinic：Teeth | [来源](https://my.clevelandclinic.org/health/articles/24655-teeth) | verified；大多数成年人有32颗恒牙；部分人因智齿未萌出或拔除而约28颗。 |
| num-45 | 马里亚纳海沟最深处大约有多深？ | 10500–11000 米 | NOAA Ocean Exploration：Ocean Depth | [来源](https://oceanexplorer.noaa.gov/ocean-fact/ocean-depth/) | verified；NOAA资料列挑战者深渊深度约10,935米；不同测次和基准会有差异。 |
| num-46 | 地球的年龄大约是多少年？ | 4500000000–4600000000 年 | U.S. Geological Survey：Age of the Earth | [来源](https://pubs.usgs.gov/gip/geotime/age.html) | verified；USGS给出地球年龄约45.4亿年，误差小于1%；原题区间少了一个数量级，本轮已修正。 |
| num-47 | 一只家猫每天大约睡多少小时？ | 12–18 小时 | Cats Protection：Cats and sleep | [来源](https://www.cats.org.uk/help-and-advice/cat-behaviour/cats-and-sleep) | verified；猫每天常见睡眠时间约12–18小时；年龄和个体差异会改变睡眠时间。 |
| num-48 | 成年人的体温大约是多少摄氏度？ | 36.5–37.3 度 | MedlinePlus：Vital signs | [来源](https://medlineplus.gov/ency/article/002341.htm) | verified；MedlinePlus给出的健康成年人常见体温约36.5–37.3℃；测量位置与时间会有差异。 |
| num-49 | 一个成年人每天大约走多少步？ | 4000–8000 步 | PubMed：step-count and health systematic review | [来源](https://pubmed.ncbi.nlm.nih.gov/40713949/) | verified；采用约4000–8000步的宽泛参考范围；这不是适用于所有人的硬性健康目标，受年龄和生活方式影响。 |

## 尚未关闭的内容工作

1. 5 道 draft 需补直接来源或重新设计；不能仅将 source.name 改成“公开资料”后恢复发布。
2. 对未来每日排期只替换尚未发布的日期；已过去和当前日期的映射保留，不改写历史题目。
3. 后续编辑数量级题必须保留 `source.url` 和 `source.reviewStatus`，通过 `npm run verify` 后再进入 PR。
