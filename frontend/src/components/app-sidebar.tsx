import { Files, History, LinkIcon, Upload } from "lucide-react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { helixLogoMarkWhite, batman } from "@/assets";

const sidebarItems = [
  {
    label: "All Files",
    link: "/dashboard",
    icon: <Files size={20} />,
  },
  {
    label: "Upload Files",
    link: "/dashboard/upload",
    icon: <Upload size={20} />,
  },
  {
    label: "Upload Links",
    link: "/dashboard/upload-links",
    icon: <LinkIcon size={20} />,
  },
  {
    label: "Upload History",
    link: "/dashboard/upload-history",
    icon: <History size={20} />,
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2 p-2 rounded-md border-sidebar-border border">
            <div className="bg-blue-700 flex aspect-square size-8 items-center justify-center rounded-lg">
              <Image
                src={helixLogoMarkWhite}
                className="size-4"
                alt="Helix Logo"
              />
            </div>
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-semibold text-lg">Helix</span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {sidebarItems.map((item) => (
                <Link href={item.link} key={item.link}>
                  <SidebarMenuItem className="flex items-center gap-2 p-2 rounded-md hover:bg-sidebar-accent">
                    {item.icon}
                    {item.label}
                  </SidebarMenuItem>
                </Link>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 p-2 rounded-md bg-sidebar-accent border border-sidebar-border">
          <Image src={batman} alt="Batman" className="w-10 rounded-lg" />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">Batman</span>
            <span className="text-sm">batman@hotmail.com</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
