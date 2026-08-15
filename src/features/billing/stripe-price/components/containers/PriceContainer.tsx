"use client";

import { RoundPageContainer } from "../../../../../components";
import { Modules } from "../../../../../core";
import { usePriceContext } from "../../../contexts/PriceContext";
import { PriceDetails } from "../details/PriceDetails";

export function PriceContainer() {
  const { price } = usePriceContext();

  if (!price) return null;

  // No tabs: a price is a single flat record. RoundPageContainer without
  // `tabs` and without `fullWidth` gives the centred max-w-6xl column and the
  // title bar that PriceContext's chrome fills.
  return (
    <RoundPageContainer module={Modules.StripePrice} id={price.id}>
      <PriceDetails />
    </RoundPageContainer>
  );
}
