# 工程与验证

## 从源码到单个 HTML

`tools/build.mjs` 按固定顺序拼接共享同一 Three.js 场景的源码模块，将原创天空图写入环境模块，再用 esbuild 打包。脚本、Three.js 的 MIT 声明和界面一同写入根目录的 HTML。修改后可以双击该文件检查效果。

| 文件 | 主要内容 |
| --- | --- |
| `src/shell.html`、`src/interface.js` | 中文界面、地图、手记和本地存档 |
| `src/game.js` | 第一人称操控、碰撞、互动、召唤与主循环 |
| `src/core.js`、`src/materials.js` | 几何合批和程序材质 |
| `src/town.js`、`src/details.js`、`src/architecture.js` | 城镇布局、桥梁、街景、地标及室内 |
| `src/nature.js`、`assets/skybake.webp` | 树木花草、河谷远景和天空 |
| `src/water.js`、`src/optics.js` | 河面倒影、喷泉、饭碗、出场特效与渲染 |
| `src/character.js`、`src/exhibit.js` | 鲸鱼娘的网格、绘制材质、动作和角色预览 |
| `src/audio.js` | 环境声及交互音效 |
| `references/`、`docs/images/` | 用户提供的两张参考原图、成品截图与三视对照 |

日常构建使用已经烘焙好的天空。要修改云层算法，可编辑 `tools/make_sky.cpp`。例如在有 C++ 编译器和 ffmpeg 的环境中执行以下命令，重新生成天空图后再构建游戏。

```sh
mkdir -p .qa
c++ -O2 -std=c++17 tools/make_sky.cpp -o .qa/make_sky
.qa/make_sky 3584 950 .qa/skybake.ppm
ffmpeg -y -i .qa/skybake.ppm -c:v libwebp -quality 90 assets/skybake.webp
npm run build
```

## 离线验收

`npm test` 在断网的 Chrome 测试会话内打开交付文件，使用键盘和界面依次收齐十碗饭，验证钟楼梯子、喷泉召唤、角色预览和鉴赏。测试中途重新打开文件检查存档，最后确认清除进度，并模拟触屏摇杆与横竖屏地图。测试截图写入忽略目录 `.qa/`。

`tests/route.json` 是对应现有街区布局的验收路线。如果修改道路、碰撞或藏饭位置，可以运行 `npm run test:plan` 重新规划，再运行 `npm run build` 和 `npm test`。规划工具单独生成带调试接口的 `.qa/game.html`。

![用户三视图与游戏最终模型的正侧背对照](images/turnaround-comparison.webp)
