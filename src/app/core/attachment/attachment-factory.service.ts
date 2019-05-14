import * as _ from 'lodash';

import { Attachment } from '../../model/attachment/attachment';


export class AttachmentFactoryService {
    createNewAttachmentFromFile(file: File, name?: string) {
        const filename = name ? name : file.name;

        return new Attachment( filename, file.type, file.size );
    }

    createUserFromCouchbaseResult(result): Attachment {
        const attachment = new Attachment();

        _.merge(attachment, result);

        return attachment;
    }
}
