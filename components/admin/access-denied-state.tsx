import { ArrowLeftIcon, ShieldAlertIcon } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

type AccessDeniedStateProps = {
  title: string
  description: string
}

export function AccessDeniedState({
  title,
  description,
}: AccessDeniedStateProps) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-card text-destructive">
            <ShieldAlertIcon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">权限不足</p>
            <h1 className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <Button asChild variant="outline" size="sm" className="w-fit">
          <Link href="/admin">
            <ArrowLeftIcon data-icon="inline-start" />
            返回控制台
          </Link>
        </Button>
      </div>
    </main>
  )
}
