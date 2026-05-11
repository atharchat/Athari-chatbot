export interface VectorMetadata {
  source: string;
  topic?: string;
  page?: string | number;
  [key: string]: any;
}

export interface VectorEntity {
  id: string;
  values: number[];
  metadata: VectorMetadata;
}
