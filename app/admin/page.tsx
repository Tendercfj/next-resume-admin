import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const sections = [
  {
    title: "简历资料",
    description: "维护个人资料、技能、经历、项目、教育和证书。",
  },
  {
    title: "访客消息",
    description: "查看联系消息，并更新处理状态。",
  },
  {
    title: "审计记录",
    description: "登录、退出和内容变更会写入后台审计表。",
  },
]

export default function AdminPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">控制台</p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          后台初始化完成
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          当前版本先接入登录、会话、退出和基础受保护入口，后续内容管理页可在此基础上继续扩展。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">待接入</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
