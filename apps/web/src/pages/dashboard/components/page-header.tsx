import { Fragment, type ReactNode } from "react";
import { Link } from "react-router";
import { SidebarTrigger } from "../../../components/ui/sidebar";
import { Separator } from "../../../components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../../components/ui/breadcrumb";
import { cn } from "@/lib/utils";

export type BreadcrumbItemType = {
  label: ReactNode;
  to?: string;
  href?: string;
};

type Props = {
  items?: BreadcrumbItemType[];
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export default function PageHeader({ items, children, actions, className }: Props) {
  const hasItems = items && items.length > 0;

  return (
    <div className={cn("bg-sidebar pt-3 pb-0.5", className)}>
      <div className="flex items-center justify-between px-3 py-2 rounded-tl-3xl bg-secondary min-h-12">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4 mx-1" />

          {hasItems ? (
            <Breadcrumb>
              <BreadcrumbList>
                {items.map((item, index) => {
                  const isLast = index === items.length - 1;

                  return (
                    <Fragment key={index}>
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage className="text-base font-medium text-foreground">
                            {item.label}
                          </BreadcrumbPage>
                        ) : item.to ? (
                          <Link
                            to={item.to}
                            className="text-base text-muted-foreground transition-colors hover:text-foreground"
                          >
                            {item.label}
                          </Link>
                        ) : item.href ? (
                          <BreadcrumbLink
                            href={item.href}
                            className="text-base text-muted-foreground transition-colors hover:text-foreground"
                          >
                            {item.label}
                          </BreadcrumbLink>
                        ) : (
                          <span className="text-base text-muted-foreground">
                            {item.label}
                          </span>
                        )}
                      </BreadcrumbItem>
                      {!isLast && <BreadcrumbSeparator />}
                    </Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          ) : (
            <div className="text-base font-medium text-foreground flex items-center">
              {children}
            </div>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}