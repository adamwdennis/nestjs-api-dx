export interface NodeEntity {
  id: string;
}

export type NodeEntityWithDates = NodeEntity & {
  createdAt: Date;
  updatedAt?: Date;
};
