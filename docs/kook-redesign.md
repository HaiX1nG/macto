# Macto KOOK 化重构设计文档

> 决策日期：2026-08-08
> 状态：已确认，待执行
> 核心决策：重做数据库 + 完整 Role+Permission 系统 + 跟 KOOK 保持一致

## 一、目标架构

将扁平"房间制"重构为 KOOK 风格的"服务器->频道"两级结构，附带完整权限系统。

```
User ── Server ── Channel(text|voice|category)
       │              │
       ├── ServerMember ── Role ── Permission
       └── (私聊独立于服务器)
```

## 二、数据库 Schema（完整重建）

> 后端 GORM AutoMigrate。重做数据库 = 重写 `pkg/database/mysql.go` 的 `autoMigrate()` 模型列表 + 重写 `internal/model/`。

### 2.1 用户域（保留，微调）

#### users（保留）
- id uint64 PK
- username varchar(50) unique
- password_hash varchar(255)
- email varchar(100) unique
- avatar_url varchar(500)
- banner_url varchar(500)       -- 新增，个人横幅
- bio text                       -- 新增，个人简介
- created_at, updated_at

#### user_status（保留）
- id, user_id(unique), is_online, custom_status, last_seen_at, created_at, updated_at

### 2.2 服务器域（全新）

#### servers
- id uint64 PK
- name varchar(100) not null
- icon_url varchar(500)
- banner_url varchar(500)
- description varchar(500)
- owner_id uint64 not null index
- invite_code varchar(20) unique    -- 加入服务器用
- is_private tinyint(1) default 1
- max_members int default 500
- created_at, updated_at

#### server_members
- id uint64 PK
- server_id uint64 not null index
- user_id uint64 not null index
- nickname varchar(50)               -- 服务器内昵称
- joined_at datetime
- unique index (server_id, user_id)

#### roles
- id uint64 PK
- server_id uint64 not null index
- name varchar(50) not null
- color varchar(7) default '#99aab5'  -- hex 颜色
- position int not null default 0      -- 排序，越大越优先
- permissions bigint not null default 0 -- 位掩码，见权限定义
- is_mentionable tinyint(1) default 1
- created_at, updated_at
- index (server_id, position)

#### server_member_roles（成员-角色多对多）
- id uint64 PK
- server_id uint64 not null index
- member_id uint64 not null index       -- server_members.id
- role_id uint64 not null index
- unique index (member_id, role_id)

### 2.3 频道域（全新）

#### channels
- id uint64 PK
- server_id uint64 not null index
- name varchar(100) not null
- type tinyint not null                 -- 1=文字, 2=语音, 3=分类
- topic varchar(500)
- parent_id uint64                       -- 分类ID，顶层为 null
- position int not null default 0
- bitrake int default 64000              -- 语音频道比特率
- user_limit int default 0               -- 语音频道人数上限，0=无限
- slow_mode int default 0                -- 文字频道慢速模式(秒)
- created_at, updated_at
- index (server_id, parent_id, position)

### 2.4 消息域（重建）

#### channel_messages
- id uint64 PK
- channel_id uint64 not null index
- sender_user_id uint64 not null
- type tinyint not null default 1        -- 1=文本, 2=图片, 3=系统
- content text not null
- reply_to_id uint64                       -- 回复的消息ID
- edited_at datetime                       -- 编辑时间，null=未编辑
- is_pinned tinyint(1) default 0
- created_at
- index (channel_id, created_at)

#### message_attachments
- id uint64 PK
- message_id uint64 not null index
- filename varchar(255)
- url varchar(500)
- file_size int
- mime_type varchar(100)
- created_at

#### message_reactions
- id uint64 PK
- message_id uint64 not null index
- user_id uint64 not null
- emoji varchar(32) not null              -- emoji 字符或自定义标识
- created_at
- unique index (message_id, user_id, emoji)

### 2.5 语音/屏幕共享域（重建）

#### voice_participants（实时状态）
- id uint64 PK
- channel_id uint64 not null index
- user_id uint64 not null
- is_muted tinyint(1) default 0
- is_deafened tinyint(1) default 0
- is_speaking tinyint(1) default 0
- volume int default 100
- joined_at datetime
- unique index (channel_id, user_id)

#### voice_sessions（历史记录，保留设计）
- id, channel_id, user_id, joined_at, left_at
- index (channel_id, user_id)

#### screen_share_sessions
- id uint64 PK
- channel_id uint64 not null index
- user_id uint64 not null
- started_at datetime
- ended_at datetime                        -- null=正在共享

### 2.6 播放列表域（改造）
#### playlist_items
- id, channel_id(原 room_id), added_by, title, artist, music_url, duration, play_order, status, created_at
- index (channel_id, play_order), index (channel_id, status)

