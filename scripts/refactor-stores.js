#!/usr/bin/env node
/**
 * 自动重构 Macto 项目 Store 引用脚本
 *
 * 这个脚本自动将所有引用旧 store 的文件更新为新的 domain store
 */

const fs = require('fs');
const path = require('path');

// 映射规则: [旧 import 模式, 新 import 目标]
const importMappings = [
  {
    old: "import { useAuthStore",
    newStore: "import { useUserDomainStore",
    newPath: "@renderer/stores/userDomainStore",
    deprecatedPath: "@renderer/stores/authStore",
  },
  {
    old: "import { useServerStore",
    newStore: "import { useRoomDomainStore",
    newPath: "@renderer/stores/roomDomainStore",
    deprecatedPath: "@renderer/stores/serverStore",
  },
  {
    old: "import { useRoomStore",
    newStore: "import { useRoomDomainStore",
    newPath: "@renderer/stores/roomDomainStore",
    deprecatedPath: "@renderer/stores/roomStore",
  },
  {
    old: "import { useVoiceStore",
    newStore: "import { useRoomDomainStore",
    newPath: "@renderer/stores/roomDomainStore",
    deprecatedPath: "@renderer/stores/voiceStore",
  },
  {
    old: "import { useChatStore",
    newStore: "import { useContentDomainStore",
    newPath: "@renderer/stores/contentDomainStore",
    deprecatedPath: "@renderer/stores/chatStore",
  },
  {
    old: "import { useMediaStore",
    newStore: "import { useContentDomainStore",
    newPath: "@renderer/stores/contentDomainStore",
    deprecatedPath: "@renderer/stores/mediaStore",
  },
  {
    old: "import { useThemeStore",
    newStore: "import { useSettingsStore",
    newPath: "@renderer/stores/settingsStore",
    deprecatedPath: "@renderer/stores/themeStore",
  },
];

// 查找需要更新的文件
const targetDirs = [
  'src/renderer/components',
  'src/renderer/hooks',
];

function findFiles(dir, pattern) {
  const results = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...findFiles(fullPath, pattern));
    } else if (pattern.test(fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}

function updateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  for (const mapping of importMappings) {
    if (content.includes(mapping.old)) {
      // 检查是否已经是新路径
      const lines = content.split('\n');
      const newLines = lines.map(line => {
        if (line.trim().startsWith(mapping.old)) {
          // 替换为新的 import
          return line.replace(mapping.old, mapping.newStore);
        }
        return line;
      });
      content = newLines.join('\n');
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated: ${filePath}`);
  }
}

// 主逻辑
console.log('Starting store refactor...');

const allFiles = [];
for (const dir of targetDirs) {
  if (fs.existsSync(dir)) {
    allFiles.push(...findFiles(dir, /\.(tsx|ts)$/));
  }
}

for (const file of allFiles) {
  updateImports(file);
}

console.log('Store refactor complete!');
