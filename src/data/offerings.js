// Offerings — public data API for tenant offerings.
//
// As of the unified-config migration, this file is a thin wrapper over
// `configStore.js`. The canonical Offering schema lives there. This wrapper
// keeps the legacy named exports (OFFERINGS, OFFERING_BY_ID, listOfferings,
// getOffering, ALL_OFFERINGS_LENS) stable so existing consumers across the
// codebase don't break.
//
// Engineering hand-off note: the legacy in-memory OFFERINGS const is now a
// Proxy-style live snapshot of the configStore. Mutations via configStore
// propagate to the consumers automatically (via subscribeConfig).

import {
  listOfferings as listOfferingsFromStore,
  getOffering as getOfferingFromStore,
  upsertOffering as upsertOfferingInStore,
  deleteOffering as deleteOfferingInStore,
  subscribeConfig,
} from './configStore.js';

// Snapshot view — read at the moment of import, not live. Most consumers
// only need a static array; reactive consumers should use listOfferings()
// + subscribeConfig() / subscribeOfferings().
export const OFFERINGS = listOfferingsFromStore();

export const OFFERING_BY_ID = Object.fromEntries(OFFERINGS.map((o) => [o.id, o]));

// Live readers — preferred over the static snapshots.
export function listOfferings() {
  return listOfferingsFromStore();
}

export function getOffering(id) {
  return getOfferingFromStore(id);
}

export function upsertOffering(offering) {
  return upsertOfferingInStore(offering);
}

export function deleteOffering(id) {
  return deleteOfferingInStore(id);
}

export function subscribeOfferings(onChange) {
  return subscribeConfig(onChange);
}

// "All" pseudo-offering used by filter UIs
export const ALL_OFFERINGS_LENS = {
  id: 'all',
  name: 'All offerings',
  textColor: 'text-text-primary',
  bg: 'bg-primary/15',
  borderColor: 'border-primary/40',
};
