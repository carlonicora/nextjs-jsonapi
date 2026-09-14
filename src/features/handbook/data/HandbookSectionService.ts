import { AbstractService, EndpointCreator, HttpMethod, Modules } from "../../../core";
import { HandbookSectionInterface } from "./HandbookSectionInterface";

export class HandbookSectionService extends AbstractService {
  /**
   * Every section in one read, always.
   *
   * There are as many sections as an application has documentation directories
   * — ten or so — so this takes no `fetchAll` argument and no cursor: unlike
   * the page list, nothing here is ever a second page, and a caller that could
   * ask for one page of sections would only be able to get it wrong.
   */
  static async findMany(): Promise<HandbookSectionInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.HandbookSection });

    endpoint.addAdditionalParam("fetchAll", "true");
    if (Modules.HandbookSection.inclusions?.lists?.fields)
      endpoint.limitToFields(Modules.HandbookSection.inclusions.lists.fields);

    return this.callApi({
      type: Modules.HandbookSection,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }
}
