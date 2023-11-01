import React, { CSSProperties, useEffect, useState } from "react";
import { labelBoxes } from "../services/labelBoxesService";
import { queryBox } from "../services/boxService";
import { negativeLabel } from "../services/negativeLabelService";
import { useDrop, useDrag } from "react-dnd";
import { ItemTypes } from "./ItemTypes";

interface LabelingControlsProps {
  selectedBox: string;
}

type ImageProps = {
  labeledImage: {
    path: string;
    label?: string;
  };
  onClick: () => void;
};

interface DropResult {
  name: string;
}

const ImageComponent: React.FC<ImageProps> = ({ labeledImage, onClick }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.BOX,
    item: { name, labeledImage },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult<DropResult>();
      if (item && dropResult) {
        console.log(`DROP RESULT`, item)
        // alert(`You dropped ${item.name} into ${dropResult.name}!`);
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
      handlerId: monitor.getHandlerId(),
    }),
  }));

  const opacity = isDragging ? 0.4 : 1;
  return (
    <div
      ref={drag}
      style={{ opacity }}
      data-testid={`box`}
      className="relative group inline-block"
    >
      {/* Image */}
      <img
        src={labeledImage.path}
        alt={labeledImage.label || "no label"}
        className="w-imageWidth h-imageHeight rounded-xl10"
      />

      {/* Semi-transparent layer */}
      <div
        className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-30 opacity-0  cursor-pointer"
        onClick={onClick}
      >
        {/* Trash Icon */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 2h6a1 1 0 011 1v1a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 011-1zm0 4h6a1 1 0 010 2H9a1 1 0 110-2zm1 5a1 1 0 00-1 1v6a1 1 0 001 1h4a1 1 0 001-1v-6a1 1 0 00-1-1h-4zm-1-1a1 1 0 00-1 1v6a1 1 0 001 1h4a1 1 0 001-1v-6a1 1 0 00-1-1h-4zm-3-7h10a1 1 0 011 1v12a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z"
            />
          </svg>
        </div>
      </div>

      {/* Label */}
      <div className="text-center mt-mt10 text-darkLabel font-sm14 capitalize">
        {labeledImage.label || "no label"}
      </div>
    </div>
  );
};

const LabelingControls: React.FC<LabelingControlsProps> = ({ selectedBox }) => {
  //tailwind 10px padding
  const [images, setImages] = useState<
    Array<{ boxId: string; path: string; label: string }>
  >([]);


  const [imagesToLabel, setImagesToLabel] = useState<
    Array<{ boxId: string; path: string; label: string }>
  >([]);

  const [imagesToNegativeLabel, setImagesToNegativeLabel] = useState<
    Array<{ boxId: string; path: string; label: string }>
  >([]);

  const [labelValue, setLabelValue] = useState<string>("");

  const handleDelete = async (selectedBox: string, boxId: string) => {
    // await negativeLabel(selectedBox, boxId);
    // Remove the image from the state
    // setImagePaths((prev) => prev.filter((image) => image.boxId !== boxId));
  };


  const addToLabel = (boxId: string) => {
    const image = { ...images.find((image) => image.boxId === boxId) };
    if (!image) return;

    const imageCopy = JSON.parse(JSON.stringify(image));

    setImagesToLabel((prev) => [...prev, imageCopy]);
    setImages((prev) => prev.filter((image) => image.boxId !== boxId));
  }

  const addToNegativeLabel = (boxId: string) => {
    const image = images.find((image) => image.boxId === boxId);
    if (!image) return;

    const imageCopy = JSON.parse(JSON.stringify(image));
    setImagesToNegativeLabel((prev) => [...prev, imageCopy]);
  }

  useEffect(() => {
    //Async function to queryBoxImages
    const getBoxImages = async () => {
      if (!selectedBox) return;
      const response = await queryBox(selectedBox);
      const result = await response.data;
      setImages(result);
    };
    getBoxImages();
  }, [selectedBox]);

  const submitLabel = async () => {
    await labelBoxes(
      labelValue,
      images.map((image) => image.boxId)
    );
  };

  const style: CSSProperties = {
    height: "17.81rem",
    width: "17.81rem",
    color: "white",
    padding: "1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    fontSize: "0.875rem",
    fontWeight: "700",
    lineHeight: "17px",
    borderRadius: "10px",
  };

  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.BOX,
    drop: (item: { name: string, labeledImage: { boxId: string } }) => {
      console.log(`IN DROP`, item)
      addToNegativeLabel(item.labeledImage.boxId);
      return { item };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const [{ canDrop: canDropSecond, isOver: isOverSecond }, dropSecond] =
    useDrop(() => ({
      accept: ItemTypes.BOX,
      drop: (item: { name: string, labeledImage: { boxId: string } }) => {
        console.log(`IN DROP`, item)
        addToLabel(item.labeledImage.boxId);
        return { item };
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }));

  const isActive = canDrop && isOver;
  const isActiveSecond = canDropSecond && isOverSecond;

  const getBackgroundColor = (canDrop: boolean, isActive: boolean) => {
    let backgroundColor = "#202A37";
    if (isActive) {
      backgroundColor = "#8CF1FF";
    } else if (canDrop) {
      backgroundColor = "#3B81F6";
    }
    return backgroundColor;
  };

  return (
    <div className="container mt-mt93 p-labelsControls">
      <div className="mb-mx40 flex items-center">
        <input
          type="text"
          className="w-inputWidth border-xs4 border-color-primary-900 rounded-lg p-2 bg-white text-color-gray-100 p-input mr-5"
          placeholder="Name selected object with label..."
          value={labelValue}
          onChange={(e) => setLabelValue(e.target.value)}
        />
        <button
          className="ml-2 bg-primary-400 text-base16 text-white p-submitBtn rounded-xl10 "
          onClick={() => {
            submitLabel();
          }}
        >
          Submit
        </button>
      </div>
      <div className="flex justify-between pb-40">
        <div
          ref={drop}
          style={{
            ...style,
            backgroundColor: getBackgroundColor(canDrop, isOver),
          }}
          data-testid="dustbin"
        >
          {isActive ? "Release to drop" : "Drag a box here"}
          {imagesToNegativeLabel.map((labeledImage) => {
            return (
              <ImageComponent
                key={labeledImage.boxId}
                labeledImage={labeledImage}
                onClick={() => handleDelete(selectedBox, labeledImage.boxId)}
              />
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {images.map((labeledImage) => {
            return (
              <ImageComponent
                key={labeledImage.boxId}
                labeledImage={labeledImage}
                onClick={() => handleDelete(selectedBox, labeledImage.boxId)}
              />
            );
          })}
        </div>
        <div
          ref={dropSecond}
          style={{
            ...style,
            backgroundColor: getBackgroundColor(canDropSecond, isOverSecond),
          }}
          data-testid="dustbin"
        >
          {isActiveSecond ? "Release to drop" : "Drag a box here"}
          {imagesToLabel.map((labeledImage) => {
            return (
              <ImageComponent
                key={labeledImage.boxId}
                labeledImage={labeledImage}
                onClick={() => handleDelete(selectedBox, labeledImage.boxId)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LabelingControls;
