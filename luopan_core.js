/**
 * 时空罗盘 · 核心算法（Node 与浏览器双兼容）
 * 功能：度数 ↔ 二十四山/十二地支/十天干/八卦 映射；八宅游年吉凶方位；玄空年飞星
 */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) module.exports = factory();
  else root.LuoPanCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // 二十四山（每山 15°，子=0° 起，顺时针）
  // 子癸丑艮寅甲卯乙辰巽巳丙午丁未坤申庚酉辛戌乾亥壬
  const SHAN24 = ["子","癸","丑","艮","寅","甲","卯","乙","辰","巽","巳","丙",
                  "午","丁","未","坤","申","庚","酉","辛","戌","乾","亥","壬"];

  // 后天八卦方位（度数为宫位中心）
  const BAGUA = [
    { name: "坎", deg: 0 }, { name: "艮", deg: 45 }, { name: "震", deg: 90 },
    { name: "巽", deg: 135 }, { name: "离", deg: 180 }, { name: "坤", deg: 225 },
    { name: "兑", deg: 270 }, { name: "乾", deg: 315 },
  ];

  // 天干方位（后天方位；戊己居中）
  const GAN = [
    { name: "壬", deg: 345 }, { name: "癸", deg: 15 }, { name: "甲", deg: 75 },
    { name: "乙", deg: 105 }, { name: "丙", deg: 165 }, { name: "丁", deg: 195 },
    { name: "庚", deg: 255 }, { name: "辛", deg: 285 },
  ];

  const ZHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"]; // 每 30°

  /** 度数归一化 0-360 */
  function norm(deg) { return ((deg % 360) + 360) % 360; }

  /** 度数 → 二十四山（返回索引 0-23） */
  function degToShanIndex(deg) { return Math.floor((norm(deg) + 7.5) / 15) % 24; }
  function degToShan(deg) { return SHAN24[degToShanIndex(deg)]; }

  /** 度数 → 十二地支 */
  function degToZhi(deg) { return ZHI[Math.floor((norm(deg) + 15) / 30) % 12]; }

  /** 度数 → 后天八卦 */
  function degToBagua(deg) {
    let best = BAGUA[0];
    for (const b of BAGUA) {
      const d = Math.abs(norm(deg) - b.deg);
      if (Math.min(d, 360 - d) < Math.min(Math.abs(norm(deg) - best.deg), 360 - Math.abs(norm(deg) - best.deg))) best = b;
    }
    return best.name;
  }

  /** 度数 → 天干（八干，戊己居中） */
  function degToGan(deg) {
    let best = GAN[0];
    for (const g of GAN) {
      const d = Math.abs(norm(deg) - g.deg);
      if (Math.min(d, 360 - d) < Math.min(Math.abs(norm(deg) - best.deg), 360 - Math.abs(norm(deg) - best.deg))) best = g;
    }
    return best.name;
  }

  /** 朝向 → 坐向名：朝 0°（北/子）→ 坐午山向子 → "午山子向" */
  function facingToZuoxiang(facingDeg) {
    const facing = degToShan(facingDeg);
    const zuo = degToShan(facingDeg + 180);
    return zuo + "山" + facing + "向";
  }

  /** 方位中文名 */
  function degToDirName(deg) {
    const d = norm(deg);
    if (d < 22.5 || d >= 337.5) return "北";
    if (d < 67.5) return "东北";
    if (d < 112.5) return "东";
    if (d < 157.5) return "东南";
    if (d < 202.5) return "南";
    if (d < 247.5) return "西南";
    if (d < 292.5) return "西";
    return "西北";
  }

  // 八宅游年（每命卦 8 方位吉凶；方位以八卦宫位计）
  // 吉凶等级：0生气(大吉) 1天医(次吉) 2延年(吉) 3伏位(平) 4六煞(凶) 5五鬼(凶) 6祸害(凶) 7绝命(大凶)
  const YOU_NIAN = {
    乾: { 乾: 3, 坎: 4, 艮: 1, 震: 5, 巽: 6, 离: 7, 坤: 2, 兑: 0 }, // 乾六天五祸绝延生
    坎: { 坎: 3, 艮: 5, 震: 1, 巽: 0, 离: 2, 坤: 7, 兑: 6, 乾: 4 }, // 坎五天生延绝祸六
    艮: { 艮: 3, 震: 4, 巽: 7, 离: 6, 坤: 0, 兑: 2, 乾: 1, 坎: 5 }, // 艮六绝祸生延天五
    震: { 震: 3, 巽: 2, 离: 0, 坤: 6, 兑: 7, 乾: 5, 坎: 1, 艮: 4 }, // 震延生祸绝五天六
    巽: { 巽: 3, 离: 1, 坤: 5, 兑: 4, 乾: 6, 坎: 0, 艮: 7, 震: 2 }, // 巽天五六祸生绝延
    离: { 离: 3, 坤: 4, 兑: 5, 乾: 7, 坎: 2, 艮: 6, 震: 0, 巽: 1 }, // 离六五绝延祸生天
    坤: { 坤: 3, 兑: 1, 乾: 2, 坎: 7, 艮: 0, 震: 6, 巽: 5, 离: 4 }, // 坤天延绝生祸五六
    兑: { 兑: 3, 乾: 0, 坎: 6, 艮: 2, 震: 7, 巽: 4, 离: 5, 坤: 1 }, // 兑生祸延绝六五天
  };
  const YOU_NIAN_NAME = ["生气","天医","延年","伏位","六煞","五鬼","祸害","绝命"];
  const YOU_NIAN_COLOR = ["#2ecc71","#1abc9c","#3498db","#95a5a6","#e67e22","#9b59b6","#a0522d","#e74c3c"];

  /** 命卦（后天八卦名）→ 吉凶方位表：[{bagua, deg, star, name, color}] */
  function younianTable(mingGua) {
    const t = YOU_NIAN[mingGua];
    if (!t) return null;
    return BAGUA.map(b => {
      const star = t[b.name];
      return { bagua: b.name, deg: b.deg, star, name: YOU_NIAN_NAME[star], color: YOU_NIAN_COLOR[star] };
    });
  }

  // 洛书方位（宫数 → 方位名）
  const LUOSHU_DIR = { 1: "北", 2: "西南", 3: "东", 4: "东南", 5: "中", 6: "西北", 7: "西", 8: "东北", 9: "南" };
  const DIR_DEG = { "北": 0, "东北": 45, "东": 90, "东南": 135, "南": 180, "西南": 225, "西": 270, "西北": 315 };
  // 顺飞路线（洛书宫位顺序：中乾兑艮离坎坤震巽）
  const FLY_PATH = [5, 6, 7, 8, 9, 1, 2, 3, 4];
  const STAR_NAME = { 1: "一白贪狼", 2: "二黑巨门", 3: "三碧禄存", 4: "四绿文曲",
                      5: "五黄廉贞", 6: "六白武曲", 7: "七赤破军", 8: "八白左辅", 9: "九紫右弼" };

  /** 年飞星入中星（验证：2024→5 五黄、2026→3 三碧） */
  function yearCenterStar(year) { return ((9 - ((year - 4) % 9 + 9) % 9) % 9) || 9; }

  /** 年飞星全盘：返回 {宫数: {star, name, dir, deg}} */
  function annualFlyingStars(year) {
    const center = yearCenterStar(year);
    const out = {};
    FLY_PATH.forEach((palace, i) => {
      const star = ((center - 1 + i) % 9) + 1;
      out[palace] = { star, name: STAR_NAME[star], dir: LUOSHU_DIR[palace], deg: DIR_DEG[LUOSHU_DIR[palace]] };
    });
    return out;
  }

  /** 飞星要点（供高亮）：{五黄:{dir,deg}, 二黑:{}, 八白:{}, 四绿:{}} */
  function flyingHighlights(year) {
    const fs = annualFlyingStars(year);
    const pick = (star) => {
      for (const k in fs) if (fs[k].star === star) return { dir: fs[k].dir, deg: fs[k].deg };
      return null;
    };
    return { wu_huang: pick(5), er_hei: pick(2), ba_bai: pick(8), si_lv: pick(4) };
  }

  return {
    SHAN24, BAGUA, GAN, ZHI,
    norm, degToShan, degToShanIndex, degToZhi, degToBagua, degToGan,
    facingToZuoxiang, degToDirName,
    younianTable, YOU_NIAN_NAME, YOU_NIAN_COLOR,
    yearCenterStar, annualFlyingStars, flyingHighlights, STAR_NAME,
  };
});
