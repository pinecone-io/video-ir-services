export type Metadata = {
  boxId?: string;
  imagePath?: string;
  frameIndex?: string;
  label?: string;
  negativeLabel?: string[];
};

export type BoundingBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type DetectedBoundingBox = {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
};

export type LabeledDetectedBoundingBox = {
  boxId: string;
  box: DetectedBoundingBox;
  label?: string;
  score: number;
};

export type LabeledBoundingBox = {
  box: BoundingBox;
  boxId: string;
  label?: string;
  score: number;
};

export type ImageWithBoundingBoxes = {
  frameIndex: string;
  src: string;
  labeledBoundingBoxes: LabeledBoundingBox[];
};

export type BoxResult = {
  boxId: string;
  label: string | undefined;
  path?: string;
};

export type FileWithReference = {
  boxId: string;
  path: string;
  frameIndex: string;
};

export type ObjectDetectionData = {
  [key: string]: ImageWithBoundingBoxes;
};
