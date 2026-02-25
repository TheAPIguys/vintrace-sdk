import type { Party, PartyResponse } from '../../src/validation/schemas';

export const party: Party = {
  id: 43,
  primeName: 'ABC Wine Company',
  givenName: '03123457',
  phone: null,
  email: null,
  address: {
    street1: '1 Some Street',
    street2: null,
    city: 'Napa',
    state: 'CA',
    postalCode: '94558',
    country: null,
  },
  isOrganization: true,
};

export const individualParty: Party = {
  id: 13,
  primeName: 'Smith',
  givenName: 'Adam',
  phone: '04123457',
  email: 'smith@123.com',
  address: {
    street1: '22 Rainbow Walk',
    street2: null,
    city: 'HACKHAM',
    state: 'VIC',
    postalCode: '513',
    country: 'AUSTRALIA',
  },
  isOrganization: false,
};

export const partyResponse: PartyResponse = {
  status: 'Success',
  message: null,
  parties: [party, individualParty],
};
