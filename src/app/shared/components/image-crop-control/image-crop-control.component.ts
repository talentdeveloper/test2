import {
  Component,
  OnInit,
  Input,
  Output,
  ViewChild,
  EventEmitter
} from "@angular/core";
import {
  ImageCropperComponent,
  CropperSettings,
  Bounds
} from "ng2-img-cropper";
import { ModalDirective } from "ngx-bootstrap/modal";

import { FileUtilityService } from "../../../core/file/file-utility.service";

@Component({
  selector: "app-image-crop-control",
  templateUrl: "./image-crop-control.component.html",
  styleUrls: ["./image-crop-control.component.scss"]
})
export class ImageCropControlComponent implements OnInit {
  @Input() existingImageSrc: string;
  @Input() width: number = 100;
  @Input() height: number = 100;
  @Input() croppedWidth: number = 100;
  @Input() croppedHeight: number = 100;
  @Input() canvasWidth: number = 300;
  @Input() canvasHeight: number = 300;
  @Input() minWidth: number = 75;
  @Input() minHeight: number = 75;
  @Input() keepAspect: boolean = true;
  @Input() label: string = "Profile Image";

  @ViewChild("cropper", undefined) cropper: ImageCropperComponent;
  @ViewChild("removeImageModal") removeImageModal: ModalDirective;

  @Output() onCrop: EventEmitter<any> = new EventEmitter();
  @Output() onImageChanged: EventEmitter<any> = new EventEmitter();
  @Output() onRemoveImage: EventEmitter<any> = new EventEmitter();

  imageData: Object = {};
  cropperSettings: CropperSettings;
  showUpload = false;
  uploadedFile: File;
  uploadError = "";

  constructor() {}

  ngOnInit() {
    this.cropperSettings = new CropperSettings();

    this.cropperSettings.noFileInput = true;
    this.cropperSettings.allowedFilesRegex = new RegExp(/\.(jpe?g|png)$/, "i");

    this.cropperSettings.width = this.width;
    this.cropperSettings.height = this.height;

    this.cropperSettings.croppedWidth = this.croppedWidth;
    this.cropperSettings.croppedHeight = this.croppedHeight;

    this.cropperSettings.canvasWidth = this.canvasWidth;
    this.cropperSettings.canvasHeight = this.canvasHeight;

    this.cropperSettings.minWidth = this.minWidth;
    this.cropperSettings.minHeight = this.minHeight;

    this.cropperSettings.keepAspect = this.keepAspect;

    this.cropperSettings.cropperDrawSettings.strokeColor =
      "rgba(255,255,255,1)";
    this.cropperSettings.cropperDrawSettings.strokeWidth = 2;

    this.cropperSettings.preserveSize = false;
    this.cropperSettings.compressRatio = 0.3;
    this.cropperSettings.rounded = false;
  }

  cropped($event) {
    this.onCrop.emit($event);
  }

  fileChangeListener($event) {
    this.uploadedFile = $event.target.files[0];

    // same check run in ImageCropperComponent, pulled out to show error
    if (this.cropper.settings.allowedFilesRegex.test(this.uploadedFile.name)) {
      this.showUpload = true;
      this.uploadError = "";

      this.cropper.fileChangeListener($event);
    } else {
      this.showUpload = false;
      this.uploadError = "Please select a jpg or png image for upload.";
    }
  }

  removeImage($event) {
    if ($event.preventDefault) {
      $event.preventDefault();
    }

    this.removeImageModal.show();
  }

  removeImageConfirm() {
    this.onRemoveImage.emit();
    this.removeImageModal.hide();
  }

  cancelConfirm() {
    this.removeImageModal.hide();
  }

  cancelUpload() {
    this.showUpload = false;
  }

  // DEPRECATED: Due to no support for the File API in IE11, we cannot reliably create File objects
  // it may be best to pass along the base64 data instead using the methods provided below.
  // The FileUtilityService.convertDataURIToFile function is deprecated for the same reason
  getCroppedFile() {
    return this.isImageDataSet()
      ? FileUtilityService.convertDataURIToFile(
          this.imageData["image"],
          this.uploadedFile.name
        )
      : null;
  }

  getCroppedImageBase64Data() {
    return this.isImageDataSet() ? this.imageData["image"] : null;
  }

  getCroppedImageFilename() {
    return this.isImageDataSet() ? this.uploadedFile.name : null;
  }

  private isImageDataSet() {
    return (
      this.showUpload &&
      this.uploadedFile &&
      this.imageData &&
      this.imageData["image"]
    );
  }
}
