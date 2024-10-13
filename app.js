import fs from 'fs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import shop from './models/shop.js';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import express from 'express';
import usermeta from './models/User.js';
import inquirer from 'inquirer';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';

const envFilePath = path.resolve(process.cwd(), '.env');
const lockFilePath = path.resolve(process.cwd(), '.lock');

// 创建.env配置文件
const createEnvFile = () => {
    console.log('配置文件不存在, 开始创建');
    const questions = [
        {
            type: 'input',
            name: 'HOST_PORT',
            message: '请输入服务端端口号:',
            default: 5000,
        },
        {
            type: 'input',
            name: 'DB_HOST',
            message: '请输入数据库主机地址:',
            default: 'localhost',
        },
        {
            type: 'input',
            name: 'DB_PORT',
            message: '请输入数据库端口号:',
            default: 27017,
        },
        {
            type: 'input',
            name: 'DB_DATABASE',
            message: '请输入数据库名:',
            default: 'xiuxian',
        },
        {
            type: 'input',
            name: 'JWT_SECRET',
            message: '请输入JWT密钥:',
            default: () => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?';
                let result = '';
                for (let i = 0; i < 16; i++) {
                    const randomIndex = Math.floor(Math.random() * chars.length);
                    result += chars.charAt(randomIndex);
                }
                return result;
            }
        }
    ];
    return new Promise((resolve, reject) => {
        inquirer.prompt(questions).then((answers) => {
            const envContent = Object.entries(answers).map(([key, value]) => `${key}=${value}`).join('\n');
            fs.writeFileSync(envFilePath, envContent);
            console.log('配置文件创建成功');
            resolve();
        }).catch(err => {
            console.error('创建配置文件时出错:', err);
            reject(err);
        });
    });
};

// 连接MongoDB数据库并初始化
const connectToMongo = async () => {
    // 重新加载新生成的环境变量
    dotenv.config();
    const { DB_HOST, DB_PORT, DB_DATABASE } = process.env;
    const client = new MongoClient(`mongodb://${DB_HOST}:${DB_PORT}`);
    try {
        await client.connect();
        const db = client.db(DB_DATABASE);
        console.log(`已连接数据库：${DB_DATABASE}`);
        // 创建数据表
        await db.createCollection('users');
        await db.createCollection('options');
        await db.createCollection('usersmeta');
        console.log('数据库初始化完成');
    } catch (err) {
        console.error('连接数据库失败：', err);
        process.exit(1);
    } finally {
        await client.close();
    }
};

