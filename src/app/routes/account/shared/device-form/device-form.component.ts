import * as moment from 'moment';
import * as _ from 'lodash';

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';

import { AuthenticationService } from '../../../../core/authentication/authentication.service';
import { BaseFormComponent, FormUtil } from '../../../../util/FormUtil';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import { DeviceService } from '../../../../core/device/device.service';
import { Resident } from '../../../../model/resident/resident';
import {
  Device, DeviceFactory, deviceProduct,
  CONTENT_MODE_QA,
  DEVICE_RESIDENT_MODE_ALL, DEVICE_RESIDENT_MODE_SELECT
} from '../../../../model/device/device';
import { skillLevelMap, skillLevel } from '../../../../model/content/content';
import { ToasterMessage } from '../../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../../core/ui-event-service/ui-event-service';
import { LoaderService } from '../../../../core/loader/loader.service';
import { ResidentService } from '../../../../core/resident/resident.service';
import { RoleService, IPermissions } from '../../../../core/role/role.service';
import {
  ROLE_EDIT_DEVICE_CONTENT_MODE,
  ROLE_EDIT_DEVICE_INTERNAL_NICKNAME,
  ROLE_EDIT_DEVICE_SERIAL_NUMBER,
  ROLE_EDIT_DEVICE_TERMS
} from '../../../../model/role/role';
import { BaseUser } from '../../../../model/user/user';

const COMPONENT_NAME = 'device-form';

@Component({
  selector: 'app-device-form',
  templateUrl: './device-form.component.html',
  styles: [ '.select-residents-container { margin-left: 26px }' ]
})
export class DeviceFormComponent extends BaseFormComponent implements OnInit {
  @Input() device?: Device;
  @Output() onSuccess: EventEmitter<any> = new EventEmitter<any>();
  @Output() onCancel: EventEmitter<any> = new EventEmitter<any>();

  accountId: string;
  dataLoaded = false;
  deviceId: string;
  editMode = false;
  facilityId: string;
  form: FormGroup;
  permissions: IPermissions;
  skillLevels = skillLevelMap;
  submitEnabled = true;
  residents: Resident[] = [];
  termsOfUseChecked = true;
  termsOfUseSignedDate;
  termsOfUseDisabled;

  products: string[] = Object.keys(deviceProduct);

  constructor(
    private authenticationService: AuthenticationService,
    private breadcrumbService: BreadcrumbService,
    private deviceService: DeviceService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private uiEventService: UiEventService,
    private loaderService: LoaderService,
    private residentService: ResidentService,
    private roleService: RoleService
  ) {
    super();
  }

  get serial_number() { return this.form.get('serial_number'); }

  ngOnInit() {
    this.editMode = !!this.device;

    this.permissions = this.roleService.currentUserPermissionsObject([
      { keyName: 'canEditContentMode', role: ROLE_EDIT_DEVICE_CONTENT_MODE },
      { keyName: 'canEditDeviceInternalNickname', role: ROLE_EDIT_DEVICE_INTERNAL_NICKNAME },
      { keyName: 'canEditDeviceSerialNumber', role: ROLE_EDIT_DEVICE_SERIAL_NUMBER },
      { keyName: 'canEditContentTerms', role: ROLE_EDIT_DEVICE_TERMS }
    ]);

    const serialNumberCharacters = Validators.compose([
      Validators.required, Validators.pattern( /^[a-zA-Z0-9_\-]*$/)
    ])

    const product = _.get(this, 'device.product', deviceProduct.FOCUS);
    this.form = this.fb.group({
      account_id: '',
      facility_id: '',
      device_id: '',
      serial_number: [
        this.editMode ? this.device.serial_number : '',
        !_.get(this, 'device.serial_number', null) && product === deviceProduct.ENGAGE ? null : serialNumberCharacters,
      ],
      nickname: [
        this.editMode ? this.device.nickname : '',
        Validators.required
      ],
      external_nickname: [ this.editMode ? _.get(this.device, 'external_nickname', '') : '' ],
      product: [ product ],
      resident_mode: [
        this.editMode ? _.get(this.device, 'resident_mode', DEVICE_RESIDENT_MODE_ALL) : DEVICE_RESIDENT_MODE_ALL
      ],
      skill_level: [ this.editMode ? this.device.skill_level : skillLevel.LEVEL_THREE ],
      qa_content_mode_active: [
        this.editMode ? (this.device.content_mode === CONTENT_MODE_QA) : false
      ],
      residents: new FormArray([])
    });

    if (!this.permissions['canEditDeviceSerialNumber']){
      this.form.get('serial_number').disable()
    }

    this.route.params.subscribe((params: { id: string, facility_id: string, device_id: string }) => {
      this.accountId = params.id;
      this.facilityId = params.facility_id;
      this.deviceId = params.device_id;

      this.form.get('account_id').setValue(this.accountId);
      this.form.get('facility_id').setValue(this.facilityId);
      if (this.deviceId) {
        this.form.get('device_id').setValue(this.deviceId);
      }

      // a checked state is just a temporary mode until the tablet can report back a timestamp
      // when creating a device, checked is automatically set to true
      // when editing a device, the checkbox is now strictly determined by terms logic on the device model
      const signedRecord = this.editMode ? this.device.getTermsOfUseRecord(this.accountId, this.facilityId) : null;
      this.termsOfUseDisabled = signedRecord && !signedRecord.acceptance_date;
      this.termsOfUseChecked = this.editMode ? this.termsOfUseDisabled : true;
      this.termsOfUseSignedDate = signedRecord && signedRecord.acceptance_date ? moment(signedRecord.acceptance_date).format('MMMM Do YYYY, h:mm:ss a') : '';

      this.residentService.getAllResidentsForFacility(params.facility_id)
        .flatMap((residents: Resident[]) => {
          // only show active residents
          this.residents = residents.filter(resident => resident.isActive());

          if (this.device) {
            return this.residentService.getResidentsWithDevice(this.device);
          }

          return Observable.of([]);
        })
        .subscribe((deviceResidents: Resident[]) => {
          // only include active deviceResidents
          deviceResidents = deviceResidents.filter(resident => resident.isActive());

          const residentModeControl = this.form.get('resident_mode');
          const resident_mode = _.get(this.device, 'resident_mode', '');

          // build select resident ui when resident_mode set to select
          if (residentModeControl.value === DEVICE_RESIDENT_MODE_SELECT) {
            deviceResidents.forEach((resident) => {
              const residentsControl = <FormArray> this.form.controls['residents'];
              residentsControl.push( new FormControl(resident) );
            });
          }

          this.dataLoaded = true;
        },
        error => {
          this.dataLoaded = true;
        });
    });
  }

