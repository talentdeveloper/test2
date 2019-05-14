import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';


@Injectable()
export class FileUtilityService {

    // DEPRECATED METHOD: IE11 does not support File API constructor, could not find workaround
    // @see: http://caniuse.com/#search=file see notes on IE11
    // @see: https://stackoverflow.com/questions/44377464/ie-11-failed-to-create-file-object-from-byte-array-in-angular-2
    static convertDataURIToFile(dataURI: string, filename: string): File {
        const binary = atob(dataURI.split(',')[1]);
        const array = [];

        for (let i = 0; i < binary.length; i++) {
            array.push( binary.charCodeAt(i) );
        }

        return new File(
            [ new Uint8Array(array) ],
            filename,
            { type: FileUtilityService.getDataUriMimeType(dataURI) }
        );
    }

    static getDataUriMimeType(dataUri: string) {
        // logic borrowed from ng2-image-cropper ImageCropper model

        // Get a substring because the regex does not perform well on very large
        // strings. Cater for optional charset. Length 50 should be enough.
        const dataUriSubstring = dataUri.substring(0, 50);
        let mimeType = 'image/png';

        // data-uri scheme
        // data:[<media type>][;charset=<character set>][;base64],<data>
        const regEx = RegExp(/^(data:)([\w\/\+]+);(charset=[\w-]+|base64).*,(.*)/gi);
        const matches = regEx.exec(dataUriSubstring);
        if (matches && matches[2]) {
            mimeType = matches[2];

            // make sure proper jpg mime type gets set, a common issue with jpg's
            if (mimeType === 'image/jpg') {
                mimeType = 'image/jpeg';
            }
        }

        return mimeType;
    }

    /**
     * convertBloblToDataURI()
     *
     * accepts both a Blob object or a File object and returns the data
     * as a base64 encoded string through an Observable
     */
    static convertBlobToDataURI(data: Blob | File): Observable<string> {
        const observable = new Observable<string>((observer: Observer<string>) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                observer.next(e.target['result']);
                observer.complete();
            };
            reader.readAsDataURL(data);
        });

        return observable;
    }
}
