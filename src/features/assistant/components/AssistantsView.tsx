"use client";

import { RoundPageContainer } from "../../../components/containers/RoundPageContainer";
import { Modules } from "../../../core";
import type { AssistantInterface } from "../data/AssistantInterface";
import type { AssistantMessageInterface } from "../../assistant-message/data/AssistantMessageInterface";
import { AssistantProvider } from "../contexts/AssistantContext";
import { AssistantContainer } from "./containers/AssistantContainer";

interface Props {
  dehydratedAssistant?: AssistantInterface;
  dehydratedMessages?: AssistantMessageInterface[];
}

export function AssistantsView({ dehydratedAssistant, dehydratedMessages }: Props) {
  return (
    <RoundPageContainer module={Modules.Assistant} fullWidth>
      <AssistantProvider dehydratedAssistant={dehydratedAssistant} dehydratedMessages={dehydratedMessages}>
        <AssistantContainer />
      </AssistantProvider>
    </RoundPageContainer>
  );
}
