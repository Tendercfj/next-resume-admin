import type { LucideIcon } from "lucide-react"
import {
  AwardIcon,
  BriefcaseBusinessIcon,
  FolderKanbanIcon,
  GraduationCapIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LinkIcon,
  ListChecksIcon,
  UserRoundIcon,
} from "lucide-react"

import type { AdminRole } from "@/lib/auth/constants"

export type AdminSectionId =
  | "profile"
  | "links"
  | "skills"
  | "work"
  | "projects"
  | "education"
  | "certifications"
  | "messages"

export type AdminNavItem = {
  id: "dashboard" | AdminSectionId
  title: string
  shortTitle: string
  description: string
  href: string
  icon: LucideIcon
  permission: string
  allowedRoles: readonly AdminRole[]
  checklist: string[]
  status: "ready" | "planned"
}

export const ADMIN_HOME_ITEM: AdminNavItem = {
  id: "dashboard",
  title: "控制台",
  shortTitle: "控制台",
  description: "查看后台入口、模块状态和后续维护任务。",
  href: "/admin",
  icon: LayoutDashboardIcon,
  permission: "owner / editor / viewer",
  allowedRoles: ["owner", "editor", "viewer"],
  checklist: ["登录会话", "权限模型", "模块入口"],
  status: "ready",
}

export const ADMIN_SECTION_ITEMS: AdminNavItem[] = [
  {
    id: "profile",
    title: "简历资料",
    shortTitle: "资料",
    description: "维护 resumes 主档，包括标题、摘要、公开状态和基础展示信息。",
    href: "/admin/profile",
    icon: UserRoundIcon,
    permission: "owner / editor",
    allowedRoles: ["owner", "editor"],
    checklist: ["主档表单", "发布状态", "基础校验"],
    status: "ready",
  },
  {
    id: "links",
    title: "链接管理",
    shortTitle: "链接",
    description: "维护站点、社交账号和作品链接，控制排序与展示状态。",
    href: "/admin/links",
    icon: LinkIcon,
    permission: "owner / editor",
    allowedRoles: ["owner", "editor"],
    checklist: ["URL 校验", "排序控制", "启停状态"],
    status: "ready",
  },
  {
    id: "skills",
    title: "技能矩阵",
    shortTitle: "技能",
    description: "维护 skill_groups 与 skill_items，组织技能分组、熟练度和排序。",
    href: "/admin/skills",
    icon: ListChecksIcon,
    permission: "owner / editor",
    allowedRoles: ["owner", "editor"],
    checklist: ["分组管理", "技能条目", "展示排序"],
    status: "ready",
  },
  {
    id: "work",
    title: "工作经历",
    shortTitle: "经历",
    description: "维护 work_experiences，补充公司、职位、时间线和成果描述。",
    href: "/admin/work",
    icon: BriefcaseBusinessIcon,
    permission: "owner / editor",
    allowedRoles: ["owner", "editor"],
    checklist: ["时间范围", "成果要点", "当前职位"],
    status: "ready",
  },
  {
    id: "projects",
    title: "项目作品",
    shortTitle: "项目",
    description: "维护 projects，管理项目亮点、技术栈、链接和展示顺序。",
    href: "/admin/projects",
    icon: FolderKanbanIcon,
    permission: "owner / editor",
    allowedRoles: ["owner", "editor"],
    checklist: ["项目表单", "技术标签", "精选状态"],
    status: "ready",
  },
  {
    id: "education",
    title: "教育经历",
    shortTitle: "教育",
    description: "维护 education，补充学校、专业、时间范围和描述。",
    href: "/admin/education",
    icon: GraduationCapIcon,
    permission: "owner / editor",
    allowedRoles: ["owner", "editor"],
    checklist: ["学校信息", "日期范围", "展示排序"],
    status: "ready",
  },
  {
    id: "certifications",
    title: "证书资质",
    shortTitle: "证书",
    description: "维护 certifications，记录证书名称、颁发方、日期和凭证链接。",
    href: "/admin/certifications",
    icon: AwardIcon,
    permission: "owner / editor",
    allowedRoles: ["owner", "editor"],
    checklist: ["证书信息", "凭证链接", "日期校验"],
    status: "ready",
  },
  {
    id: "messages",
    title: "联系消息",
    shortTitle: "消息",
    description: "查看 contact_messages，并更新待处理、已读、已归档等状态。",
    href: "/admin/messages",
    icon: InboxIcon,
    permission: "owner / editor / viewer",
    allowedRoles: ["owner", "editor", "viewer"],
    checklist: ["消息列表", "状态筛选", "处理记录"],
    status: "ready",
  },
]

export const ADMIN_NAV_ITEMS = [ADMIN_HOME_ITEM, ...ADMIN_SECTION_ITEMS]

export function getAdminSection(sectionId: AdminSectionId) {
  return ADMIN_SECTION_ITEMS.find((item) => item.id === sectionId)
}
