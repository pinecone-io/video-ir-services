export type BoundingBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type LabeledBoundingBox = {
  boxId: string;
  box: BoundingBox;
  label?: string;
  score: number;
};

export type ImageWithBoundingBoxes = {
  frameIndex: string;
  src: string;
  labeledBoundingBoxes: LabeledBoundingBox[];
};

export type GetImagesDTO = {
  [key: string]: ImageWithBoundingBoxes;
}