### 2.7 好友域（保留不动）
- friend_requests, friendships, private_messages -- 不变

## 三、权限系统（位掩码）

### 3.1 权限位定义（Go 常量 + 前端镜像）

```
// 服务器级权限
PermManageServer      = 1 << 0   // 管理服务器设置
PermManageRoles       = 1 << 1   // 管理角色
PermManageChannels    = 1 << 2   // 管理频道
PermKickMembers       = 1 << 3   // 踢出成员
PermBanMembers        = 1 << 4   // 封禁成员
PermInviteMembers     = 1 << 5   // 邀请成员
PermChangeNickname    = 1 << 6   // 修改昵称
PermManageNicknames   = 1 << 7   // 管理他人昵称

// 文字频道权限
PermViewChannel       = 1 << 8   // 查看频道
PermSendMessages      = 1 << 9   // 发送消息
PermManageMessages    = 1 << 10  // 管理消息(删/置顶)
PermEmbedLinks        = 1 << 11
PermAttachFiles       = 1 << 12
PermReadHistory       = 1 << 13  // 读取历史消息
PermMentionEveryone   = 1 << 14
PermAddReactions      = 1 << 15

// 语音频道权限
PermConnectVoice      = 1 << 16  // 连接语音
PermSpeak             = 1 << 17  // 说话
PermMuteMembers       = 1 << 18  // 静音他人
PermDeafenMembers     = 1 << 19
PermMoveMembers       = 1 << 20  // 移动成员
PermScreenShare       = 1 << 21  // 屏幕共享
PermPrioritySpeaker   = 1 << 22

// 管理员（全部权限）
PermAdministrator     = 1 << 30  // 拥有所有权限(除 owner 独占)
```

### 3.2 默认角色

每个服务器创建时自动生成：
- **@owner**（owner_id 用户专属）：permissions = 所有位 | (1<<30)，position=100，不可删除
- **@admin**：位掩码 = 管理服务器+频道+成员+消息权限，position=50
- **@member**（默认角色，新成员自动获得）：位掩码 = 查看+发消息+读历史+表情+连接语音+说话+屏幕共享，position=0

### 3.3 权限计算
成员最终权限 = 其所有角色的 permissions 位 OR 合并。若任一角色含 Administrator 位，则拥有全部权限。owner 用户恒为全权限。

## 四、后端 API 设计

### 4.1 路由

```
/api/v1
├── /auth/*                          # 不变
├── /user/*                          # 不变
├── /servers
│   ├── POST   /                     # 创建服务器(自动生成3默认角色+默认频道)
│   ├── GET    /                     # 我的服务器列表
│   ├── GET    /:id                  # 服务器详情(含channels)
│   ├── PUT    /:id                  # 更新服务器
│   ├── DELETE /:id                  # 删除服务器(仅owner)
│   ├── POST   /:id/join             # 加入服务器(inviteCode)
│   ├── POST   /:id/leave            # 离开服务器
│   ├── GET    /:id/members          # 成员列表(含角色)
│   ├── GET    /:id/members/:uid     # 成员详情
│   ├── PUT    /:id/members/:uid     # 设置成员昵称/角色
│   ├── DELETE /:id/members/:uid     # 踢出成员
│   ├── GET    /:id/roles            # 角色列表
│   ├── POST   /:id/roles            # 创建角色
│   ├── PUT    /:id/roles/:rid       # 更新角色
│   └── DELETE /:id/roles/:rid       # 删除角色
├── /servers/:sid/channels
│   ├── POST   /                     # 创建频道
│   ├── GET    /                     # 频道列表(树形)
│   ├── PUT    /:cid                 # 更新频道
│   ├── DELETE /:cid                 # 删除频道
│   └── PUT    /reorder              # 频道排序
├── /channels/:cid
│   ├── GET    /messages             # 分页历史消息
│   ├── POST   /messages             # 发消息
│   ├── PUT    /messages/:mid        # 编辑消息
│   ├── DELETE /messages/:mid        # 删除消息
│   ├── POST   /messages/:mid/pin    # 置顶
│   ├── POST   /messages/:mid/reactions    # 添加反应
│   ├── DELETE /messages/:mid/reactions/:emoji  # 移除反应
│   ├── POST   /voice/join           # 加入语音频道
│   ├── POST   /voice/leave          # 离开语音频道
│   ├── GET    /voice/participants   # 语音频道参与者
│   ├── POST   /voice/mute           # 设置静音
│   ├── POST   /screenshare/start    # 开始屏幕共享
│   ├── POST   /screenshare/stop     # 停止屏幕共享
│   ├── GET    /screenshare          # 当前共享状态
│   ├── GET    /playlist             # 播放列表
│   ├── POST   /playlist             # 添加播放项
│   ├── DELETE /playlist/:itemId     # 移除播放项
│   ├── POST   /playlist/play        # 播放
│   ├── POST   /playlist/pause       # 暂停
│   ├── POST   /playlist/skip        # 跳过
│   └── POST   /playlist/reorder     # 排序
├── /friends/*                       # 不变
├── /upload                          # 不变
└── /ws                              # WebSocket
```

