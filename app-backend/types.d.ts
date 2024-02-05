declare interface ImportMeta {
  env: Record<string, string | boolean | undefined>;
}

type EmbeddingError = {
  imagePath: string,
  metadata: Metadata | undefined,
}

type Metadata = {
    boxId?: string;
    imagePath?: string;
    frameIndex?: string;
    label?: string;
    negativeLabel?: string[];
  };

type BoundingBox = {
    left: number;
    top: number;
    width: number;
    height: number;
  };

type DetectedBoundingBox = {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };

type LabeledDetectedBoundingBox = {
    boxId: string;
    box: DetectedBoundingBox;
    label?: string;
    score: number;
  };

type LabeledBoundingBox = {
    box: BoundingBox;
    boxId: string;
    label?: string;
    reason?: string;
    score: number;
  };

type ImageWithBoundingBoxes = {
    frameIndex: string;
    src: string;
    labeledBoundingBoxes: LabeledBoundingBox[];
  };

type BoxResult = {
    boxId: string;
    label: string | undefined;
    path?: string;
    score: number;
    category?: string;
  };

type FileWithReference = {
    boxId: string;
    path: string;
    frameIndex: string;
  };

type ObjectDetectionData = {
    [key: string]: ImageWithBoundingBoxes;
  };

type LabeledBoxSetItem = { boxId: string; label: string };

type Vector = number[];