// 启动后端服务器
const startServer = () => {
    // 重新加载新生成的环境变量
    dotenv.config();
    const { HOST_PORT, DB_HOST, DB_PORT, DB_DATABASE, JWT_SECRET } = process.env;
    const client = new MongoClient(`mongodb://${DB_HOST}:${DB_PORT}`);
    const db = client.db(DB_DATABASE);
    const app = express();

    app.use(cors());
    app.use(bodyParser.json());

    // 验证JWT
    const authenticateJWT = (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            jwt.verify(token, JWT_SECRET, (err, user) => {
                if (err) return res.sendStatus(403);
                req.user = user;
                next();
            });
        } else {
            res.sendStatus(401);
        }
    };

    // 注册接口
    app.post('/register', async (req, res) => {
        const { username, password } = req.body;
        if (!username || !password) return res.status(502).json({ message: '账号和密码不能为空' });
        const usersCollection = db.collection('users');
        // 检查用户是否已存在
        const existingUser = await usersCollection.findOne({ username });
        if (existingUser) return res.status(502).json({ message: '账号已存在' });
        // 哈希密码
        const hashedPassword = await bcrypt.hash(password, 10);
        // 创建新用户
        const newUser = { username, password: hashedPassword };
        await usersCollection.insertOne(newUser);
        // 查询用户
        const openUser = await usersCollection.findOne({ username });
        // 创建用户元数据
        const usersMetaCollection = db.collection('usersmeta');
        const user_id = openUser._id;
        const { boss, player } = usermeta;
        const newUserMeta = {
            [user_id]: {
                user: {
                    id: user_id,
                    token: jwt.sign({ user_id }, JWT_SECRET),
                    username: openUser.username
                },
                boss,
                player
            }
        };
        await usersMetaCollection.insertOne(newUserMeta);
        res.status(201).json({ message: '注册成功', usermeta: newUserMeta[user_id] });
    });

    // 用户登录
    app.post('/login', async (req, res) => {
        const { username, password } = req.body;
        if (!username || !password) return res.status(502).json({ message: '账号和密码不能为空' });
        // 查找用户
        const usersCollection = db.collection('users');
        const userinfo = await usersCollection.findOne({ username });
        if (!userinfo) return res.status(502).json({ message: '账号不存在' });
        // 验证密码
        const isMatch = await bcrypt.compare(password, userinfo.password);
        if (!isMatch) return res.status(502).json({ message: '密码错误' });
        // 输出用户数据
        const usersMetaCollection = db.collection('usersmeta');
        const user = await usersMetaCollection.findOne({ [userinfo._id]: { $exists: true } });
        res.json({ message: '登录成功', usermeta: user[userinfo._id] });
    });

    // 获取玩家数据
    app.post('/getData', authenticateJWT, async (req, res) => {
        const { user_id } = req.body;
        // 查找用户
        const usersCollection = db.collection('usersmeta');
        const userinfo = await usersCollection.findOne({ [user_id]: { $exists: true } });
        if (!userinfo) return res.status(502).json({ message: '账号不存在' });
        res.status(200).json({ message: '数据获取成功', usermeta: userinfo[user_id] });
    });

    // 刷新鸿蒙商店
    app.post('/refreshShop', authenticateJWT, async (req, res) => {
        const { user_id } = req.body;
        // 查找用户
        const usersCollection = db.collection('usersmeta');
        const userinfo = await usersCollection.findOne({ [user_id]: { $exists: true } });
        if (!userinfo) return res.status(502).json({ message: '账号不存在' });
        const { player } = userinfo[user_id];
        if (player.props.money < 500) return res.status(502).json({ message: '灵石不足, 刷新商店需要500灵石' });
        // // 扣除灵石
        player.props.money -= 500;
        // 更新鸿蒙商店数据
        player.shopData = shop.drawPrize(144);
        // 更新用户数据
        await usersCollection.updateOne(
            { [user_id]: { $exists: true } },
            { $set: { [`${user_id}.player`]: player } }
        );
        res.status(200).json({ message: '刷新成功', data: player.shopData });
    });

    // 更新玩家数据
    app.post('/updateData', authenticateJWT, async (req, res) => {
        const { user, player, boss } = req.body;
        // 查找用户
        const usersCollection = db.collection('usersmeta');
        const userinfo = await usersCollection.findOne({ [user.id]: { $exists: true } });
        if (!userinfo) return res.status(502).json({ message: '账号不存在' });
        // 更新用户数据
        const updateResult = await usersCollection.updateOne(
            { [user.id]: { $exists: true } },
            {
                $set: {
                    [`${user.id}.player`]: player,
                    [`${user.id}.boss`]: boss
                }
            }
        );
        if (userinfo.player === player && userinfo.boss === boss) return res.status(200).json({ message: '数据无变化, 无需更改' });
        if (updateResult.modifiedCount === 0) return res.status(502).json({ message: '数据同步失败' });
        res.status(200).json({ message: '数据已同步' });
    });

    // 获取必应每日图片
    app.get('/bgImg', async (req, res) => {
        // 必应图片获取失败
        const bgImgError = () => {
            // 访问默认API获取验证码封面
            axios.get('https://picsum.photos/1920/1080', { responseType: 'arraybuffer' }).then(res => {
                return res.data;
            }).catch(err => {
                // 访问本地默认验证码封面
                const imagePath = path.join(path.resolve(), 'assets', 'bg.png');
                fs.readFile(imagePath, (err, data) => {
                    res.writeHead(200, { 'Content-Type': 'image/png' });
                    res.end(data);
                });
            });
        };
        try {
            const response = await axios.get('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=10&mkt=zh-CN');
            const { data } = response;
            if (data && data.images && data.images.length) {
                const url = data.images[0].url;
                const imageUrl = `https://www.bing.com${url}`;
                const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                res.set('Content-Type', 'image/jpeg')
                res.status(200).send(imageResponse.data);
            } else {
                res.set('Content-Type', 'image/jpeg');
                res.status(200).send(bgImgError());
            }
        } catch (error) {
            res.set('Content-Type', 'image/jpeg');
            res.status(200).send(bgImgError());
        }
    });

    app.listen(HOST_PORT, () => {
        console.log(`后端服务器已启动，访问地址：http://localhost:${HOST_PORT}`);
    });
};

// 初始化
const main = async () => {
    // 检查配置文件是否存在, 如果不存在就创建配置文件
    if (!fs.existsSync(envFilePath)) await createEnvFile();

    // 连接并初始化MongoDB数据库
    await connectToMongo();

    // 检查并创建.lock锁定文件，防止重复初始化
    if (!fs.existsSync(lockFilePath)) {
        fs.writeFileSync(lockFilePath, 'lock');
        console.log('锁定文件已创建');
    }
    // 启动后端服务器
    startServer();
};

main();
