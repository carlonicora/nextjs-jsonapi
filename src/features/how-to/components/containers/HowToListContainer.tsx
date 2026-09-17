"use client";

import { ReactNode } from "react";

import { RoundPageContainer } from "../../../../components";
import { Modules } from "../../../../core";
import HowToList from "../lists/HowToList";

type HowToListContainerProps = {
  /** App-specific actions rendered before the built-in list actions */
  extraFunctions?: ReactNode[];
};

function HowToListContainerInternal({ extraFunctions }: HowToListContainerProps) {
  return (
    <RoundPageContainer module={Modules.HowTo} fullWidth>
      <HowToList fullWidth extraFunctions={extraFunctions} />
    </RoundPageContainer>
  );
}

export default function HowToListContainer(props: HowToListContainerProps) {
  return <HowToListContainerInternal {...props} />;
}
