"use client";

import HowToContent from "@/features/essentials/how-to/components/details/HowToContent";
import HowToDetails from "@/features/essentials/how-to/components/details/HowToDetails";
import { useHowToContext } from "@/features/essentials/how-to/contexts/HowToContext";
import { HowToInterface } from "@/features/essentials/how-to/data/HowToInterface";
import { RoundPageContainer } from "@carlonicora/nextjs-jsonapi/components";
import { Modules } from "@carlonicora/nextjs-jsonapi/core";

type HowToContainerProps = {
  howTo: HowToInterface;
};

function HowToContainerInternal({ howTo }: HowToContainerProps) {
  return (
    <RoundPageContainer module={Modules.HowTo} details={<HowToDetails />}>
      <HowToContent />
    </RoundPageContainer>
  );
}

export default function HowToContainer() {
  const { howTo } = useHowToContext();
  if (!howTo) return null;

  return <HowToContainerInternal howTo={howTo} />;
}
