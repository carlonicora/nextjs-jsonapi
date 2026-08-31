"use client";

import { RoundPageContainer } from "../../../../components";
import { Modules } from "../../../../core";
import { useHowToContext } from "../../contexts/HowToContext";
import HowToContent from "../details/HowToContent";
import HowToDetails from "../details/HowToDetails";

function HowToContainerInternal() {
  return (
    <RoundPageContainer module={Modules.HowTo} details={<HowToDetails />}>
      <HowToContent />
    </RoundPageContainer>
  );
}

export default function HowToContainer() {
  const { howTo } = useHowToContext();
  if (!howTo) return null;

  return <HowToContainerInternal />;
}
