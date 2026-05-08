# 简历后台管理与登录技术方案

版本：v0.1  
日期：2026-05-08  
项目：`next-resume-admin`

## 1. 结论

本后台管理项目继续使用 Next.js App Router + Neon/PostgreSQL，不引入独立后端。登录采用自建 Credentials Session：管理员账号存在 Neon，密码哈希存在 `admin_users`，登录成功后生成随机会话令牌，只把令牌哈希写入 `admin_sessions`，浏览器只保存 `httpOnly` Cookie。

需要补充数据库表。补充 SQL 已放在：

- `database/neon-admin-auth.sql`

这份 SQL 在现有 `database/neon-schema.sql` 之后执行。

## 2. 依据

- PRD 的 v0.4 规划包含“登录鉴权、内容编辑、联系消息查看和状态更新”。
- 现有 `database/neon-schema.sql` 已覆盖公开简历内容、项目、技能、经历、教育、证书、联系消息，但没有后台账号、会话、审计表。
- 本项目使用 Next.js `16.2.6`。本地 Next 文档说明：
  - `cookies()` 是异步 API，可在 Server Components 中读取 Cookie，在 Server Functions / Route Handlers 中写 Cookie。
  - Server Actions 可被直接 POST 调用，所以每个写操作都必须在服务端再次校验鉴权和授权。
  - Next 16 中 Middleware 已改名为 `proxy.ts`，适合做轻量路径检查，不适合做完整会话管理。

## 3. 总体架构

两个项目共用同一个 Neon 数据库：

- `next-resume`：公开简历站，只读已发布内容，并写入 `contact_messages`。
- `next-resume-admin`：后台管理站，登录后维护同一批简历内容表，并查看、处理联系消息。

推荐后台路由：

| 路由 | 用途 | 鉴权 |
|---|---|---|
| `/login` | 管理员登录 | 未登录可访问 |
| `/admin` | 后台首页 | 必须登录 |
| `/admin/profile` | 维护 `resumes` 主档 | owner/editor |
| `/admin/links` | 维护 `resume_links` | owner/editor |
| `/admin/skills` | 维护 `skill_groups`、`skill_items` | owner/editor |
| `/admin/work` | 维护 `work_experiences` | owner/editor |
| `/admin/projects` | 维护 `projects` | owner/editor |
| `/admin/education` | 维护 `education` | owner/editor |
| `/admin/certifications` | 维护 `certifications` | owner/editor |
| `/admin/messages` | 查看和更新 `contact_messages.status` | owner/editor/viewer |

### 3.1 强制三层架构

所有涉及数据库的接口必须按 `controller -> service -> dao` 分层，不允许在 Server Action、页面组件、布局或普通工具函数中直接写 SQL。

- `dao` 层：固定放在 `lib/dao/**`，只负责 SQL、参数化查询和数据库返回行映射；是唯一允许导入 `getSql()` 的业务层。
- `service` 层：固定放在 `lib/services/**`，负责登录、会话、锁定、审计、权限等业务规则编排；只能调用 DAO 或其他 service，不处理 `FormData`、Cookie、`redirect()` 和 UI 状态。
- `controller` 层：固定放在 `lib/controllers/**`，所有 Server Actions、Route Handler 委托函数和请求入口控制逻辑都必须放在这里；负责解析请求、读取 headers/cookies、设置/删除 Cookie、重定向和调用 service，不得导入 `getSql()`。
- `app/**` 目录只放页面、布局和 UI 组合，不新建 `actions.ts` 承载 controller；页面或组件需要提交表单时，直接从 `lib/controllers/**` 导入对应 Server Action。
- `lib/db.ts` 只保留 Neon 懒加载基础设施，不写具体业务查询。

## 4. 登录设计

### 4.1 账号与密码

使用 `admin_users` 存管理员：

- `email`：登录名，大小写不敏感唯一。
- `password_hash`：用 PostgreSQL `pgcrypto` 生成的 bcrypt 哈希。
- `role`：`owner`、`editor`、`viewer`。
- `is_active`：禁用账号时不允许登录。
- `failed_login_attempts` / `locked_until`：做基础暴力破解防护。

首个管理员通过 Neon SQL Editor 手动插入，示例已写在补充 SQL 的注释里。应用登录时不保存明文密码，用 SQL 校验：

```sql
password_hash = crypt($plain_password, password_hash)
```

这样不需要额外引入 bcrypt/argon2 依赖，符合 PRD “依赖少”的方向。

### 4.2 会话

使用 `admin_sessions` 存服务端会话：

- 登录成功后，服务端生成 32 字节以上随机 token。
- Cookie 保存原始 token，设置 `httpOnly`、`secure`、`sameSite=lax`、`path=/`。
- 数据库只保存 `sha256(token)` 后的 `session_token_hash`。
- 每次读取后台页面时，用 Cookie token 的哈希查 `admin_sessions`，并联表确认管理员仍 `is_active = true`。
- 过期、撤销或账号禁用后，旧 Cookie 立即失效。

