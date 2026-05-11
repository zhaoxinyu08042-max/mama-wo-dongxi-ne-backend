# Node.js / Express 代理后端

提供两个接口：
- POST /api/speech-to-text
- POST /api/vision-analyze

## 本地运行
1. `npm install`
2. `cp .env.example .env`
3. 填入 `OPENAI_API_KEY`
4. `npm start`

## 接口返回格式

### POST /api/speech-to-text
```json
{ "text": "护照放在书房抽屉" }
```

### POST /api/vision-analyze
```json
{
  "object_name": "护照",
  "caption": "检测到抽屉中的深色证件本",
  "suggested_location": "书房抽屉或证件收纳盒"
}
```

## 部署到 Railway
1. 在 Railway 新建项目 → Deploy from GitHub Repo
2. 选择此仓库
3. Variables 里添加 `OPENAI_API_KEY`
4. Settings → Networking → Generate Domain
5. 把前端 `API_BASE` 改成生成的 Railway 域名 + `/api`
