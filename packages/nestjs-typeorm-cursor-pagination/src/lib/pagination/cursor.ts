export class Cursor {
  private cursor: string;
  private columnId: string;
  constructor(value: string, columnId: string) {
    this.cursor = value;
    this.columnId = columnId;
  }
  encode(): string {
    return Buffer.from(this.cursor).toString('base64');
  }

  decode(): string {
    return Buffer.from(this.cursor, 'base64').toString('utf8');
  }
}
