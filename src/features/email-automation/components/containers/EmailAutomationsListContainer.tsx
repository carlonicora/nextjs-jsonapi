"use client";

import { RoundPageContainer } from "../../../../components";
import { Modules } from "../../../../core";
import { AdministrationProvider } from "../../../administration/contexts/AdministrationContext";
import { EmailAutomationsList } from "../lists/EmailAutomationsList";

/**
 * Page container for the administrative email-automation list.
 *
 * Client component by necessity: `module={Modules.EmailAutomation}` is a
 * registry entry carrying an icon component and methods, which a Server
 * Component cannot pass across the boundary. Routes mount this container
 * instead — the same shape as every other list page.
 *
 * No `forceHeader`: ContentListTable draws its own header row with the title
 * and the create action, exactly as the company and user list pages do.
 */
export function EmailAutomationsListContainer() {
  return (
    <AdministrationProvider>
      <RoundPageContainer module={Modules.EmailAutomation} fullWidth>
        <EmailAutomationsList fullWidth />
      </RoundPageContainer>
    </AdministrationProvider>
  );
}
