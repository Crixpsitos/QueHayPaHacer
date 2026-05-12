'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { cn } from '@/app/lib/utils/cn'

interface NavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  activeClassName?: string
}

function NavLinkActive({
  href,
  children,
  className,
  activeClassName = 'active',
}: NavLinkProps) {
  const pathname = usePathname()
  const isRoot = href === '/'
  const isActive = isRoot
    ? pathname === '/'
    : pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(className, isActive && activeClassName)}
    >
      {children}
    </Link>
  )
}

export function NavLink(props: NavLinkProps) {
  return (
    <Suspense
      fallback={
        <Link href={props.href} className={props.className}>
          {props.children}
        </Link>
      }
    >
      <NavLinkActive {...props} />
    </Suspense>
  )
}