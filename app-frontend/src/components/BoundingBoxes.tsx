import * as d3 from "d3";
import React, { useEffect, useRef, useState, } from "react";
import { LabeledBoundingBox } from "../types/Box";

const IMAGE_WIDTH = 3840;
const IMAGE_HEIGHT = 2160;

const BoundingBoxes: React.FC<{
  labeledBoundingBox: LabeledBoundingBox[];
  onBoxSelected: (boxId: string) => void;
  selectedBoxes?: Array<{ boxId: string; label: string }>;
  loading?: boolean;
}> = (props) => {

  const [selectedBox, setSelectedBox] = useState<string>("");
  const boxesRef = useRef<SVGSVGElement | null>(null);
  const svg = d3.select(boxesRef.current);
  const boundingClientRect = boxesRef.current?.getBoundingClientRect();

  const calculateX = (x: number) => ((boundingClientRect?.width || 0) * x) / IMAGE_WIDTH;
  const calculateY = (y: number) => ((boundingClientRect?.height || 0) * y) / IMAGE_HEIGHT;

  const defaultColor = "rgba(173, 216, 230, 0.9)";
  const selectedBoxColor = "rgba(165, 93, 224, 0.9)"

  const isBoxSelected = (boxId: string) => Array.isArray(props.selectedBoxes) ? props.selectedBoxes?.map((x) => x.boxId).includes(boxId) : false;
  const getBoxClass = (d: LabeledBoundingBox) => {
    if (props.loading && d.boxId === selectedBox) {
      return "loading cursor-pointer bounding-box-rect rect-selected animate-pulse";
    } else if (d.boxId === selectedBox) {
      return "cursor-pointer bounding-box-rect rect-selected";
    } else {
      return "cursor-pointer bounding-box-rect";
    }
  };

  const getBoxStroke = (d: LabeledBoundingBox) => {
    if (isBoxSelected(d.boxId)) {
      return "#9ADD66";
    } else if (selectedBox === d.boxId) {
      return selectedBoxColor;
    } else {
      return defaultColor;
    }
  };

  const getBoxText = (d: LabeledBoundingBox) => {
    let text = `${d?.label} ${(typeof d?.reason !== 'undefined') ? d?.reason : ''}`;
    if (props.loading && d.boxId === selectedBox) {
      text += " Loading...";
    }
    return text || "";
  };

  useEffect(() => {
    svg
      .selectAll<SVGGElement, LabeledBoundingBox>("rect")
      .attr("stroke", (d) => getBoxStroke(d));
  }, [props.selectedBoxes]);

  const handleSelectBox = (box: LabeledBoundingBox) => {
    setSelectedBox(box.boxId);
    props.onBoxSelected(box.boxId);
  }

  useEffect(() => {
    const rectGroups = svg
      .selectAll<SVGGElement, LabeledBoundingBox>("g")
      .data(props.labeledBoundingBox, (d) => d.boxId);

    rectGroups.exit().remove();

    rectGroups
      .selectAll("rect")
      .attr("class", (d) => getBoxClass(d))
      .attr("fill", "rgba(0, 128, 0, 0.9)");

    const newGroups = rectGroups
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${calculateX(d.box.left)}, ${calculateY(d.box.top)})`);

    newGroups
      .append("rect")
      .attr("class", getBoxClass)
      .attr("width", (d) => calculateX(d.box.width))
      .attr("height", (d) => calculateY(d.box.height))
      .attr("stroke-width", 2)
      .attr("stroke", getBoxStroke)
      .attr("fill-opacity", 0)
      .on("click", (_, d) => { handleSelectBox(d) });

    newGroups
      .append("text")
      .attr("class", getBoxClass)
      .attr("y", "-5")
      .attr("font-family", "Arial")
      .attr("font-size", "22px")
      .attr("font-weight", "bold")
      .attr("stroke", "black")
      .attr("stroke-width", "0.5px")
      .attr("fill", "white")
      .text(getBoxText);

    const updatedGroups = newGroups
      .merge(rectGroups)
      .attr("transform", (d) => `translate(${calculateX(d.box.left)}, ${calculateY(d.box.top)})`);

    updatedGroups
      .selectAll<SVGGElement, LabeledBoundingBox>("rect")
      .attr("class", getBoxClass)
      .attr("width", (d) => calculateX(d.box.width))
      .attr("height", (d) => calculateY(d.box.height))
      .attr("stroke", getBoxStroke);

    updatedGroups
      .selectAll<SVGGElement, LabeledBoundingBox>("text")
      .text(getBoxText);

  }, [props.labeledBoundingBox, props.loading]);

  return (
    <svg
      ref={boxesRef}
      id="boxes"
      className="absolute top-0 h-full w-full"
    ></svg>
  );
};

export default BoundingBoxes;

