# AGENTS.md

本文件是 `next-resume-admin` 的项目级代理规则。全局规则仍然适用；若有冲突，以本文件中更贴近本仓库的约束为准。

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## 项目定位

- 本仓库是 `next-resume-admin`，用于管理简历项目 `next-resume` 的后台。
- 两个项目都是 Next.js App Router 项目，共用同一套 Neon/PostgreSQL 数据库。
- 本项目只使用 Next.js 全栈能力，不引入 Express、NestJS、Koa、FastAPI 等独立后端。
- 默认使用中文沟通和编写项目说明；代码、变量、路由和数据库对象保持英文命名。

## 当前事实

- Neon 连接配置已接入 `.env.development.local`。
- 不要读取、打印、提交或泄露 `.env*` 中的任何值。
- Neon SQL Editor 已执行现有业务 schema 和后台登录补充 schema。
- 业务 schema 文件：`database/neon-schema.sql`。
- 后台登录补充 schema 文件：`database/neon-admin-auth.sql`。
- 登录与后台管理方案文件：`docs/admin-auth-technical-plan.md`。

## 技术栈

- Next.js `16.2.6`
- React `19.2.4`
- Tailwind CSS v4
- 包管理器：`pnpm`
- 数据库：Neon/PostgreSQL
- 数据库访问优先使用 `@neondatabase/serverless`

## 常用命令

```bash
rtk pnpm dev
rtk pnpm lint
rtk pnpm build
```

实现代码后必须优先运行：

```bash
rtk pnpm lint
rtk pnpm build
```

如果构建因外部字体、网络或环境变量限制失败，必须说明失败命令、错误信息、已排除项和下一步。

## Next.js 约束

- 写 Next.js 相关代码前，先查 `node_modules/next/dist/docs/` 中对应文档，不要只依赖记忆。
- 默认使用 App Router，不新增 Pages Router。
- 页面和布局默认 Server Component；只有表单交互、客户端状态、浏览器 API 才下沉为 Client Component。
- Server Actions 可以被直接 POST 调用，所以所有后台写操作必须在 action 内再次做鉴权和授权校验。
- `cookies()` 是异步 API；读取 Cookie 可在 Server Components 中做，设置或删除 Cookie 必须在 Server Function / Server Action / Route Handler 中做。
- Next 16 中 Middleware 已改名为 `proxy.ts`。Proxy 只能做轻量乐观检查，例如缺少后台 session Cookie 时跳转 `/login`，不要在 Proxy 中查数据库或做完整授权。

## 数据库约束

- 不要在模块顶层初始化 Neon、Drizzle、Redis 或第三方 SDK 客户端；必须使用懒加载 getter。
- 推荐封装 `lib/db.ts`：

```ts
import { neon } from "@neondatabase/serverless";

let sql: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!sql) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is not configured");
    }
    sql = neon(databaseUrl);
  }
  return sql;
}
```

- Neon 查询优先使用标签模板或参数化查询，不拼接用户输入：

```ts
await sql`SELECT * FROM resumes WHERE slug = ${slug}`;
await sql.query("SELECT * FROM resumes WHERE slug = $1", [slug]);
```

- 现有简历业务表包括：
  - `resumes`
  - `resume_links`
  - `skill_groups`
  - `skill_items`
  - `work_experiences`
  - `projects`
  - `education`
  - `certifications`
  - `contact_messages`
  - `comments`
- 后台登录表包括：
  - `admin_users`
  - `admin_sessions`
  - `admin_audit_logs`
- 除非用户明确要求，不要重复改造已执行过的 SQL schema；需要新增表或字段时，新增单独的补充 SQL 文件，并保持幂等。

## 后台登录实现约束

- 按 `docs/admin-auth-technical-plan.md` 实现自建 Credentials Session。
- 登录路由：`/login`。
- 后台受保护路由根：`/admin`。
- Cookie 名称：`resume_admin_session`。
- Cookie 必须设置 `httpOnly`、`sameSite: "lax"`、`path: "/"`；生产环境设置 `secure: true`。
- 登录成功后生成 32 字节以上随机 token。
- 浏览器 Cookie 保存原始 token；数据库 `admin_sessions.session_token_hash` 只保存 `sha256(token)` 的十六进制哈希。
- 密码哈希由 PostgreSQL `pgcrypto` 生成，登录校验使用：

