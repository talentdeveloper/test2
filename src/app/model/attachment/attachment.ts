
export class Attachment {
    content_type: string;
    length: number;
    name: string;
    digest?: string;
    revpos?: number;
    stub?: boolean;

    constructor(
        name: string = '',
        content_type: string = '',
        length: number = 0,
        digest?: string,
        revpos?: number,
        stub?: boolean
    ) {
        this.name = name;
        this.content_type = content_type;
        this.length = length;
        this.digest = digest;
        this.revpos = revpos;
        this.stub = stub;
    }
}
