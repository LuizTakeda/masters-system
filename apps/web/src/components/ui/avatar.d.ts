import * as React from "react";
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
declare function Avatar({ className, size, ...props }: AvatarPrimitive.Root.Props & {
    size?: "default" | "sm" | "lg";
}): React.JSX.Element;
declare function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props): React.JSX.Element;
declare function AvatarFallback({ className, ...props }: AvatarPrimitive.Fallback.Props): React.JSX.Element;
declare function AvatarBadge({ className, ...props }: React.ComponentProps<"span">): React.JSX.Element;
declare function AvatarGroup({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element;
declare function AvatarGroupCount({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element;
export { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarBadge, };
