"use client";

import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { Fragment } from "react";
import { Separator } from "./ui/separator";
import { SidebarTrigger } from "./ui/sidebar";

const DashboardNav = () => {
  const pathname = usePathname();
  const segments = pathname.split("/");

  return (
    <nav className="flex items-center gap-2 border-b border-border p-2 mb-4">
      <SidebarTrigger />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          {segments
            .filter((segment) => segment !== "")
            .map((segment, index, filteredSegments) => {
              const path = `/${filteredSegments.slice(0, index + 1).join("/")}`;
              return (
                <Fragment key={segment}>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={path}>{segment}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {index < filteredSegments.length - 1 && (
                    <BreadcrumbSeparator />
                  )}
                </Fragment>
              );
            })}
        </BreadcrumbList>
      </Breadcrumb>
    </nav>
  );
};

export default DashboardNav;
