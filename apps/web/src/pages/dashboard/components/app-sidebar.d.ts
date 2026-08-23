import React from "react";
export declare function AppSidebar(): React.JSX.Element;
export declare function ContextSwitcher({ contexts, currentContext, setContext }: {
    currentContext: string | null;
    contexts: string[];
    setContext: (context: string) => void;
}): React.JSX.Element | null;
