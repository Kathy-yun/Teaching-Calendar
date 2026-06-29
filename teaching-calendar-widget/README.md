# 教学日历桌面挂件

一个悬浮在桌面上的教学日历小组件，支持上传教学周历和课表文件，自动生成待办事项，关闭重启后数据不丢失。

![Electron](https://img.shields.io/badge/Electron-34.0-4781f6?logo=electron)
![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript)

## 功能特性

### 📅 月历视图
- 6×7 日期网格，周一至周日排列
- 年份/月份下拉快速切换
- 教学周日期自动标注周次（W1、W2 …）
- 当天高亮 + 课前有课的日期标记蓝色圆点
- 「回到今天」一键返回当月

### 📝 待办管理
- **双击任意日期**创建待办
- 手动待办与自动课表待办分区展示
- 勾选完成 / 删除待办
- 待办数量上限 500 条，超出自动清理最早完成的记录

### 📚 课表集成
- 上传 Excel 课表文件，自动解析课程、教室、班级、周次
- 在教学周范围内自动生成每日课表待办（含上课时间段）
- 上课时间映射表可视化编辑，支持增删节次、冲突检测
- 默认提供 14 节标准上课时间（顺义校区 2025-2026-2 学期）

### 💾 数据持久化
- 教学周历、课表条目、待办列表、时间映射表全部自动保存
- 使用 `electron-store` 本地持久化，关闭重启后自动恢复
- 无需重复上传文件

### 🖥 桌面体验
- 无边框、半透明背景、始终置顶
- 托盘图标控制显示/隐藏
- 支持拖拽文件直接上传
- 窗口大小可调（400–600 px 宽），等比缩放适配

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm（推荐）或 npm

### 安装

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

启动后会出现一个桌面悬浮窗口，同时打开 DevTools。

### 构建

```bash
pnpm build
```

构建产物输出到 `out/` 目录。

### 打包为可执行文件

```bash
pnpm dist
```

生成 `release/` 目录下的便携版 `.exe`。

## 文件格式

### 教学周历（XLS / XLSX）

文件需包含教学周起始日期和总周数信息，上传后自动解析出每周一至周日的日期范围。

### 课表（XLS / XLSX）

标准高校课表格式：

| 列 | 内容 |
|----|------|
| A 列 | 节次标签（如 `第12节` 表示第1-2节，`第34节` 表示第3-4节） |
| B–H 列 | 星期一 至 星期日 |
| 单元格 | 多行文本：`课程名\n周次\n教室\n班级`，例如：`高等数学\n1-4,6-8,10-12\n综518\n计算机1班` |

周次支持范围写法（如 `1-4,6-8`）和单周写法（如 `10`），`week=0` 表示每周重复。

## 项目结构

```
src/
├── main/
│   └── index.ts              # Electron 主进程（窗口、托盘、IPC）
├── preload/
│   └── preload.js            # 预加载脚本（contextBridge 暴露 API）
├── shared/
│   └── types.ts              # TypeScript 类型定义
└── renderer/
    ├── src/
    │   ├── main.tsx          # 入口
    │   ├── App.tsx           # 根组件 + 事件编排
    │   ├── store/
    │   │   └── calendarStore.ts   # Zustand 全局状态
    │   ├── hooks/
    │   │   └── usePersistStore.ts # 自动持久化 hook
    │   ├── parsers/
    │   │   ├── index.ts             # 文件解析入口
    │   │   ├── xlsParser.ts         # 教学周历解析
    │   │   └── scheduleParser.ts    # 课表 + 时间映射解析
    │   ├── components/
    │   │   ├── TitleBar.tsx         # 标题栏（学期名、周次、最小化/关闭）
    │   │   ├── MonthView.tsx        # 月历网格 + 导航
    │   │   ├── TodoPanel.tsx        # 待办列表 + 上传/移除课表 + 时间设置
    │   │   ├── TodoModal.tsx        # 添加待办弹窗
    │   │   ├── TimeSlotModal.tsx    # 上课时间设置弹窗
    │   │   ├── TeachingWeekModal.tsx # 手动设置教学周弹窗
    │   │   └── DropdownMenu.tsx     # 下拉菜单
    │   └── styles/
    │       └── global.css
    └── index.html
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | Electron 34 |
| 前端 | React 18 + TypeScript |
| 构建工具 | electron-vite |
| 状态管理 | Zustand |
| 样式 | CSS Modules + 容器查询（`cqw`） |
| 文件解析 | xlsx（SheetJS） |
| 数据持久化 | electron-store |
| 日期处理 | date-fns |

## 待办路线图

- [ ] PDF / Word / 图片格式解析
- [ ] 点击教学周标记弹出详情
- [ ] 课前提醒通知
- [ ] UI 美化（毛玻璃、动画过渡）
- [ ] 多学期管理

## License

MIT
