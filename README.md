# mama-wo-dongxi-ne 后端 v2

多用户 · PostgreSQL · 习惯推荐

## 接口

| 方法 | 路径 | 说明 | 需要登录 |
|---|---|---|---|
| POST | /auth/register | 注册 | ✗ |
| POST | /auth/login | 登录 | ✗ |
| GET | /api/items | 获取物品列表（支持?q=搜索） | ✓ |
| POST | /api/items | 新增物品 | ✓ |
| PUT | /api/items/:id | 更新物品 | ✓ |
| DELETE | /api/items/:id | 删除物品 | ✓ |
| GET | /api/recommend | 习惯推荐（?category=证件&name=护照） | ✓ |
| POST | /api/speech-to-text | 语音转文字 | ✗ |
| POST | /api/vision-analyze | 图片识别 | ✗ |
| GET | /health | 健康检查 | ✗ |

## Railway 部署步骤
1. 在同一 Railway 项目里加一个 PostgreSQL 服务
2. Railway 会自动注入 DATABASE_URL 到后端服务
3. Variables 里填写：
   - OPENAI_API_KEY
   - JWT_SECRET（随机长字符串）
4. 部署后自动执行 migrate 建表

## 本地运行
```bash
npm install
cp .env.example .env   # 填入真实值
npm run migrate
npm start
```
