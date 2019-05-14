import { UUID } from 'angular2-uuid';

import { DocTypeConstants } from '../../constants';
import { FacilityBillingProfile } from './facility-billing-profile';
import { FacilityProfile } from './facility-profile';
import { ISyncGatewayModel, SyncGatewayModel } from '../sync-gateway/sync-gateway-model';

// --- define facility model ---

export interface IFacility extends ISyncGatewayModel {
  account_id?: string;
  billing?: FacilityBillingProfile;
  created_by?: string;
  created_date?: string;
  modified_by?: string;
  modified_date?: string;
  profile?: FacilityProfile;
  residents?: string[];
  doc_type?: string;
}

export class Facility extends SyncGatewayModel implements IFacility {
  account_id: string;
  billing: FacilityBillingProfile;
  created_by: string;
  created_date: string;
  modified_by: string;
  modified_date: string;
  profile: FacilityProfile;
  residents: string[];
  doc_type = DocTypeConstants.DOC_TYPES.ACCOUNT.FACILITY;

  constructor(data: IFacility = {}) {
    super(
      data._id,
      data._rev,
      null,
      data.created_by,
      data.created_date,
      data.modified_by,
      data.modified_date
    );

    this._id = data._id || '';
    this.account_id = data.account_id || '';
    this.billing = data.billing || new FacilityBillingProfile();
    this.created_by = data.created_by || '';
    this.created_date = data.created_date || '';
    this.modified_by = data.modified_by || '';
    this.modified_date = data.modified_date || '';
    this.profile = data.profile || new FacilityProfile();
    this.residents = data.residents || [];
  }
}

export class FacilityFactory {
  static create(form: any): Facility {
    if (!form._id) {
      form._id = UUID.UUID();
    }

    return <Facility>Object.assign(new Facility(), form);
  }
}