### 4.2 WS 协议

连接：per-app 单例，不绑 room_id。通过 join_channel/leave_channel 订阅。

```jsonc
// C->S
{ "event": "join_channel",  "data": { "channelId": 123 } }
{ "event": "leave_channel", "data": { "channelId": 123 } }
{ "event": "chat_message",  "data": { "channelId": 123, "type": 1, "content": "..." } }
{ "event": "webrtc_signal", "data": { "type": "offer", "targetId": 456, "payload": "..." } }
{ "event": "typing",        "data": { "channelId": 123, "isTyping": true } }

// S->C
{ "event": "chat_message",       "data": { "channelId": 123, "message": {...} } }
{ "event": "message_delete",     "data": { "channelId": 123, "messageId": 1 } }
{ "event": "message_update",     "data": { "channelId": 123, "message": {...} } }
{ "event": "reaction_add",       "data": { "messageId": 1, "emoji": "👍", "userId": 2 } }
{ "event": "reaction_remove",    "data": { "messageId": 1, "emoji": "👍", "userId": 2 } }
{ "event": "voice_user_joined",  "data": { "channelId": 123, "user": {...} } }
{ "event": "voice_user_left",    "data": { "channelId": 123, "userId": 456 } }
{ "event": "voice_state_update", "data": { "channelId": 123, "userId": 456, "isMuted": true } }
{ "event": "screen_share_start", "data": { "channelId": 123, "userId": 456 } }
{ "event": "screen_share_stop",  "data": { "channelId": 123, "userId": 456 } }
{ "event": "webrtc_signal",      "data": { "fromUserId": 456, "fromUsername": "...", "signal": {...} } }
{ "event": "member_joined",      "data": { "serverId": 1, "member": {...} } }
{ "event": "member_left",        "data": { "serverId": 1, "userId": 456 } }
```

删除旧事件：webrtc_offer / webrtc_answer / webrtc_ice_candidate / audio_share_* (合并到 screen_share)

## 五、前端类型契约（shared/types 重建）

文件拆分：server.ts / channel.ts / message.ts / voice.ts / permission.ts / common.ts
ID 统一 number。枚举用 as const + 联合类型。

## 六、前端 Store（11 -> 7）

| Store | 职责 |
|-------|------|
| authStore | 认证+当前用户 |
| serverStore | 服务器列表+当前服务器+成员+角色 |
| channelStore | 频道树+当前频道 |
| chatStore | 频道消息(多频道缓存 Map<channelId, Message[]>) |
| voiceStore | 仅语音状态(当前语音频道+参与者+mute/deafen) |
| mediaStore | 统一 WebRTC peer+屏幕共享+远程流+设备 |
| uiStore | 导航(currentServerId/currentChannelId/activeView)+布局+主题 |

删除：roomStore(壳) / layoutStore(并入uiStore) / themeStore(并入uiStore) / websocketStore(并入service) / playlistStore(并入channelStore) / eventBus(精简) / settingsStore(并入uiStore)

## 七、前端 UI（KOOK 四栏）

```
┌──────┬────────┬────────────────────┬────────┐
│服务器 │ 频道列表 │    主内容区         │ 成员列表 │
│图标栏 │ 240px  │   (聊天/语音/屏幕)   │ 240px  │
│72px  │        │                    │(可折叠) │
└──────┴────────┴────────────────────┴────────┘
```

页面(viewRegistry): server-home / text-channel / voice-channel / settings / friends

## 八、执行阶段

| 阶段 | 内容 | 仓库 |
|------|------|------|
| 1 | 后端: model+repo+service+dto+路由(服务器/频道/消息/权限) | Gin-macto |
| 2 | 后端: WS Hub 改 channel 维度 + 新事件协议 | Gin-macto |
| 3 | 前端: shared/types 重建 + apiClient/service 对接新端点 | macto |
| 4 | 前端: Store 重组 11->7 | macto |
| 5 | 前端: UI 重建 KOOK 四栏 + 页面 | macto |
| 6 | 测试+清理+性能+gitignore | 两仓库 |

每个阶段完成后 tsc/lint/test/build 四项检查通过才进入下一阶段。
