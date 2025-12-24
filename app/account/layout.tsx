// Prevent static generation for account pages - they require authentication
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const dynamicParams = true

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