```sql
password_hash = crypt($plain_password, password_hash)
```

- 不在应用代码中保存或记录明文密码。
- 登录失败统一提示“邮箱或密码不正确”，不暴露账号是否存在。
- 连续失败 5 次后锁定 15 分钟。
- 退出登录必须撤销当前 `admin_sessions.revoked_at` 并删除 Cookie。
- 禁用 `admin_users.is_active` 后，已有会话必须失效。
- 登录、失败登录、退出、内容更新、消息状态更新等关键动作要写入 `admin_audit_logs`。

## 权限模型

- `owner`：后台全部权限，包括账号管理和敏感配置。
- `editor`：可维护简历内容、项目、技能、经历、教育、证书和联系消息状态。
- `viewer`：只读后台内容，可查看联系消息，不可修改简历内容。
- 每个 Server Action 内都必须调用 `requireAdmin()` 或等价函数，并检查角色权限。

推荐后台路由：

| 路由 | 用途 | 权限 |
|---|---|---|
| `/login` | 管理员登录 | 未登录可访问 |
| `/admin` | 后台首页 | 登录后访问 |
| `/admin/profile` | 维护 `resumes` | owner/editor |
| `/admin/links` | 维护 `resume_links` | owner/editor |
| `/admin/skills` | 维护 `skill_groups`、`skill_items` | owner/editor |
| `/admin/work` | 维护 `work_experiences` | owner/editor |
| `/admin/projects` | 维护 `projects` | owner/editor |
| `/admin/education` | 维护 `education` | owner/editor |
| `/admin/certifications` | 维护 `certifications` | owner/editor |
| `/admin/messages` | 查看和更新 `contact_messages.status` | owner/editor/viewer |

## 推荐目录

```text
app/login/page.tsx
app/login/actions.ts
app/admin/layout.tsx
app/admin/page.tsx
app/admin/**/page.tsx
lib/db.ts
lib/auth/session.ts
lib/auth/password.ts
lib/auth/guards.ts
lib/admin/audit.ts
proxy.ts
```

## 数据修改与缓存

- 后台管理写操作使用 Server Actions。
- 表单字段必须做服务端校验：必填、长度、枚举、邮箱、URL、日期范围。
- 数据库错误不能直接暴露到前端。
- 后台页面写入后，对后台路径使用 `revalidatePath()`。
- 公开简历项目是另一个 Next 应用；本项目中的 `revalidatePath("/")` 不会刷新公开项目。
- 若公开项目启用缓存，后台更新后应调用公开项目受保护的 `/api/revalidate`，使用单独的 `REVALIDATE_TOKEN`。

## UI 与体验

- 后台是工作型管理界面，保持清晰、紧凑、可扫描，不做营销落地页。
- 表格、表单、筛选、状态徽标、空状态、错误状态要完整。
- UI 改动后必须用浏览器或截图验证桌面和移动端。
- 不要让文本和按钮在移动端溢出或重叠。

## 安全底线

- 永不提交 `.env*`、连接串、密码、token、Cookie 值。
- 不打印 `DATABASE_URL` 或任何密钥。
- 不把数据库堆栈、SQL 细节、连接错误直接返回给用户界面。
- 不执行删除数据、重置数据库、强推、生产发布、远程状态修改，除非用户明确授权。
- 需要新增依赖时先确认它的必要性；本项目优先保持依赖少。

## 验收标准

登录能力完成时至少满足：

- 未登录访问 `/admin` 跳转 `/login`。
- 错误密码不能登录，提示不暴露账号状态。
- 正确密码登录后可以访问 `/admin`。
- 退出后旧 Cookie 不再有效。
- 设置 `admin_users.is_active = false` 后，已有会话无法继续访问后台。
- 未登录时直接 POST 后台 Server Action 必须失败。
- `rtk pnpm lint` 通过。
- `rtk pnpm build` 通过，或明确说明外部原因。
