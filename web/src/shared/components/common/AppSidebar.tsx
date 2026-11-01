import { Link, useLocation } from '@tanstack/react-router'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/shared/components/ui/sidebar'
import { BRAND } from '@/shared/lib/brand'
import { NAV, NAV_REFERENCE } from '@/shared/lib/nav'
import { BrandMark } from './BrandMark'
import { ThemeSelect } from './ThemeSelect'

function NavItems({ items, pathname }: { items: typeof NAV | typeof NAV_REFERENCE; pathname: string }) {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.to}>
          <SidebarMenuButton
            asChild
            tooltip={item.label}
            isActive={item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)}
          >
            <Link to={item.to}>
              <item.icon aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

export function AppSidebar() {
  const { pathname } = useLocation()
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <BrandMark className="size-6! shrink-0" />
                <span className="truncate font-display text-lg">{BRAND}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <NavItems items={NAV} pathname={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Reference</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavItems items={NAV_REFERENCE} pathname={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <ThemeSelect />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
