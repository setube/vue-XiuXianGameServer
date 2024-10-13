
import shop from './shop.js';

const user = {
    user: {
        id: 0,
        token: '',
        username: ''
    },
    // boss属性
    boss: {
        name: '',
        text: '',
        time: 0,
        desc: '',
        level: 0,
        dodge: 0,
        attack: 0,
        health: 0,
        conquer: false,
        defense: 0,
        critical: 0,
        maxhealth: 0
    },
    // 玩家属性
    player: {
        zc: false,
        age: 1,
        pet: {},
        time: 0,
        name: '玩家',
        dark: false,
        npcs: [],
        wife: {},
        pets: [],
        wifes: [],
        props: {
            money: 0,
            flying: 0,
            qingyuan: 0,
            rootBone: 0,
            currency: 0,
            cultivateDan: 0,
            strengtheningStone: 0
        },
        score: 0,
        level: 0,
        dodge: 0,
        points: 0,
        attack: 10,
        health: 100,
        critical: 0,
        defense: 10,
        taskNum: 0,
        version: 0.8,
        maxHealth: 100,
        inventory: [],
        isNewbie: false,
        shopData: shop.drawPrize(144),
        equipment: {
            sutra: {},
            armor: {},
            weapon: {},
            accessory: {}
        },
        achievement: {
            pet: [],
            monster: [],
            equipment: []
        },
        script: '',
        cultivation: 0,
        currentTitle: null,
        reincarnation: 0,
        maxCultivation: 100,
        backpackCapacity: 50,
        sellingEquipmentData: [],
        highestTowerFloor: 1,
        rewardedTowerFloors: [],
        nextGameTimes: {
            rps: null,
            dice: null,
            fortune: null,
            secretrealm: 0,
            gamblingStone: null
        },
        gameWins: 0,
        gameLosses: 0,
        checkinDays: 0,
        checkinStreak: 0,
        lastCheckinDate: null,
        fortuneTellingDate: null
    }
};

export default user;