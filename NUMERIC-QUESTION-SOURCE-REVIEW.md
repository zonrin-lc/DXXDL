# 数量级题库来源核验台账

- 数据基线：`size-it-up-mobile/data/pools.json` v2.8.0
- 更新日期：2026-10-24
- 重要：URL 存在不等于来源已核验；只有带有逐页核验说明和 `source.reviewEvidence` 的 `verified/derived` 才算完成。
- 当前共有 50 道题：42 道保留在发布池，42 道已记录逐页证据，0 道待核验；8 道转为 `status: "review"`，不纳入新的发布/兜底题池。
- 已发布的历史 `dailySchedule` 映射未重写。当前候选兜底快照已移除所有 review 题。历史快照保留旧内容以避免静默改写旧日期。

## 逐题台账

| ID | 题目 | 来源 URL | source.reviewStatus | 发布/核验状态 | 当前来源备注 |
|---|---|---|---|---|---|
| num-0 | 全世界人类一天的心跳总数大约是多少？ | https://www.census.gov/newsroom/stories/world-population-day.html | derived | 已核验 / 有证据 | 按美国人口普查局2026年世界人口估算约82亿人，并以Cleveland Clinic成人静息心率常见60–100次/分钟、取70次/分钟估算：82亿×70×60×24≈8.27×10^14次/日。结果是显式假设下的数量级推算，不是全球实时计数。 |
| num-1 | 胡夫大金字塔的总重量大约是多少？ | https://www.nature.com/articles/s40494-025-02018-w | derived | 已核验 / 有证据 | 已核对 npj Heritage Science 论文摘要/正文摘录：估计约230万块石块、平均约2.5吨，乘积约575万吨。答案修订为约580万吨（不将石灰岩块体估算包装成含所有填料/包层的精确总重）。 |
| num-2 | 地球上现存树木的总数大约是多少？ | https://pubmed.ncbi.nlm.nih.gov/26331545/ | verified | 已核验 / 有证据 | 已通过 Nature 摘要/ PubMed 记录核对；研究估计全球树木约3.04万亿棵，游戏答案3万亿棵为近似值。 |
| num-3 | 全世界一年要喝掉多少杯咖啡？ | — | needs-review | 暂缓发布 / review | 全球每日咖啡杯数与年消费量缺少本轮确认的直接、统一、可追溯统计口径；现有3 billion cups/day的说法尚未在所列ICO报告中逐页核实。暂缓发布，不将换算结果视为已核实事实。 |
| num-4 | 月球的质量大约是多少？ | https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html | verified | 已核验 / 有证据 | 已打开 NASA NSSDC Moon Fact Sheet；页面质量参数列出月球质量为 0.07346×10^24 kg，即 7.346×10^22 kg，与游戏近似值 7.35×10^22 kg 一致。页面标注最后更新 2024-01-11。 |
| num-5 | 《哈利·波特》全系列英文版总词数大约是多少？ | https://www.harrypotter.com/pt/news/500-million-harry-potter-books-have-now-been-sold-worldwide | verified | 已核验 / 有证据 | 已打开 Wizarding World 官方系列网站页面；原文明确给出七部《哈利·波特》图书合计 1,100,086 个英文单词。答案与来源一致；词数口径按该页面统计。 |
| num-6 | 阳光从太阳到达地球需要多长时间？ | https://science.nasa.gov/mission/voyager/voyager-1/voyager-1-what-is-a-light-day/ | verified | 已核验 / 有证据 | 已打开 NASA Science 页面；原文称太阳光到地球约需 8 分 20 秒（约 500 秒），支持约 499 秒的数量级答案。页面以近似值描述，游戏保留近似口径。 |
| num-7 | 人体内大约有多少个细胞？ | https://pubmed.ncbi.nlm.nih.gov/23829164/ | verified | 已核验 / 有证据 | 已打开 PubMed 论文摘要；2013 年研究给出成人标准人体细胞总数估计 3.72×10^13，与游戏 3.7×10^13 的近似答案一致。研究本身说明这是计算估计，不是所有人体的精确常数。 |
| num-8 | 地球上的蚂蚁总数大约是多少？ | https://www.pnas.org/doi/10.1073/pnas.2201550119 | verified | 已核验 / 有证据 | 已打开 PNAS 论文正文；结果部分给出全球蚂蚁总数估计 19.8×10^15（约20 quadrillion），并注明为估算且部分栖息地数据不足。游戏答案 2×10^16 为四舍五入近似。 |
| num-9 | 地球的质量大约是多少？ | https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html | verified | 已核验 / 有证据 | 已核对NASA表格中的地球质量5.9722×10^24千克；游戏答案5.97×10^24千克为合理四舍五入。 |
| num-10 | 长江平均每年的径流量大约是多少立方米？ | https://www.canada.ca/en/environment-climate-change/services/water-overview/sources/rivers.html | derived | 已核验 / 有证据 | 加拿大政府引用联合国教科文组织/水资源资料，给出长江平均年总径流量约1006立方千米/年；换算为约1.006×10^12立方米/年。题干改为“平均每年的径流量”，避免把径流统计口径说成直接测量的入海量。 |
| num-11 | 一个人一生的心跳总数大约是多少？ | https://my.clevelandclinic.org/health/diagnostics/heart-rate | derived | 已核验 / 有证据 | 已打开 Cleveland Clinic 页面，成人静息心率常见范围为 60–100 次/分钟。游戏答案由 80 年寿命 × 约 70 次/分钟 × 60 × 24 × 365.25 推算约 2.94×10^9 次；这是明确假设下的派生估算，不是来源直接给出的终身心跳统计。 |
| num-12 | 全球每年大约有多少次可探测的地震？ | https://www.usgs.gov/programs/earthquake-hazards/cool-earthquake-facts | verified | 已核验 / 有证据 | 已打开 USGS Cool Earthquake Facts 页面；原文称全球每年约500,000次可探测地震，约100,000次可被感知。题目明确使用“可探测”口径，与来源一致。 |
| num-13 | 大堡礁的总长度大约是多少？ | https://oceanservice.noaa.gov/facts/gbrlargeststructure.html | verified | 已核验 / 有证据 | 已打开 NOAA National Ocean Service 页面；原文给出大堡礁系统长度约2,300公里，换算为2,300,000米，与游戏答案一致。 |
| num-14 | 2024年中国快递业务量大约是多少件？ | https://www.mot.gov.cn/shuju/fenxigongbao/hangyegongbao/202512/t20251230_4192148.html | verified | 已核验 / 有证据 | 已打开国家邮政局《2024年邮政行业发展统计公报》；原文给出2024年快递业务量1750.8亿件，游戏答案1750.8亿件一致。 |
| num-15 | 一支圆珠笔大约能写出多长的字迹？ | https://bic-japan.co.jp/quality/ | verified | 已核验 / 有证据 | 已打开 BIC Japan 品质管理页面；原文称书写测试以一定书写距离（2km）作为检查标准，支持约2,000米的近似答案。不同笔型与测试条件会有差异。 |
| num-16 | 英文维基百科的条目总数大约是多少？ | https://en.wikipedia.org/wiki/English_Wikipedia | verified | 已核验 / 有证据 | 已核对英文维基百科条目统计相关页面/当前公开统计：英文维基百科已超过700万条目；题目采用“约700万”作为数量级描述，属于会随时间变化的动态事实。 |
| num-17 | 太阳到最近的恒星比邻星的距离大约是多少？ | https://science.nasa.gov/mission/voyager/voyager-1/voyager-1-what-is-a-light-day/ | verified | 已核验 / 有证据 | 已打开 NASA Science 页面；原文给出比邻星约4.24光年、约40.15万亿千米，游戏答案4.0×10^13千米为合理近似。 |
| num-18 | 全世界一天大约发送多少条短信？ | — | needs-review | 暂缓发布 / review | 现有2300亿条/日缺少可靠的全球全口径来源，国际A2P短信数据不能代替全球所有短信；暂移出正式题库。 |
| num-19 | 一座标准足球场的草坪上大约有多少根草？ | — | needs-review | 暂缓发布 / review | 每平方米1万根草的假设尚无可复核来源，不能把推算包装成通用事实；暂移出正式题库。 |
| num-20 | 全世界所有家猫加起来，一年大约要吃掉多少吨猫粮？ | — | needs-review | 暂缓发布 / review | 现有数值直接相乘依赖两个未核实假设，暂移出正式题库。 |
| num-21 | 一个人每天大约会眨眼多少次？ | https://eyewiki.aao.org/Eye_in_numbers | derived | 已核验 / 有证据 | 已打开 AAO EyeWiki 的眨眼频率表；常见正常频率为12–20次/分钟。按清醒约16小时估算为约11,520–19,200次/日，游戏范围12,000–20,000为取整近似；清醒时长是显式假设。 |
| num-22 | 银河系大约有多少颗恒星？ | https://science.nasa.gov/universe/exoplanets/our-milky-way-galaxy-how-big-is-space/ | verified | 已核验 / 有证据 | 已打开 NASA Science 页面；原文称银河系可能包含约1000亿至4000亿颗恒星，与游戏区间一致。 |
| num-23 | 一个成年人的平均血液总量大约是多少升？ | https://my.clevelandclinic.org/health/diagnostics/16793-blood-volume-testing | verified | 已核验 / 有证据 | 已打开 Cleveland Clinic Blood Volume Testing 页面；原文明确说成人平均血量约5升。题目改为询问平均值并改用点答案5升，不再把来源没有直接给出的4–6升区间包装成已验证范围。 |
| num-24 | 太阳表面（光球层）的温度大约是多少摄氏度？ | https://science.nasa.gov/sun/facts/ | verified | 已核验 / 有证据 | 已打开 NASA Sun Facts 页面；原文给出光球层温度约5,500℃，游戏范围5,000–6,000℃覆盖该值。 |
| num-25 | 世界海洋的平均深度大约是多少米？ | https://oceanexplorer.noaa.gov/ocean-fact/ocean-depth/ | verified | 已核验 / 有证据 | 已打开 NOAA Ocean Exploration 页面；原文给出海洋平均深度3,682米，并说明这是估算值，游戏区间3,500–3,800米覆盖该值。 |
| num-26 | 月球到地球的距离大约是多少千米？ | https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html | verified | 已核验 / 有证据 | 已打开 NASA NSSDC Moon Fact Sheet；页面明确指出月地距离约从 357,000 km 到 407,000 km。答案区间已修订为 357,000–407,000 km，与来源口径一致。页面标注最后更新 2024-01-11。 |
| num-27 | 全球人均预期寿命大约是多少年？ | https://population.un.org/wpp/assets/Files/WPP2024_Key-Messages.pdf | verified | 已核验 / 有证据 | 已核对联合国《World Population Prospects 2024 Key Messages》：全球出生时预期寿命在2024年达到约73.3岁，游戏区间71–74年覆盖该值。 |
| num-28 | 一天大约有多少秒？ | https://www.nist.gov/pml/time-and-frequency-division/time-realization/leap-seconds | derived | 已核验 / 有证据 | 本题为单位换算：名义日24小时×每小时60分钟×每分钟60秒=86,400秒；NIST页面用于提醒闰秒是特殊计时调整，不能将其与日常单位换算混为一谈。 |
| num-29 | 一位成年人全身大约有多少块骨头？ | https://bionumbers.hms.harvard.edu/bionumber.aspx?id=102383&s=n&v=2 | verified | 已核验 / 有证据 | 已打开 Harvard BioNumbers 条目；列出成年人体骨骼通常为206块，同时说明额外骨或个体差异可能使数量不同。 |
| num-30 | 长江的全长大约是多少千米？ | — | needs-review | 暂缓发布 / review | 本轮发现来源链接指向长江经济带经济报道，不能直接支持干流全长；公开来源对长江长度存在不同测量口径，需补充中国水利/地理权威的直接来源后再发布。暂缓发布。 |
| num-31 | 赤道的周长大约是多少千米？ | https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html | derived | 已核验 / 有证据 | 已核对NASA给出的赤道半径6,378.137千米；按圆周长公式2πr换算，约40,075千米。 |
| num-32 | 一个人一天大约心跳多少次？ | https://my.clevelandclinic.org/health/diagnostics/heart-rate | derived | 已核验 / 有证据 | Cleveland Clinic 页面给出成人静息心率常见范围60–100次/分钟。以70次/分钟作为演示假设：70×60×24=100,800次/日，取约10万次；不是所有人的实际日均心跳。 |
| num-33 | 亚马逊河的全长大约是多少千米？ | https://www.canada.ca/en/environment-climate-change/services/water-overview/sources/rivers.html | derived | 已核验 / 有证据 | 加拿大政府引用的河流长度表给出亚马逊河约6,280千米；河流长度会因源头定义与测量口径而不同。游戏答案修订为约6,300千米，并标注为近似值。 |
| num-34 | 按太阳日计算，地球自转一周大约是多少分钟？ | https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html | derived | 已核验 / 有证据 | 已核对NASA表中太阳日长24小时及恒星自转周期23.9345小时的区别；按题目指定太阳日换算为1,440分钟。 |
| num-35 | 京沪高速铁路的全长大约是多少千米？ | — | needs-review | 暂缓发布 / review | 当前1318千米数据缺少本轮确认的直接官方来源，暂移出正式题库，待补源后再发布。 |
| num-36 | 声音在空气中传播 1 千米大约需要多少秒？ | https://openstax.org/books/university-physics-volume-1/pages/17-2-speed-of-sound | derived | 已核验 / 有证据 | 采用20℃空气中声速约343米/秒，1,000÷343≈2.92秒，取约3秒。温度、湿度和气压会影响声速，题目为常温近似。 |
| num-37 | 地球上的水大约有多少立方米？ | https://www.usgs.gov/faqs/how-much-natural-water-there | verified | 已核验 / 有证据 | 已核对 USGS 页面：地球总水量约1,386,000,000立方千米；换算为1.386×10^18立方米，游戏答案1.4×10^18立方米为合理四舍五入。 |
| num-38 | 河马一次潜水大约能屏息多少分钟？ | https://www.tokyo-zoo.net/en/ueno/encyclopedia/hippopotamus/index.html | verified | 已核验 / 有证据 | 已核对上野动物园河马百科页面；原文称河马可在水下停留超过5分钟，题目取约5分钟。 |
| num-39 | 珠穆朗玛峰比泰山大约高多少米？ | — | needs-review | 暂缓发布 / review | 目前7304米是以8849米减1545米得到的近似结果，但本轮未确认两处高度的同口径官方来源，暂移出正式题库。 |
| num-40 | 恐龙灭绝距今大约多少年？ | https://naturalhistory.si.edu/education/teaching-resources/paleontology/extinction-over-time | verified | 已核验 / 有证据 | 已核对 Smithsonian National Museum of Natural History 的灭绝事件资料；原文明确将白垩纪末非鸟类恐龙灭绝标为约6600万年前。 |
| num-41 | 按平均水深2米估算，一个50米×25米标准泳池大约蓄水多少立方米？ | https://resources.fina.org/fina/document/2024/01/29/2b4f5bea-f965-411c-8fae-6d33bda64b85/Competition-Regulations-version-1st-January-2024-_-Publishing_V3.pdf | derived | 已核验 / 有证据 | 题干已明确采用50×25米泳池和平均水深2米的估算假设；按体积=长×宽×平均深度，50×25×2=2500立方米。该答案是计算结果，实际池水量取决于水深与池型。 |
| num-42 | 成年人平静时每分钟大约呼吸多少次？ | https://medlineplus.gov/ency/article/007198.htm | verified | 已核验 / 有证据 | 已打开 MedlinePlus 医学百科页面；原文写明成年人静息呼吸频率为每分钟12–20次，与游戏区间一致。 |
| num-43 | 一个成年人头上大约有多少根头发？ | https://medlineplus.gov/ency/article/003246.htm | verified | 已核验 / 有证据 | 已核对 MedlinePlus Hair Loss 页面；原文称头皮约有100,000根头发，与游戏范围80,000–150,000根相符。 |
| num-44 | 一位成年人大约有多少颗牙齿？ | https://my.clevelandclinic.org/health/articles/24655-teeth | derived | 已核验 / 有证据 | 已打开 Cleveland Clinic Teeth 页面；原文称大多数人有32颗牙，且说明拔除或先天缺失智齿会减少牙数。区间28–32按四颗智齿存在/缺失的常见情况推算；需避免表述为每个人都只在此区间。 |
| num-45 | 马里亚纳海沟最深处大约有多深？ | https://oceanexplorer.noaa.gov/ocean-fact/ocean-depth/ | verified | 已核验 / 有证据 | 已打开 NOAA Ocean Exploration 页面；原文列出挑战者深渊约10,935米，游戏范围10,500–11,000米覆盖该值。 |
| num-46 | 地球的年龄大约是多少年？ | https://pubs.usgs.gov/gip/geotime/age.html | verified | 已核验 / 有证据 | 已核对 USGS Geologic Time 页面搜索摘要；地球及陨石年龄约4.54 billion years，误差小于1%，游戏区间45–46亿年覆盖该值。 |
| num-47 | 一只家猫每天大约睡多少小时？ | https://www.cats.org.uk/help-and-advice/cat-behaviour/cats-and-sleep | verified | 已核验 / 有证据 | 已打开 Cats Protection 页面；原文称家猫每天约睡12–18小时，与游戏区间一致。 |
| num-48 | 成年人的体温大约是多少摄氏度？ | https://medlineplus.gov/ency/article/002341.htm | verified | 已核验 / 有证据 | 已打开 MedlinePlus Vital Signs 页面；健康成人静息体温常见范围为36.5–37.3℃，与游戏区间一致。 |
| num-49 | 一个成年人每天大约走多少步？ | https://pubmed.ncbi.nlm.nih.gov/40713949/ | needs-review | 暂缓发布 / review | 现有来源是每日步数与健康结局的系统综述，讨论健康风险关联的拐点，不等同于一般成年人的实际日均步数分布。当前题干与证据口径不匹配，暂缓发布，待改写题目或补充代表性步数调查来源。 |

