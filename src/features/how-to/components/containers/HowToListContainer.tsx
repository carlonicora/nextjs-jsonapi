"use client";

import HowToList from "@/features/essentials/how-to/components/lists/HowToList";
import { RoundPageContainer } from "@carlonicora/nextjs-jsonapi/components";
import { Modules } from "@carlonicora/nextjs-jsonapi/core";

function HowToListContainerInternal() {
  return (
    <RoundPageContainer module={Modules.HowTo}>
      <HowToList />
    </RoundPageContainer>
  );
}

export default function HowToListContainer() {
  return <HowToListContainerInternal />;
}
