export class Cursor {
  private cursor: string;
  constructor(name: string) {
    this.cursor = name;
  }
  encode(): string {
    return Buffer.from(this.cursor).toString('base64');
  }

  decode(): string {
    return Buffer.from(this.cursor, 'base64').toString('ascii');
  }
}