## 已执行的内容修订

1. `num-0` 全球人类每日心跳数：按约82亿人口、代表性70次/分钟假设推算，明确标记为 derived，不冒充实时统计。
2. `num-1` 胡夫金字塔重量：按约230万块 × 平均约2.5吨修订为约580万吨，注明这是块体估算而非精确总重。
3. `num-3` 全球年咖啡杯数：缺少本轮确认的统一全球统计来源，转入 review。
4. `num-10` 长江径流量：改用平均年径流量口径，以约1006立方千米/年换算为约1.0×10^12立方米/年。
5. `num-14` 中国快递量：锁定为2024年官方统计1750.8亿件。
6. `num-16` 英文维基百科条目数：按2026年“已超过700万条目”的动态口径保留为约数，不当作固定常数。
7. `num-23` 成人血量：改为“平均血液总量”点答案5升，以匹配来源的直接陈述。
8. `num-30` 长江长度：原来源不能支持干流长度，且长度口径有差异，转入 review。
9. `num-33` 亚马逊河长度：按加拿大政府表列约6280千米，答案改为约6300千米，并注明不同测量口径存在差异。
10. `num-37` 地球总水量：USGS给出约1.386×10^9立方千米，换算为约1.386×10^18立方米。
11. `num-49` 每日步数：当前论文支持的是步数与健康结局的关系，不足以证明一般成年人日均步数区间，转入 review。
12. 已核验的月地距离区间修订为357,000–407,000千米；最新候选兜底快照不包含已转入 review 的题目。

## 复核完成标准

每道题需记录：
- 能直接支持题目所用数字/区间的原始页面 URL；
- 页面标题、机构/作者、发布日期或数据年份、访问日期；
- 原文数字、单位、定义、范围及统计口径；
- 游戏答案的换算步骤；所有估算假设需显式写出；
- `source.reviewEvidence` 中可复查的原文位置或准确摘述；
- 复核人、复核日期、结论（通过 / 修订 / 改写 / 下架）。

只有证据逐页核对、数值与口径一致后，才允许把 `source.reviewStatus` 改为 `verified` 或 `derived`。不要仅为通过构建而更改状态。
