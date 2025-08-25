// 后端API地址
const API_URL = '127.0.0.1';

// 游戏角色数据（修正技能描述并补充效果参数）
const gameCharacters = [
    {
        "name": "兔女郎",
        "base_hp": 200,
        "base_physical_attack": 20,
        "base_physical_defense": 10,
        "physical_attack_growth": 3,
        "base_magical_attack": null,
        "magical_attack_growth": null,
        "base_magical_defense": 6,
        "skills": [
            {
                "name": "阴阳怪气",
                "description": "减少对方的物抗10%,持续3回合,且造成50点伤害(20+1.5*物攻)",
                "type": "physical",
                "damageFormula": (attacker) => 20 + attacker.current_physical_attack * 1.5,
                "debuff": { type: "physical_defense", value: -10, duration: 3 }
            },
            {
                "name": "臭屁蛋",
                "description": "放一个超级无敌大屁，对对方造成65点伤害(25+2*物攻)",
                "type": "physical",
                "damageFormula": (attacker) => 25 + attacker.current_physical_attack * 2
            },
            {
                "name": "猪头肉",
                "description": "增加10点生命上限(1*物抗)",
                "type": "buff",
                "buff": { type: "hp_max", value: (attacker) => attacker.current_physical_defense * 1 }
            }
        ]
    },
    {
        "name": "鼹鼠",
        "base_hp": 400,
        "base_physical_attack": 12,
        "base_physical_defense": 18,
        "physical_attack_growth": 1,
        "base_magical_attack": null,
        "magical_attack_growth": null,
        "base_magical_defense": 24,
        "skills": [
            {
                "name": "用力一推",
                "description": "对对方造成12点物理伤害(3%最大生命值)",
                "type": "physical",
                "damageFormula": (attacker, target) => Math.floor(target.base_hp * 0.03)
            },
            {
                "name": "皮糙肉厚",
                "description": "增加30%物抗和法抗",
                "type": "buff",
                "buff": {
                    type: "defense_multiplier",
                    value: 1.3,
                    duration: 2
                }
            },
            {
                "name": "蛮牛冲撞",
                "description": "对对方造成66(12+0.5*物攻+12%最大生命值)伤害",
                "type": "physical",
                "damageFormula": (attacker, target) => 12 + attacker.current_physical_attack * 0.5 + Math.floor(target.base_hp * 0.12)
            },
            {
                "name": "物攻提升",
                "description": "3回合内，增加物攻24点(6%最大生命值)",
                "type": "buff",
                "buff": {
                    type: "physical_attack",
                    value: (attacker) => 24 + Math.floor(attacker.base_hp * 0.06),
                    duration: 3
                }
            }
        ]
    },
    {
        "name": "考拉",
        "base_hp": 120,
        "base_physical_attack": 2,
        "base_physical_defense": 20,
        "physical_attack_growth": 0.5,
        "base_magical_attack": null,
        "magical_attack_growth": null,
        "base_magical_defense": 15,
        "skills": [
            {
                "name": "无想一拳",
                "description": "对对方造成30(26+2*物攻)点伤害",
                "type": "physical",
                "damageFormula": (attacker) => 26 + attacker.current_physical_attack * 2
            },
            {
                "name": "带个耳机",
                "description": "自己和队友增加300%的所有抗性，且无法被控制，持续2回合",
                "type": "team_buff",
                "buff": {
                    type: "defense_multiplier",
                    value: 4,
                    duration: 2
                }
            },
            {
                "name": "我吃桉树叶",
                "description": "自己无法行动，持续三回合，自己受到的伤害减少75%，自己队友受到的伤害减少50%,持续完成后，回复队友和自己20%的血量",
                "type": "special",
                "effect": {
                    selfDamageReduction: 0.75,
                    allyDamageReduction: 0.5,
                    duration: 3,
                    recoveryPercent: 0.2
                }
            }
        ]
    },
    {
        "name": "松鼠",
        "base_hp": 100,
        "base_physical_attack": 30,
        "base_physical_defense": 10,
        "physical_attack_growth": 6,
        "base_magical_attack": null,
        "magical_attack_growth": null,
        "base_magical_defense": 10,
        "skills": [
            {
                "name": "种树",
                "description": "减少1个松子，3回合后增加3个松子",
                "type": "resource",
                "cost": 1,
                "gainAfter": 3,
                "gainAmount": 3
            },
            {
                "name": "丢松子",
                "description": "开局自带3个松子。丢出1个松子，造成60(25+1.5*物攻)伤害",
                "type": "physical",
                "cost": 1,
                "damageFormula": (attacker) => 25 + attacker.current_physical_attack * 1.5
            },
            {
                "name": "马上丢出4个松子",
                "description": "对方每个人受到2个松子的伤害。造成46(10+1.2*物攻)伤害",
                "type": "aoe_physical",
                "cost": 4,
                "damagePerTarget": (attacker) => 10 + attacker.current_physical_attack * 1.2
            },
            {
                "name": "增产",
                "description": "每3回合，每一颗松子的倍率增加5%,最大叠加2次",
                "type": "passive_buff",
                "buff": { type: "pine_nut_multiplier", value: 0.05, maxStacks: 2, duration: 3 }
            }
        ],
        "resources": { pineNuts: 3 }
    },
    {
        "name": "肥波",
        "base_hp": 120,
        "base_physical_attack": 5,
        "base_physical_defense": 6,
        "physical_attack_growth": 0,
        "base_magical_attack": null,
        "magical_attack_growth": null,
        "base_magical_defense": 6,
        "skills": [
            {
                "name": "散发出臭味",
                "description": "持续2s,每0.2s对他人造成对方2%最大生命值的真实伤害",
                "type": "dot",
                "duration": 2,
                "interval": 0.2,
                "damagePerTick": (attacker, target) => Math.floor(target.base_hp * 0.02)
            },
            {
                "name": "回忆以前",
                "description": "进入蓄力状态，此状态持续2回合，每回合增加所有技能30%伤害",
                "type": "buff",
                "buff": { type: "damage_multiplier", value: 1.3, duration: 2 }
            },
            {
                "name": "挠头",
                "description": "减少自己1%生命值，增加自己5%的伤害，可自由选择减少多少生命",
                "type": "self_buff",
                "hpCostPercent": 0.01,
                "damageBoostPercent": 0.05
            },
            {
                "name": "爆发",
                "description": "可以在1或2技能后使用，对对方造成70(45+5*物理攻击)点伤害，减少自己30%的生命",
                "type": "physical",
                "damageFormula": (attacker) => 45 + attacker.current_physical_attack * 5,
                "selfHpCostPercent": 0.3
            }
        ]
    },
    {
        "name": "伪人",
        "base_hp": 180,
        "base_physical_attack": 10,
        "base_physical_defense": 18,
        "physical_attack_growth": 2,
        "base_magical_attack": 30,
        "magical_attack_growth": 8,
        "base_magical_defense": 20,
        "skills": [
            {
                "name": "学习",
                "description": "学习一个人的一个技能，但造成的伤害减少30%,并可以使用1回合。冷却1回合",
                "type": "copy_skill",
                "damageMultiplier": 0.7,
                "duration": 1,
                "cooldown": 1
            },
            {
                "name": "远程丢物",
                "description": "远程对对方丢一个物品,造成31(10+0.25*物攻+0.35*法攻+5%最大生命值)伤害",
                "type": "hybrid",
                "damageFormula": (attacker, target) => 10 + attacker.current_physical_attack * 0.25 + attacker.current_magical_attack * 0.35 + Math.floor(target.base_hp * 0.05)
            },
            {
                "name": "无他，但手熟尔",
                "description": "每一次学习，可以减少2.5%的伤害降低。若伤害降低全部减完，则可以增加伤害，最大增加20%",
                "type": "passive",
                "reductionPerUse": 0.025,
                "maxBoost": 0.2
            }
        ]
    },
    {
        "name": "鸡汪",
        "base_hp": 200,
        "base_physical_attack": null,
        "base_physical_defense": 16,
        "physical_attack_growth": null,
        "base_magical_attack": 25,
        "magical_attack_growth": 6,
        "base_magical_defense": 16,
        "skills": [
            {
                "name": "叫外号",
                "description": "叫别人他的外号，对他造成15(10+0.2*法攻)的伤害",
                "type": "magical",
                "damageFormula": (attacker) => 10 + attacker.current_magical_attack * 0.2
            },
            {
                "name": "手机启动",
                "description": "我要看了！为所有的技能增加20%伤害",
                "type": "buff",
                "buff": { type: "damage_multiplier", value: 1.2, duration: 3 }
            },
            {
                "name": "软件，启动！",
                "description": "对对方造成(3%对面最大生命值+1*法攻)伤害,并降低对面10%的双抗",
                "type": "magical",
                "damageFormula": (attacker, target) => Math.floor(target.base_hp * 0.03) + attacker.current_magical_attack * 1,
                "debuff": { type: "both_defense", value: -10, duration: 2 }
            },
            {
                "name": "虎毒不食子",
                "description": "接下来3回合，造成的所以伤害的15%,转换成自己和队友的的护盾，可以抵御90%伤害,但过一回合衰弱10%",
                "type": "team_buff",
                "buff": {
                    type: "shield_conversion",
                    conversionPercent: 0.15,
                    defensePercent: 0.9,
                    decayPerTurn: 0.1,
                    duration: 3
                }
            }
        ]
    },
    {
        "name": "土豆",
        "base_hp": 250,
        "base_physical_attack": 5,
        "base_physical_defense": 20,
        "physical_attack_growth": 2,
        "base_magical_attack": 30,
        "magical_attack_growth": 10,
        "base_magical_defense": 25,
        "skills": [
            {
                "name": "种土豆",
                "description": "减少1个土豆,2回合后增加2个土豆",
                "type": "resource",
                "cost": 1,
                "gainAfter": 2,
                "gainAmount": 2,
                "resources": { potatoes: 0 }
            },
            {
                "name": "吃土豆",
                "description": "给队友吃1个土豆，增加他21(10+0.25*物攻+0.2法攻)生命,治疗量的 30% 转化为可吸收80%真实伤害的护盾（持续 2 回合）",
                "type": "heal",
                "cost": 1,
                "healFormula": (attacker) => 10 + attacker.current_physical_attack * 0.25 + attacker.current_magical_attack * 0.2,
                "shieldConversion": 0.3,
                "shieldDefense": 0.8,
                "shieldDuration": 2
            },
            {
                "name": "双人连心",
                "description": "承担一个人30%受到的伤害，会承担他40%的治疗效果",
                "type": "link",
                "damageShare": 0.3,
                "healShare": 0.4
            },
            {
                "name": "大面积种植",
                "description": "每3个回合增加自己种土豆的收获数量。增加吃土豆的倍率,如增加65(10+110%物攻+110%法攻)血量,最大叠加3次",
                "type": "passive_buff",
                "buff": {
                    type: "potato_effect_multiplier",
                    value: (attacker) => 10 + attacker.current_physical_attack * 1.1 + attacker.current_magical_attack * 1.1,
                    maxStacks: 3,
                    duration: 3
                }
            }
        ]
    },
    {
        "name": "兵王",
        "base_hp": 250,
        "base_physical_attack": 40,
        "base_physical_defense": 30,
        "physical_attack_growth": 5,
        "base_magical_attack": null,
        "magical_attack_growth": null,
        "base_magical_defense": 16,
        "skills": [
            {
                "name": "普攻",
                "description": "造成32(0.8*物攻)伤害",
                "type": "physical",
                "damageFormula": (attacker) => attacker.current_physical_attack * 0.8
            },
            {
                "name": "记名字",
                "description": "为自己普攻增加20%伤害(2回合1次)，不可叠加",
                "type": "buff",
                "buff": { type: "attack_multiplier", value: 1.2, duration: 1, cooldown: 2 }
            },
            {
                "name": "站起来",
                "description": "为普攻增加30%伤害(3回合1次),不可叠加",
                "type": "buff",
                "buff": { type: "attack_multiplier", value: 1.3, duration: 1, cooldown: 3 }
            },
            {
                "name": "戒尺",
                "description": "增加20%的物理攻击,不可叠加",
                "type": "buff",
                "buff": { type: "physical_attack_multiplier", value: 1.2, duration: Infinity }
            }
        ]
    },
    {
        "name": "果粒登",
        "base_hp": 180,
        "base_physical_attack": null,
        "base_physical_defense": 15,
        "physical_attack_growth": null,
        "base_magical_attack": 30,
        "magical_attack_growth": 8,
        "base_magical_defense": 16,
        "skills": [
            {
                "name": "不知名题目",
                "description": "对对方造成45(1.5*法攻)点攻击，叠加一层眩晕效果",
                "type": "magical",
                "damageFormula": (attacker) => attacker.current_magical_attack * 1.5,
                "debuff": { type: "stun", stacks: 1, duration: 1 }
            },
            {
                "name": "不知名小公式",
                "description": "对对面造成30(1*法攻)的伤害，叠加2层眩晕效果",
                "type": "magical",
                "damageFormula": (attacker) => attacker.current_magical_attack * 1,
                "debuff": { type: "stun", stacks: 2, duration: 1 }
            },
            {
                "name": "我知道这道题",
                "description": "增加所有技能20%的伤害",
                "type": "buff",
                "buff": { type: "damage_multiplier", value: 1.2, duration: Infinity }
            },
            {
                "name": "学霸领域",
                "description": "所有攻击都会增加50%，对面每有一层眩晕效果，伤害+8%,对方双抗-5%",
                "type": "field_buff",
                "buff": {
                    type: "damage_multiplier",
                    baseValue: 1.5,
                    perStunDamageBoost: 0.08,
                    perStunDefenseReduction: -5,
                    duration: Infinity
                }
            }
        ]
    },
    {
        "name": "汪片",
        "base_hp": 210,
        "base_physical_attack": 25,
        "base_physical_defense": 20,
        "physical_attack_growth": 3,
        "base_magical_attack": null,
        "magical_attack_growth": null,
        "base_magical_defense": 10,
        "skills": [
            {
                "name": "撕咬",
                "description": "对对方造成63(2.5*物攻)点攻击",
                "type": "physical",
                "damageFormula": (attacker) => attacker.current_physical_attack * 2.5
            },
            {
                "name": "狂犬病",
                "description": "立刻增加自身200%的攻击，2回合后减少70%的生命",
                "type": "buff",
                "buff": { type: "physical_attack_multiplier", value: 3, duration: 2 },
                "delayedEffect": { type: "hp_loss", value: 0.7, delay: 2 }
            },
            {
                "name": "狂犬病疫苗",
                "description": "去除狂犬病的效果,但减少90%造成的攻击。并增加50点生命",
                "type": "purge_buff",
                "targetBuff": "狂犬病",
                "attackReduction": 0.9,
                "healAmount": 50
            },
            {
                "name": "还在争",
                "description": "死亡后对敌方全体造成50(2*物攻)点伤害",
                "type": "passive_aoe",
                "trigger": "death",
                "damageFormula": (attacker) => attacker.current_physical_attack * 2
            }
        ]
    },
    {
        "name": "老谭",
        "base_hp": 200,
        "base_physical_attack": 15,
        "base_physical_defense": 15,
        "physical_attack_growth": 2,
        "base_magical_attack": null,
        "magical_attack_growth": null,
        "base_magical_defense": 10,
        "skills": [
            {
                "name": "普攻",
                "description": "造成30（2*物攻)点伤害",
                "type": "physical",
                "damageFormula": (attacker) => attacker.current_physical_attack * 2
            },
            {
                "name": "强制收取",
                "description": "沉默敌方一回合，冷却时间两回合",
                "type": "debuff",
                "debuff": { type: "silence", duration: 1 },
                "cooldown": 2
            },
            {
                "name": "【警戒】",
                "description": "观察敌方，持续5回合，若敌方造成一次伤害，则叠加一层印记，上限10层，警戒结束后，根据印记层数对敌方造成(15*n+1.3*物攻)物理伤害",
                "type": "charge_attack",
                "duration": 5,
                "maxStacks": 10,
                "trigger": "enemy_damage",
                "finalDamageFormula": (attacker, stacks) => 15 * stacks + attacker.current_physical_attack * 1.3
            },
            {
                "name": "失去理智",
                "description": "失去40%血量瞬间失去理智，持续两回合，CD5回合，持续期间技能全部封印，有40%的减伤，普攻伤害+50%（对果粒登无效）",
                "type": "self_buff",
                "trigger": "hp_below_40%",
                "duration": 2,
                "cooldown": 5,
                "effect": {
                    skillSeal: true,
                    damageReduction: 0.4,
                    attackBoost: 0.5,
                    ineffectiveAgainst: "果粒登"
                }
            }
        ]
    },
    {
        "name": "毛毛",
        "base_hp": 230,
        "base_physical_attack": 20,
        "base_physical_defense": 21,
        "physical_attack_growth": 4,
        "base_magical_attack": 10,
        "magical_attack_growth": 1,
        "base_magical_defense": 12,
        "skills": [
            {
                "name": "手贱",
                "description": "摸一下别人，对他人造成30(0.5*物攻+2*法攻)的伤害",
                "type": "hybrid",
                "damageFormula": (attacker) => attacker.current_physical_attack * 0.5 + attacker.current_magical_attack * 2
            },
            {
                "name": "厚脸皮",
                "description": "当生命值小于30%的时候，获得3次40%的减伤，每局1次",
                "type": "passive",
                "trigger": "hp_below_30%",
                "maxUses": 3,
                "damageReduction": 0.4,
                "perBattle": true
            },
            {
                "name": "偷东西",
                "description": "叠加一层偷窃之遗,并且对对方造成(12*n+1*物攻+2*法攻)，可是每一次释放技能有5%*n的概率减少30%的生命值并且无法行动2回合",
                "type": "hybrid",
                "stackType": "steal_marks",
                "damageFormula": (attacker, stacks) => 12 * stacks + attacker.current_physical_attack * 1 + attacker.current_magical_attack * 2,
                "risk": {
                    probability: (stacks) => 0.05 * stacks,
                    effect: { type: "hp_loss", value: 0.3, stun: 2 }
                }
            }
        ]
    },
    {
        "name": "龙少",
        "base_hp": 240,
        "base_physical_attack": 30,
        "base_physical_defense": 21,
        "physical_attack_growth": 5,
        "base_magical_attack": 10,
        "magical_attack_growth": 1,
        "base_magical_defense": 12,
        "skills": [
            {
                "name": "smoke",
                "description": "可以选择每消耗n%的血量，提高技能3n%的伤害",
                "type": "self_buff",
                "hpCostPercentPerN": 0.01,
                "damageBoostPercentPerN": 0.03
            },
            {
                "name": "篮球",
                "description": "丢出一个打了两年半的篮球，造成45(1.5*物攻)伤害",
                "type": "physical",
                "damageFormula": (attacker) => attacker.current_physical_attack * 1.5
            },
            {
                "name": "3分",
                "description": "立刻增加25%的物攻，并且可以免疫1次伤害",
                "type": "buff",
                "buff": {
                    type: "physical_attack_multiplier",
                    value: 1.25,
                    duration: Infinity
                },
                "shield": { type: "damage_immunity", uses: 1 }
            }
        ]
    },
    {
        "name": "外星人",
        "base_hp": 150,
        "base_physical_attack": 8,
        "base_physical_defense": 12,
        "physical_attack_growth": 0,
        "base_magical_attack": 40,
        "magical_attack_growth": 15,
        "base_magical_defense": 15,
        "skills": [
            {
                "name": "鼻屎陨石",
                "description": "对敌方全体造成 20 (0.5 * 法攻)+3% 最大生命伤害",
                "type": "aoe_magical",
                "damageFormula": (attacker, target) => 20 + attacker.current_magical_attack * 0.5 + Math.floor(target.base_hp * 0.03)
            },
            {
                "name": "UFO",
                "description": "清除对方1个人50%的增益效果，增加他20%的生命",
                "type": "purge_buff",
                "purgePercent": 0.5,
                "healPercent": 0.2
            },
            {
                "name": "牙套锁定",
                "description": "锁定一名敌人，使其无法释放技能， 持续 1 回合，CD5回合",
                "type": "debuff",
                "debuff": { type: "silence", duration: 1 },
                "cooldown": 5
            },
            {
                "name": "鼻屎坍缩",
                "description": "生成鼻屎黑洞， 每回合造成 5% 最大生命真实伤害，持续 3 回合 （期间己方攻击黑洞目标增伤 20%),CD6回合",
                "type": "dot_field",
                "duration": 3,
                "cooldown": 6,
                "damagePerTurn": (target) => Math.floor(target.base_hp * 0.05),
                "allyDamageBoost": 0.2
            }
        ]
    },
    {
        "name": "小J人",
        "base_hp": 180,
        "base_physical_attack": null,
        "base_physical_defense": 20,
        "physical_attack_growth": null,
        "base_magical_attack": 25,
        "magical_attack_growth": 8,
        "base_magical_defense": 20,
        "skills": [
            {
                "name": "你好J啊",
                "description": "造成25(1*法攻)的伤害",
                "type": "magical",
                "damageFormula": (attacker) => attacker.current_magical_attack * 1
            },
            {
                "name": "拍案而起",
                "description": "立刻增加所有技能20%伤害",
                "type": "buff",
                "buff": { type: "damage_multiplier", value: 1.2, duration: Infinity }
            },
            {
                "name": "臭水预备",
                "description": "开始预备制造臭水，之后队友或队友每造成一次法攻叠加一层臭气，可是有5%*n的概率被发现，立刻减少60%生命,有10%*n的概率泄露，对对方和自己造成10*n的伤害",
                "type": "charge",
                "stackType": "stink",
                "trigger": "ally_magical_attack",
                "risk": {
                    discoveryProb: (stacks) => 0.05 * stacks,
                    discoveryEffect: { type: "hp_loss", value: 0.6 },
                    leakProb: (stacks) => 0.1 * stacks,
                    leakDamage: (stacks) => 10 * stacks
                }
            },
            {
                "name": "臭水核弹",
                "description": "自己发射或者自己或队友死亡，立刻发射臭水核弹，造成(15*n+200%法攻)的伤害",
                "type": "magical",
                "trigger": "manual_or_death",
                "damageFormula": (attacker, stacks) => 15 * stacks + attacker.current_magical_attack * 2
            }
        ]
    },
    {
        "name": "精神小太妹",
        "base_hp": 160,
        "base_physical_attack": null,
        "base_physical_defense": 15,
        "physical_attack_growth": null,
        "base_magical_attack": 25,
        "magical_attack_growth": 7,
        "base_magical_defense": 15,
        "skills": [
            {
                "name": "变化无常",
                "description": "每回合开始时随机获得 “愤怒”“冷静”“兴奋” 状态,愤怒：队友物攻 + 10%,冷静：队友双抗 + 15%,兴奋：队友法攻 + 10%，回合末清除效果",
                "type": "team_buff",
                "trigger": "turn_start",
                "buffTypes": [
                    { name: "愤怒", type: "physical_attack_multiplier", value: 1.1, duration: 1 },
                    { name: "冷静", type: "defense_multiplier", value: 1.15, duration: 1 },
                    { name: "兴奋", type: "magical_attack_multiplier", value: 1.1, duration: 1 }
                ],
                "random": true
            },
            {
                "name": "带个手机",
                "description": "对敌方造成 25 (1 * 法攻) 伤害，若处于 “愤怒” 状态，附加 1 回合眩晕；“冷静” 状态则降低目标 10% 攻击。",
                "type": "magical",
                "damageFormula": (attacker) => 25 + attacker.current_magical_attack * 1,
                "stateEffects": {
                    "愤怒": { debuff: { type: "stun", duration: 1 } },
                    "冷静": { debuff: { type: "attack_reduction", value: 0.1, duration: 1 } }
                }
            },
            {
                "name": "无脑共情",
                "description": "链接一名队友，共享情绪状态，该队友获得双倍 buff 效果，持续 2 回合。",
                "type": "link_buff",
                "duration": 2,
                "buffMultiplier": 2
            },
            {
                "name": "召唤精神小伙",
                "description": "召唤物持续2回合，每一个精神小伙一回合造成(0.25*物攻+0.5*法攻),如处于愤怒状态，伤害+5%",
                "type": "summon",
                "duration": 2,
                "summonDamage": (attacker) => attacker.current_physical_attack * 0.25 + attacker.current_magical_attack * 0.5,
                "stateBonus": { "愤怒": { damageMultiplier: 1.05 } }
            }
        ]
    },
    {
        "name": "蛋仔",
        "base_hp": 200,
        "base_physical_attack": 20,
        "base_physical_defense": 25,
        "physical_attack_growth": 6,
        "base_magical_attack": 25,
        "magical_attack_growth": 10,
        "base_magical_defense": 8,
        "skills": [
            {
                "name": "蛋仔滚动!!",
                "description": "开启滚动，可以下一回合使用2次自己的技能",
                "type": "buff",
                "buff": { type: "extra_skill_use", value: 1, duration: 1 }
            },
            {
                "name": "跳扑",
                "description": "对对方造成43(1.5*物攻+0.5*法攻)的伤害",
                "type": "hybrid",
                "damageFormula": (attacker) => attacker.current_physical_attack * 1.5 + attacker.current_magical_attack * 0.5
            },
            {
                "name": "巨大化",
                "description": "立刻变大，提高50%全能属性，持续2回合，CD7回合",
                "type": "buff",
                "buff": { type: "all_stats_multiplier", value: 1.5, duration: 2 },
                "cooldown": 7
            },
            {
                "name": "咸鱼双刀",
                "description": "对对方造成65(2*物攻+1*法攻)伤害",
                "type": "hybrid",
                "damageFormula": (attacker) => attacker.current_physical_attack * 2 + attacker.current_magical_attack * 1
            }
        ]
    },
    {
        "name": "主播",
        "base_hp": 180,
        "base_physical_attack": 5,
        "base_physical_defense": 10,
        "physical_attack_growth": 1,
        "base_magical_attack": 25,
        "magical_attack_growth": 10,
        "base_magical_defense": 18,
        "skills": [
            {
                "name": "火了!",
                "description": "根据队友存活百分比*8为红度，每有一层红度全队伤害+5%，不可叠加，每回合清除",
                "type": "team_buff",
                "buff": {
                    type: "damage_multiplier",
                    value: (allyCount, totalAlly) => 1 + (allyCount / totalAlly * 8) * 0.05,
                    duration: 1,
                    perTurnClear: true
                }
            },
            {
                "name": "造谣",
                "description": "消耗 3 层热度，对敌方单体造成 50 (2 * 法攻)+ 当前热度 ×10 真实伤害",
                "type": "magical_true",
                "cost": 3,
                "damageFormula": (attacker, heat) => 50 + attacker.current_magical_attack * 2 + heat * 10,
                "resource": "heat"
            },
            {
                "name": "收割",
                "description": "当敌方减员时，立即获得 3 层热度",
                "type": "passive_resource",
                "trigger": "enemy_death",
                "gainAmount": 3,
                "resource": "heat"
            },
            {
                "name": "共享",
                "description": "共享自己20%生命上限和100%物法抗,50%治疗给队友",
                "type": "team_buff",
                "buff": {
                    lifeSharePercent: 0.2,
                    defenseSharePercent: 1,
                    healSharePercent: 0.5,
                    duration: Infinity
                }
            }
        ]
    },
    {
        "name": "芒果",
        "base_hp": 220,
        "base_physical_attack": 30,
        "base_physical_defense": 40,
        "physical_attack_growth": 2,
        "base_magical_attack": 30,
        "magical_attack_growth": 15,
        "base_magical_defense": 5,
        "skills": [
            {
                "name": "狡辩",
                "description": "免疫一次控制，可是下一回合会减少10%生命",
                "type": "buff",
                "buff": { type: "control_immunity", uses: 1 },
                "delayedEffect": { type: "hp_loss", value: 0.1, delay: 1 }
            },
            {
                "name": "糖分",
                "description": "对对方造成60(2*法攻)的伤害",
                "type": "magical",
                "damageFormula": (attacker) => attacker.current_magical_attack * 2
            },
            {
                "name": "摸摸屁股",
                "description": "对对方造成70(1*物攻+1*法攻)伤害",
                "type": "hybrid",
                "damageFormula": (attacker) => attacker.current_physical_attack * 1 + attacker.current_magical_attack * 1
            },
            {
                "name": "传奇摔王",
                "description": "把对面连摔3次，每摔1次造成44(1.1*(物攻+0.1*n))伤害,最后减少自己40%血量，减少对面20%血量,n为摔的次数",
                "type": "physical_chain",
                "hitCount": 3,
                "damagePerHit": (attacker, n) => 1.1 * (attacker.current_physical_attack + 0.1 * n),
                "finalSelfHpLoss": 0.4,
                "finalTargetHpLoss": 0.2
            }
        ]
    },
    {
        "name": "小跳跳",
        "base_hp": 190,
        "base_physical_attack": null,
        "base_physical_defense": 20,
        "physical_attack_growth": null,
        "base_magical_attack": 40,
        "magical_attack_growth": 12,
        "base_magical_defense": 12,
        "skills": [
            {
                "name": "自由选择形态",
                "description": "1.信息优势:每回合+1%双抗和1法攻,伤害*(60%-150%) 2.警戒考试:每回合-0.5%双抗和当前生命值,+1%技能伤害,伤害*(110%-200%)",
                "type": "form_switch",
                "forms": [
                    {
                        name: "信息优势",
                        perTurnBuff: {
                            defenseMultiplier: 0.01,
                            magicalAttack: 1
                        },
                        damageRange: [0.6, 1.5]
                    },
                    {
                        name: "警戒考试",
                        perTurnEffect: {
                            defenseMultiplier: -0.005,
                            hpLossPercent: 0.005,
                            damageMultiplier: 0.01
                        },
                        damageRange: [1.1, 2]
                    }
                ]
            },
            {
                "name": "理科专精",
                "description": "增加20%法术攻击，减免20%对方法术攻击。增加20%收到的物理攻击。",
                "type": "passive",
                "magicalAttackBoost": 0.2,
                "enemyMagicalReduction": 0.2,
                "physicalDamageTakenBoost": 0.2
            },
            {
                "name": "公式记录",
                "description": "对敌方全体造成60(1.5*法攻)伤害,3回合内可回溯,再次造成40(10+0.75*法攻)伤害。CD4回合",
                "type": "aoe_magical",
                "initialDamage": (attacker) => 60 + attacker.current_magical_attack * 1.5,
                "backtrackDamage": (attacker) => 10 + attacker.current_magical_attack * 0.75,
                "backtrackDelay": 3,
                "cooldown": 4
            },
            {
                "name": "失去理智",
                "description": "把120%的法攻转换为物攻(持续1回合)减少10%的生命，丢出1个水壶，立刻造成92(10+1.25*物攻)伤害",
                "type": "physical",
                "buff": {
                    type: "attack_conversion",
                    magicalToPhysical: 1.2,
                    duration: 1
                },
                "hpCostPercent": 0.1,
                "damageFormula": (attacker) => 10 + attacker.current_physical_attack * 1.25
            }
        ]
    }
];

// 工具函数 - 显示消息
function showMessage(element, text, isError = true) {
    element.textContent = text;
    element.classList.remove('hidden');
    element.className = isError ? 'text-danger text-center py-2' : 'text-success text-center py-2';
}

// 验证登录状态
async function checkLoginStatus() {
    const token = localStorage.getItem('token');
    if (!token) {
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        return response.ok;
    } catch (error) {
        console.error('验证登录状态失败:', error);
        return false;
    }
}