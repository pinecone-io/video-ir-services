import * as d3 from "d3";
import React, { useEffect, useRef, useState } from "react";
import { LabeledBoundingBox } from "../types/Box";
import { queryBox } from "../services/boxService";

// TODO @rschwabco maybe we should store this data in ImageWithBoundingBoxes object
const IMAGE_WIDTH = 1280;
const IMAGE_HEIGHT = 720;

const BoundingBoxes: React.FC<{
  labeledBoundingBox: LabeledBoundingBox[];
  onBoxSelected: (boxId: string) => void;
}> = (props) => {
  const [selectedBoxes, setSelectedBoxes] = useState<
    Array<{ boxId: string; label: string }>
  >([]);
  const boxesRef = useRef<SVGSVGElement | null>(null);
  const svg = d3.select(boxesRef.current);
  const boundingClientRect = boxesRef.current?.getBoundingClientRect();

  const calculateX = (x: number) => {
    return ((boundingClientRect?.width || 0) * x) / IMAGE_WIDTH;
  };

  const calculateY = (y: number) => {
    return ((boundingClientRect?.height || 0) * y) / IMAGE_HEIGHT;
  };

  // Drow binding boxes
  useEffect(() => {
    // Bind Data
    const rectGroups = svg
      .selectAll<SVGGElement, LabeledBoundingBox>("g")
      .data(props.labeledBoundingBox, (d) => d.boxId);

    // Remove all obsolite groups
    rectGroups.exit().remove();

    // Create new groups
    const newGroups = rectGroups
      .enter()
      .append("g")
      .attr(
        "transform",
        (d) => `translate(${calculateX(d.box.left)}, ${calculateY(d.box.top)})`
      );

    // Create new rect
    newGroups
      .append("rect")
      .attr("class", "cursor-pointer")
      .attr("width", (d) => calculateX(d.box.width))
      .attr("height", (d) => calculateY(d.box.height))
      .attr("stroke-width", 4)
      .attr("stroke", (d) =>
        selectedBoxes.map((x) => x.boxId).includes(d.boxId)
          ? "#9ADD66"
          : "#FF1717"
      )
      .attr("fill-opacity", 0)
      .on("click", (_, d) => {
        props.onBoxSelected(d.boxId);

        (async () => {
          const response = await queryBox(d.boxId);

          // Find boxes and update them
          updatedGroups
            .selectAll("rect")
            .attr("stroke", (d) =>
              response.data.map((x) => x.boxId).includes(d.boxId)
                ? "#9ADD66"
                : "#FF1717"
            );

          setSelectedBoxes(response.data);
        })();
      });

    // Create new text
    newGroups
      .append("text")
      // Reduce top so label is sitting over rect
      .attr("y", "-5")
      .attr("font-family", "Arial")
      .attr("font-size", "14px")
      .attr("fill", "white")
      .text((d) => d?.label || "");

    // Update groups
    const updatedGroups = newGroups
      .merge(rectGroups)
      .attr(
        "transform",
        (d) => `translate(${calculateX(d.box.left)}, ${calculateY(d.box.top)})`
      );

    // Update rects
    updatedGroups
      .selectAll("rect")
      .attr("width", (d) => calculateX(d.box.width))
      .attr("height", (d) => calculateY(d.box.height))
      .attr("stroke", (d) =>
        selectedBoxes.map((x) => x.boxId).includes(d.boxId)
          ? "#9ADD66"
          : "#FF1717"
      );

    // Update text
    updatedGroups.selectAll("text").text((d) => d?.label || "");

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.labeledBoundingBox]);

  return (
    <svg
      ref={boxesRef}
      id="boxes"
      className="absolute top-0 h-full w-full"
    ></svg>
  );
};

export default BoundingBoxes;