  handleOnSubmit(e, value) {
    e.preventDefault();

    // reset form and disable submit button
    this.submitEnabled = false;

    // trim spaces from start/end of new outside of device
    value.serial_number = value.serial_number ? value.serial_number.trim() : _.get(this, 'device.serial_number');

    FormUtil.markAllAsTouched(this.form);

    // store selected Residents for later use, we want to remove 'residents' from the form
    // value object before use below
    const selectedResidentIds: string[] = [...value.residents].map(r => r._id);
    delete value.residents;

    if (this.form.valid) {
      this.loaderService.start(COMPONENT_NAME);

      const originalDevice = this.editMode ? Object.assign({}, this.device) : null;
      let formDevice: Device = this.editMode
        ? DeviceFactory.updateFromForm(this.device, value)
        : DeviceFactory.createFromForm(value);

      formDevice.account_id = this.accountId;
      formDevice.facility_id = this.facilityId;

      if (this.termsOfUseChecked && !this.termsOfUseDisabled) {
        formDevice.addTermsOfUseSigned(this.accountId, this.facilityId);
      }

      let deviceObservable;
      if (this.editMode && formDevice.serial_number !== originalDevice.serial_number) {
        deviceObservable = this.deviceService.updateDeviceWithSerialNumberChange(formDevice, selectedResidentIds, originalDevice.serial_number, formDevice.serial_number);
      } else if (this.editMode) {
        deviceObservable = this.deviceService.updateDevice(formDevice, selectedResidentIds);
      } else {
        deviceObservable = this.deviceService.addDevice(formDevice, selectedResidentIds);
      }

      deviceObservable.subscribe((result) => {
        const updateAction = this.editMode ? 'updated' : 'added';
        this.uiEventService.dispatch( new ToasterMessage({
          body: `Device ${formDevice.serial_number} has been ${updateAction}`,
          type: 'success'
        }) );

        if (this.onSuccess) {
          this.onSuccess.emit({ device: formDevice, previousDevice: originalDevice });
        }

        this.loaderService.stop(COMPONENT_NAME);
      },
      (error) => {
        this.uiEventService.dispatch( new ToasterMessage({ body: error, type: 'error' }) );
        this.loaderService.stop(COMPONENT_NAME);
        // keep button disabled for a bit to prevent duplicate click
        // on fast error responses. This doesn't hurt user experience because
        // their eyes will be drawn to the toaster error message
        setTimeout(() => { this.submitEnabled = true; }, 750);
      });
    }
  }

  handleOnCancelClick() {
    this.onCancel.emit();
  }

  handleAddResident(select) {
    const residents: FormArray = <FormArray>this.form.controls['residents'];

    residents.push(new FormControl(this.residents.filter(resident => resident._id === select.id)[0]));
  }

  handleRemoveResident(select) {
    const residents: FormArray = <FormArray>this.form.controls['residents'];

    // clone array so index doesn't change mid foreach
    [...residents.value].forEach((resident, index) => {
      if (resident._id === select.id) {
        residents.removeAt(index);
      }
    });
  }

  transformResidents(residents = []) {
    return residents.map((resident) => ({
      id: resident._id,
      text: `${resident.first_name} ${resident.last_name}`
    }))
  }

  isIn2lAdmin(): boolean {
    const user = <BaseUser>this.authenticationService.currentUser().value;
    return user.isIn2lAdmin();
  }

  productIsEngage(): boolean {
    return this.form.get('product').value === deviceProduct.ENGAGE;
  }

  serialNumberIsSet(): boolean {
    return !!this.form.get('serial_number').value;
  }

  showSerialNumberField(): boolean {
    return this.editMode || !this.productIsEngage() || this.serialNumberIsSet();
  }

  productChanged() {
    this.form.get('serial_number').validator = this.productIsEngage()
      ? null
      : Validators.required;

    this.form.get('serial_number').updateValueAndValidity();
  }
}
