"use client";

import { RoundPageContainer } from "../../../../components";
import { Modules } from "../../../../core";
import HowToList from "../lists/HowToList";

function HowToListContainerInternal() {
  return (
    <RoundPageContainer module={Modules.HowTo} fullWidth>
      <HowToList fullWidth />
    </RoundPageContainer>
  );
}

export default function HowToListContainer() {
  return <HowToListContainerInternal />;
}
