# 数量级题库逐题来源核验台账

- 数据基线：`size-it-up-mobile/data/pools.json` v2.7.5
- 更新日期：2026-10-24
- **核验原则：只有 `verified` / `derived` 且包含 `source.reviewEvidence` 的题目才算完成源文核对。URL 存在或备注写着某个数字，不等于已审核。**
- 当前共 50 道题：published 45；review 5；draft 0。
- 有可复核源文证据的题：5（verified 3，derived 2）。
- 仍待逐页核验：35 道 published 题。
- 实际打开并核对的来源：NASA NSSDC Moon Fact Sheet（num-4、num-26）；NASA NSSDC Earth Fact Sheet（num-9、num-31、num-34）。其中 num-12 和 num-13 保持 pending，因为当前仓库记录没有保存独立、可复查的源文定位。
- 5 道设为 `status: "review"`，不进入新版活动兜底池或新的正式排期。历史排期/历史兜底快照为避免追溯改写保持原样。

## 逐题台账

| ID | 题目 | 当前答案/范围 | 来源标签 | 来源链接 | 状态与复核依据 |
|---|---|---:|---|---|---|
| num-0 | 全世界人类一天的心跳总数大约是多少？ | 800000000000000 次 | UN World Population Prospects + Cleveland Clinic heart-rate reference | [来源](https://population.un.org/wpp/) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-1 | 胡夫大金字塔的总重量大约是多少？ | 5900000 吨 | npj Heritage Science：胡夫金字塔石块数量与重量估算 | [来源](https://www.nature.com/articles/s40494-025-02018-w) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-2 | 地球上现存树木的总数大约是多少？ | 3000000000000 棵 | Nature：Mapping tree density at a global scale | [来源](https://www.nature.com/articles/nature14967) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-3 | 全世界一年要喝掉多少杯咖啡？ | 1100000000000 杯 | International Coffee Organization（ICO）咖啡发展报告 | [来源](https://icocoffee.org/documents/cy2024-25/coffee-development-report-2022-23.pdf) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-4 | 月球的质量大约是多少？ | 7.35e+22 千克 | NASA NSSDC Moon Fact Sheet | [来源](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html) | VERIFIED / NASA NSSDC Moon Fact Sheet, “Bulk parameters”, Mass row: Moon mass is 0.07346 × 10^24 kg = 7.346 × 10^22 kg; game value 7.35 × 10^22 kg is a rounding of the source value. |
| num-5 | 《哈利·波特》全系列英文版总词数大约是多少？ | 1100086 词 | Wizarding World：Harry Potter books sold worldwide（官方系列网站） | [来源](https://www.harrypotter.com/pt/news/500-million-harry-potter-books-have-now-been-sold-worldwide) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-6 | 阳光从太阳到达地球需要多长时间？ | 499 秒 | NASA：Voyager 1—What is a light-day? | [来源](https://science.nasa.gov/mission/voyager/voyager-1/voyager-1-what-is-a-light-day/) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-7 | 人体内大约有多少个细胞？ | 37000000000000 个 | Bianconi et al.：An estimation of the number of cells in the human body（PubMed） | [来源](https://pubmed.ncbi.nlm.nih.gov/23829164/) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-8 | 地球上的蚂蚁总数大约是多少？ | 20000000000000000 只 | PNAS：The abundance, biomass, and distribution of ants on Earth | [来源](https://pmc.ncbi.nlm.nih.gov/articles/PMC9546634/) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-9 | 地球的质量大约是多少？ | 5.97e+24 千克 | NASA NSSDC Earth Fact Sheet | [来源](https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html) | VERIFIED / NASA NSSDC Earth Fact Sheet, “Bulk parameters”, Mass row: 5.9722 × 10^24 kg; game value 5.97 × 10^24 kg is rounded to three significant figures. |
| num-10 | 长江一年流入海洋的水量大约是多少？ | 1000000000000 立方米 | Encyclopaedia Britannica：Yangtze River | [来源](https://www.britannica.com/place/Yangtze-River) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-11 | 一个人一生的心跳总数大约是多少？ | 2900000000 次 | Cleveland Clinic：Heart Rate | [来源](https://my.clevelandclinic.org/health/diagnostics/heart-rate) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-12 | 全球每年大约有多少次可探测的地震？ | 500000 次 | U.S. Geological Survey：Cool Earthquake Facts | [来源](https://www.usgs.gov/programs/earthquake-hazards/cool-earthquake-facts) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-13 | 大堡礁的总长度大约是多少？ | 2300000 米 | NOAA National Ocean Service：What is the Great Barrier Reef? | [来源](https://oceanservice.noaa.gov/facts/gbrlargeststructure.html) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-14 | 2024年中国快递业务量大约是多少件？ | 175080000000 件 | 中华人民共和国交通运输部：2024年邮政行业发展统计公报 | [来源](https://www.mot.gov.cn/shuju/fenxigongbao/hangyegongbao/202512/t20251230_4192148.html) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-15 | 一支圆珠笔大约能写出多长的字迹？ | 2000 米 | BIC Japan：品質・筆記距離試験 | [来源](https://bic-japan.co.jp/quality/) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-16 | 英文维基百科的条目总数大约是多少？ | 7000000 条 | Meta-Wiki：English Wikipedia | [来源](https://meta.wikimedia.org/wiki/English_Wikipedia/en) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-17 | 太阳到最近的恒星比邻星的距离大约是多少？ | 40000000000000 千米 | NASA：Voyager 1—What is a light-day? | [来源](https://science.nasa.gov/mission/voyager/voyager-1/voyager-1-what-is-a-light-day/) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-18 | 全世界一天大约发送多少条短信？ | 230000000000 条 | 待核验：全球短信总量缺少覆盖范围和可追溯的统一统计 | —（需补充来源） | REVIEW / 暂不纳入新版题目池；现有2300亿条/日缺少可靠的全球全口径来源，国际A2P短信数据不能代替全球所有短信；暂移出正式题库。 |
| num-19 | 一座标准足球场的草坪上大约有多少根草？ | 100000000 根 | 待核验：足球场草叶总数为高度依赖草种、维护和计数定义的推算 | —（需补充来源） | REVIEW / 暂不纳入新版题目池；每平方米1万根草的假设尚无可复核来源，不能把推算包装成通用事实；暂移出正式题库。 |
| num-20 | 全世界所有家猫加起来，一年大约要吃掉多少吨猫粮？ | 12000000 吨 | 待核验：全球家猫总量与单猫年食量没有足够统一来源 | —（需补充来源） | REVIEW / 暂不纳入新版题目池；现有数值直接相乘依赖两个未核实假设，暂移出正式题库。 |
| num-21 | 一个人每天大约会眨眼多少次？ | 12000–20000 次 | American Academy of Ophthalmology EyeWiki：Eye in Numbers | [来源](https://eyewiki.aao.org/Eye_in_numbers) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-22 | 银河系大约有多少颗恒星？ | 100000000000–400000000000 个 | NASA Science：Our Milky Way Galaxy—How Big Is Space? | [来源](https://science.nasa.gov/universe/exoplanets/our-milky-way-galaxy-how-big-is-space/) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-23 | 一个成年人体内的血液总量大约是多少升？ | 4–6 升 | Cleveland Clinic：Blood Volume Testing | [来源](https://my.clevelandclinic.org/health/diagnostics/16793-blood-volume-testing) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-24 | 太阳表面（光球层）的温度大约是多少摄氏度？ | 5000–6000 度 | NASA Science：Sun Facts | [来源](https://science.nasa.gov/sun/facts/) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-25 | 世界海洋的平均深度大约是多少米？ | 3500–3800 米 | NOAA Ocean Exploration：Ocean Depth | [来源](https://oceanexplorer.noaa.gov/ocean-fact/ocean-depth/) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-26 | 月球到地球的距离大约是多少千米？ | 357000–407000 千米 | NASA：Daily Moon Guide | [来源](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html) | VERIFIED / NASA NSSDC Moon Fact Sheet, note below orbital parameters: Moon–Earth distance roughly ranges from 357,000 km to 407,000 km; game reference interval follows that stated range. |
| num-27 | 全球人均预期寿命大约是多少年？ | 71–74 年 | United Nations：Population / global life expectancy | [来源](https://www.un.org/en/global-issues/population) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-28 | 一天大约有多少秒？ | 86400 秒 | NIST：Time and Frequency Division—Leap Seconds | [来源](https://www.nist.gov/pml/time-and-frequency-division/time-realization/leap-seconds) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-29 | 一位成年人全身大约有多少块骨头？ | 206 个 | Harvard BioNumbers：Number of bones in adult human | [来源](https://bionumbers.hms.harvard.edu/bionumber.aspx?id=102383&s=n&v=2) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-30 | 长江的全长大约是多少千米？ | 6300 千米 | 中国政府网：The Yangtze River | [来源](https://english.www.gov.cn/news/202601/05/content_WS695b59a8c6d00ca5f9a0869a.html) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-31 | 赤道的周长大约是多少千米？ | 40075 千米 | NASA NSSDC Earth Fact Sheet | [来源](https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html) | DERIVED / NASA NSSDC Earth Fact Sheet, “Bulk parameters”, equatorial radius 6,378.137 km; 2π × 6,378.137 km ≈ 40,075 km. |
| num-32 | 一个人一天大约心跳多少次？ | 100000 次 | Cleveland Clinic：Heart Rate | [来源](https://my.clevelandclinic.org/health/diagnostics/heart-rate) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-33 | 亚马逊河的全长大约是多少千米？ | 6400 千米 | Encyclopaedia Britannica：Amazon River | [来源](https://www.britannica.com/place/Amazon-River) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-34 | 按太阳日计算，地球自转一周大约是多少分钟？ | 1440 分钟 | NASA NSSDC Earth Fact Sheet | [来源](https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html) | DERIVED / NASA NSSDC Earth Fact Sheet, “Orbital parameters”: length of day 24.0000 h, while sidereal rotation period is 23.9345 h. Question explicitly specifies solar day; 24 × 60 = 1,440 minutes. |
| num-35 | 京沪高速铁路的全长大约是多少千米？ | 1318 千米 | 待核验：京沪高铁长度需要更直接的运营/铁路官方来源 | —（需补充来源） | REVIEW / 暂不纳入新版题目池；当前1318千米数据缺少本轮确认的直接官方来源，暂移出正式题库，待补源后再发布。 |
| num-36 | 声音在空气中传播 1 千米大约需要多少秒？ | 3 秒 | California Public Utilities Commission：Speed of Sound | [来源](https://ia.cpuc.ca.gov/environment/info/esa/lakeview/resources/4-13_noise.pdf) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-37 | 地球上的水大约有多少立方米？ | 1400000000000000000 立方米 | U.S. Geological Survey：How much water is there on, in, and above the Earth? | [来源](https://www.usgs.gov/faqs/how-much-natural-water-there) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-38 | 河马一次潜水大约能屏息多少分钟？ | 5 分钟 | Ueno Zoo：Hippopotamus Encyclopedia | [来源](https://www.tokyo-zoo.net/en/ueno/encyclopedia/hippopotamus/index.html) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-39 | 珠穆朗玛峰比泰山大约高多少米？ | 7304 米 | 待核验：珠峰与泰山海拔差需对两处权威测绘口径逐一锁定 | —（需补充来源） | REVIEW / 暂不纳入新版题目池；目前7304米是以8849米减1545米得到的近似结果，但本轮未确认两处高度的同口径官方来源，暂移出正式题库。 |
| num-40 | 恐龙灭绝距今大约多少年？ | 66000000 年 | PubMed：Late Cretaceous mass extinction | [来源](https://pubmed.ncbi.nlm.nih.gov/25065505/) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-41 | 按平均水深2米估算，一个50米×25米标准泳池大约蓄水多少立方米？ | 2500 立方米 | World Aquatics Competition Regulations | [来源](https://resources.fina.org/fina/document/2024/01/29/2b4f5bea-f965-411c-8fae-6d33bda64b85/Competition-Regulations-version-1st-January-2024-_-Publishing_V3.pdf) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-42 | 成年人平静时每分钟大约呼吸多少次？ | 12–20 次 | MedlinePlus：Rapid shallow breathing | [来源](https://medlineplus.gov/ency/article/007198.htm) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-43 | 一个成年人头上大约有多少根头发？ | 80000–150000 根 | JAMA Dermatology：scalp hair density and count | [来源](https://jamanetwork.com/journals/jamadermatology/fullarticle/419780) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-44 | 一位成年人大约有多少颗牙齿？ | 28–32 个 | Cleveland Clinic：Teeth | [来源](https://my.clevelandclinic.org/health/articles/24655-teeth) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-45 | 马里亚纳海沟最深处大约有多深？ | 10500–11000 米 | NOAA Ocean Exploration：Ocean Depth | [来源](https://oceanexplorer.noaa.gov/ocean-fact/ocean-depth/) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-46 | 地球的年龄大约是多少年？ | 4500000000–4600000000 年 | U.S. Geological Survey：Age of the Earth | [来源](https://pubs.usgs.gov/gip/geotime/age.html) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-47 | 一只家猫每天大约睡多少小时？ | 12–18 小时 | Cats Protection：Cats and sleep | [来源](https://www.cats.org.uk/help-and-advice/cat-behaviour/cats-and-sleep) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-48 | 成年人的体温大约是多少摄氏度？ | 36.5–37.3 度 | MedlinePlus：Vital signs | [来源](https://medlineplus.gov/ency/article/002341.htm) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |
| num-49 | 一个成年人每天大约走多少步？ | 4000–8000 步 | PubMed：step-count and health systematic review | [来源](https://pubmed.ncbi.nlm.nih.gov/40713949/) | PENDING / 候选 URL 已登记，但尚未逐页核对并保存可复查证据；不代表事实审核通过。 |

## 剩余核验的关闭标准

每一道 pending 题必须在实际访问来源后记录：原文/表格位置、原始数字及单位、统计定义、换算步骤、估算范围和访问日期。若网页无法访问、原文没有明确支持答案、来源口径不同或估算假设不可靠，需修订题目或保持 review。不能仅因为来源来自权威域名就自动通过。
