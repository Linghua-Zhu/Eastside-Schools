# NSD · LWSD · BSD 学校对照

Northshore (NSD)、Lake Washington (LWSD)、Bellevue (BSD) 三个学区全部公立小学、初中、高中的对照表，附学校所在 zip 的 4 房住宅近期成交价，并可任选两所学校并排比较。单个 `index.html` 文件，没有依赖，直接用 GitHub Pages 发布即可（Settings → Pages → Deploy from a branch → main / root）。

在线表格只列数据，不给“值不值得换房”的结论。

## 数据说明

| 列 | 来源 | 说明 |
|---|---|---|
| 州排名、阅读 %、数学 % | [SchoolDigger](https://www.schooldigger.com/) 2026 排名 | 依据 2025-26 学年州考 SBAC。全州分母：小学 1,138、初中 514、高中 396。阅读/数学为达标率，小学初中取全年级合计，高中取 10 年级。排名变化对比 2025 排名（分母 1,160 / 534 / 438）。|
| GS | [GreatSchools](https://www.greatschools.org/) | 1-10 评分，包含成绩、学生进步和公平性，比排名更粗。|
| 房价 (4房) | [Redfin](https://www.redfin.com/) 近期成交页，2026 年 6 月至 10 月 | 每个 zip 取 Redfin 列表页最近 41 条成交中 **4 房以上、1,800 sqft 以上** 的住宅（含联排，不含公寓）的成交价中位数。列表页不显示建造年份，用面积下限代替“排除老破小”。原始样本见 `data/redfin_sales_4bed_sample.csv`。|
| 备注 | NSD / BSD / LWSD 官网，NSD 2026 年 10 月 EDAC 董事会材料 | 天才项目设置、沉浸项目、选择校、拟关闭或重建等。|

已知局限：

- zip 是学校地址的邮编，不等于学区边界；同一个 zip 里不同片区差别很大。
- 98033 的房价样本来自 Rose Hill、Houghton、Bridle Trails 等街区页，98039 只有 4 条成交，表里标 ≈。
- McAuliffe、Sunrise、Kenmore Middle、Inglemoor 等个别学校 2026 或 2025 的排名在 SchoolDigger 上缺失。
- 选择校、线上校、替代校没有可比的学区内排名，排在各表最后。

数据整理日期：2026-10-27。

## 更新数据

所有数据都在 `index.html` 里 `const DATA = {...}` 这一段，每所学校一行：

```
{"d":"NSD","n":"Canyon Creek","z":"98021","r":35,"r25":50,"e":79.4,"m":82.5,"g":9,"enr":866,
 "note":"4-5年级 HiCap 片区点","p":950000,"pn":13,"pq1":859100,"pq3":1155000,"pa":""}
```

字段：`d` 学区，`n` 校名，`z` zip，`r`/`r25` 2026 和 2025 州排名（无则 `null`），`e`/`m` 阅读和数学达标率，`g` GreatSchools，`enr` 学生数，`note` 备注，`p` 房价中位数，`pn` 样本量，`pq1`/`pq3` 样本的 25% 和 75% 分位，`pa` 房价样本的说明（非空时显示 ≈）。`denom` 是各学段的全州分母，`updated` 是数据日期。

## 许可

代码 MIT。数据来自上述公开网站，版权归原网站所有，仅供个人参考。
