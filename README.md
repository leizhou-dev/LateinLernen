# Latein lernen（PWA）

帮助孩子学习拉丁语第 1–11 课的 iPad 网页 App：词汇训练、5 次间隔复习、词形练习和语法速查。
可以离线使用，托管在 GitHub Pages 上，词库加密存放。

## 目录结构

```
IOS App/Latein lernen/
├── Resources/                      ← 课本照片和明文词库（不进仓库）
│   └── latein_lektionen_1-11.json
└── app/                            ← 本项目 = Git 仓库
    ├── public/vocab.enc.json       ← 加密后的词库（运行 npm run encrypt 生成，要提交）
    ├── scripts/encrypt-vocab.mjs   ← 加密脚本
    ├── src/lib/                    ← 逻辑：词形、重音、判分、间隔复习、加密
    ├── src/ui/                     ← 界面（德语）
    └── tests/                      ← 单元测试
```

## 第一次发布

需要 Node.js 22 或更高版本（`brew install node`）。

```bash
cd "~/Documents/IOS App/Latein lernen/app"
npm install
npm run encrypt          # 设定家庭密码（至少 6 位），生成 public/vocab.enc.json
npm test                 # 应该显示 24 passed
npm run dev              # 本地预览：http://localhost:5173
```

上传到 GitHub（先在 GitHub 网站上新建一个**空的公开仓库**，例如 `latein-lernen`）：

```bash
git init -b main
git add .
git commit -m "Latein lernen: erste Version"
git remote add origin https://github.com/<用户名>/latein-lernen.git
git push -u origin main
```

在 GitHub 仓库里打开 **Settings → Pages → Build and deployment → Source: GitHub Actions**。
之后每次 `git push` 都会自动构建和部署，地址是 `https://<用户名>.github.io/latein-lernen/`。

> 构建流程会检查仓库里有没有明文词库。万一不小心提交了明文词库，部署会直接失败。

## 安装到 iPad

1. 在 iPad 上用 **Safari** 打开上面的网址。
2. 点 **分享 → 添加到主屏幕**。
3. **从主屏幕图标**打开 App，输入一次家庭密码，以后不用再输。

注意：在 Safari 里直接练习的进度不会带到主屏幕 App 里，所以要先装好，再从主屏幕开始用。

## 更新

- **改代码**：直接 `git push`。iPad 下次联网打开 App 时会自动更新（只在主页、没有正在练习时才应用更新）。
- **改词库**：编辑 `Resources/latein_lektionen_1-11.json`，运行 `npm run encrypt`（输入同一个密码），然后提交并推送 `public/vocab.enc.json`。
  只要密码不变，iPad 会自动解密新词库，不用重新输入密码。
- **换密码**：运行 `npm run encrypt -- --new-salt`。iPad 上会出现提示，要求输入新密码。

## 学习进度与备份

- 学习进度只存在 iPad 本地（IndexedDB），已经申请了持久存储。
- 在 App 的 **Fortschritt → Sicherung exportieren** 里可以把进度导出到「文件」或 iCloud，**Sicherung laden** 可以恢复。
- **删除主屏幕图标会同时删除学习进度**，删除前请先导出备份。

## 功能（第 1 版）

| 区域 | 内容 |
|---|---|
| Heute（今天） | 今日待复习、学新词、问题词，连续学习天数 |
| Vokabeln（词汇） | 按课浏览：重音标注、朗读、助记提示、每个方向的学习等级；可以选多课一起练 |
| 训练 | 4 种答题方式：Auswahl（选择题）、Handschrift（手写）、Tastatur（键盘）、Karteikarte（卡片自评）；3 种方向：拉→德、德→拉、混合 |
| 判分 | 拉丁语答案必须带正确的长音符号（只错长音算答错，但会标出位置）；动词要答「不定式 + 第一人称单数」；德语答出任意一个释义即可 |
| 复习 | 按课本第 163 页的方法：复习 5 次，间隔分别为 3 小时、1 天、2 天、4 天、7 天；答错就从头再来 |
| Formen（词形） | 填变格表、填变位表、辨认词形（多个答案时要全部选出）、构造词形；只练「已学到的课」里的内容 |
| Grammatik（语法） | 每课的规则（自己写的说明）、自动生成的表格、标好句子成分的例句、学习小贴士 |
| Fortschritt（进度） | 统计、最近 14 天、每课掌握情况、问题词、设置、备份 |

## 有待确认

- `fīlia` 和 `fīlius`：照片里的长音符号被 fi 连写挡住了，按标准写法加了长音（在 JSON 里有 `macronCheck` 标记），请对照课本核对。
