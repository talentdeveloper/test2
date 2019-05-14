export class SyncGatewayDocumentChange {
    id: string;
    changes: {
        rev: string;
    }[];
    deleted: boolean;
    seq: number;
    doc: {
      modified_by?: string;
    }
}