建议 Cookie 名：

```text
resume_admin_session
```

默认有效期建议 7 天；个人项目也可以缩短为 24 小时。

### 4.3 退出登录

`logoutAction` 在 Server Action 中执行：

- 查询当前 Cookie。
- 将匹配的 `admin_sessions.revoked_at` 更新为当前时间。
- 删除 `resume_admin_session` Cookie。
- 重定向到 `/login`。

### 4.4 失败处理

- 登录失败统一返回“邮箱或密码不正确”，不暴露账号是否存在。
- 同一账号连续失败 5 次后锁定 15 分钟。
- 登录成功后清空失败计数，写入 `last_login_at`。
- 登录成功、失败、退出、内容更新都写入 `admin_audit_logs`。

## 5. Next.js 落地方式

推荐目录：

```text
app/login/page.tsx
app/admin/layout.tsx
app/admin/page.tsx
app/admin/**/page.tsx
lib/db.ts
lib/controllers/admin-auth-controller.ts
lib/dao/admin-users-dao.ts
lib/dao/admin-sessions-dao.ts
lib/dao/admin-audit-logs-dao.ts
lib/services/admin-auth-service.ts
lib/services/admin-audit-service.ts
lib/http/request-context.ts
lib/auth/session.ts
lib/auth/password.ts
lib/auth/guards.ts
proxy.ts
```

关键约束：

- `lib/db.ts` 使用懒加载 `getSql()`，不要在模块顶层初始化 Neon 客户端。
- 只有 `lib/dao/**` 可以调用 `getSql()` 或编写 SQL；登录、退出、会话校验和审计写入都必须经由 service 调 DAO。
- `/login` 使用 `lib/controllers/**` 中的 Server Action 处理表单提交并设置 Cookie。
- `app/**` 不放 controller，不新增 `actions.ts`；表单、按钮、页面和布局直接导入 `lib/controllers/**`。
- `app/admin/layout.tsx` 调用 `requireAdmin()`；无有效会话时 `redirect('/login')`。
- `proxy.ts` 只做乐观检查，例如没有 session Cookie 时把 `/admin/*` 重定向到 `/login`；不要在 Proxy 里查数据库。
- 所有后台写入 Server Actions 必须重新调用 `requireAdmin()`，不能只依赖页面层保护。
- 管理表单提交后，对当前后台页面使用 `revalidatePath()`；如果公开简历项目用了缓存，还需要通知公开项目刷新。

## 6. 共库与缓存策略

因为后台管理项目和公开简历项目是两个独立 Next 应用，后台里的 `revalidatePath('/')` 只能刷新后台应用，不能直接刷新公开简历应用。

推荐二选一：

1. MVP 阶段：公开简历项目对简历内容先使用动态读取，不缓存或使用短缓存。
2. 上线阶段：公开简历项目提供受保护的 `/api/revalidate`，后台更新内容后用 `REVALIDATE_TOKEN` 调用它，刷新公开页 `/` 和 `/projects/[slug]`。

## 7. 数据库权限建议

最低可行：两个项目先共用同一个 Neon `DATABASE_URL`。

更稳妥的生产做法：

- 公开简历项目使用只读加受限写入账号：只允许读已发布简历内容、插入 `contact_messages`。
- 后台管理项目使用管理账号：允许读写简历内容表、联系消息表和 `admin_*` 表。
- 两个项目不要共享后台登录 Cookie 域名。

## 8. 实施步骤

1. 在 Neon SQL Editor 先执行 `database/neon-schema.sql`。
2. 再执行 `database/neon-admin-auth.sql`。
3. 按 SQL 注释插入第一个 `owner` 管理员，并立即替换强密码。
4. 安装并接入 `@neondatabase/serverless`。
5. 实现 `getSql()`，并按 DAO + service + controller 三层拆分登录、会话校验、退出登录和审计。
6. 实现 `/admin` 受保护布局和基础管理页面。
7. 所有后台 mutation 加 `requireAdmin()`、角色授权、字段校验、审计日志，且数据库访问只能经过 DAO。
8. 根据公开简历项目缓存方式，选择动态读取或跨项目 revalidate。

## 9. 验收标准

- 未登录访问 `/admin` 会跳转 `/login`。
- 错误密码不能登录，且错误提示不泄露账号状态。
- 正确密码登录后可访问 `/admin`。
- 退出后旧 Cookie 不再有效。
- 禁用 `admin_users.is_active` 后，已有会话无法继续访问后台。
- 后台写操作没有登录时全部失败。
- `pnpm lint` 和 `pnpm build` 通过。
- Neon 中能看到会话和审计记录。
