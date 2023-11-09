import React, { CSSProperties, useEffect, useState } from "react";
import { labelBoxes } from "../services/labelBoxesService";
import { queryBox } from "../services/boxService";
import { negativeLabel } from "../services/negativeLabelService";
import { useDrop, useDrag } from "react-dnd";
import { ItemTypes } from "./ItemTypes";

interface LabelingControlsProps {
  selectedBox: string;
  setSelectedBoxes: React.Dispatch<React.SetStateAction<LabeledImage[]>>
  refreshImages: () => void;
}

type ImageProps = {
  labeledImage: LabeledImage;
};

type LabeledImage = { boxId: string; path: string; label: string, category: string, frameIndex: string, score: number; }

interface DropResult {
  name: string;
}

const ImageComponent: React.FC<ImageProps> = ({ labeledImage }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.BOX,
    item: { name, labeledImage },
    end: async (item, monitor) => {
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
        <div>
          {labeledImage.label || "no label"}
        </div>
        <div>
          {labeledImage.category}
        </div>
        <div>
          {labeledImage.frameIndex}
        </div>
        <div>
          {(labeledImage.score * 100).toFixed(2) + '%'}
        </div>
      </div>
    </div>
  );
};

const LabelingControls: React.FC<LabelingControlsProps> = ({ selectedBox, setSelectedBoxes, refreshImages }) => {
  //tailwind 10px padding
  const [images, setImages] = useState<
    Array<LabeledImage>
  >([]);

  const [imagesToLabel, setImagesToLabel] = useState<
    Array<LabeledImage>
  >([]);

  const [imagesToNegativeLabel, setImagesToNegativeLabel] = useState<
    Array<LabeledImage>
  >([]);

  const [labelValue, setLabelValue] = useState<string>("");

  const handleLabel = async (boxId: string, setLabelFunction: React.Dispatch<React.SetStateAction<LabeledImage[]>>) => {
    const similarResult = await queryBox(boxId, true);
    const similar: LabeledImage[] = await similarResult?.json();
    const similarBoxIds = similar.map((image) => image.boxId);

    return new Promise((resolve) => {
      setLabelFunction((prev) => {
        const image = images.find((image) => image.boxId === boxId);
        const similarImages = images.filter((image) => similarBoxIds.includes(image.boxId));
        if (!image) return prev

        const imageCopy = JSON.parse(JSON.stringify(image));
        const similarImagesCopy = JSON.parse(JSON.stringify(similarImages));
        setImages((prevImages) => prevImages.filter((image) => ![boxId, ...similarBoxIds].includes(image.boxId)));

        return [...prev, imageCopy, ...similarImagesCopy];
      });
      resolve(null)
    })
  };

  const addToLabel = async (boxId: string) => {
    await handleLabel(boxId, setImagesToLabel);
  };

  const addToNegativeLabel = async (boxId: string) => {
    await handleLabel(boxId, setImagesToNegativeLabel);
  };


  useEffect(() => {
    setImagesToLabel([]);
    setImagesToNegativeLabel([]);
    setImages([]);
    //Async function to queryBoxImages
    const getBoxImages = async () => {
      if (!selectedBox) return;
      const response = await queryBox(selectedBox);
      const result = await response?.json();
      console.log(result)
      setSelectedBoxes(result)
      setImages(result);
    };
    getBoxImages();
  }, [selectedBox, setSelectedBoxes]);

  const submitLabel = async () => {
    await labelBoxes(
      labelValue,
      imagesToLabel.map((image) => image.boxId)
    );

    await negativeLabel(selectedBox, imagesToNegativeLabel.map((image) => image.boxId));

    await refreshImages();
  };

  const style: CSSProperties = {
    // height: "17.81rem",
    // width: "17.81rem",
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
      console.log(`IN DROP NEGATIVE`, item.labeledImage.boxId)
      addToNegativeLabel(item.labeledImage.boxId);
      return { item };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [images]);

  const [{ canDrop: canDropSecond, isOver: isOverSecond }, dropSecond] =
    useDrop(() => ({
      accept: ItemTypes.BOX,
      drop: async (item: { name: string, labeledImage: { boxId: string } }) => {
        console.log(`IN DROP POSITIVE`, item.labeledImage.boxId)
        await addToLabel(item.labeledImage.boxId);
        return { item, name: "label" };
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }), [images]);

  const isActive = canDrop && isOver;
  // const isActiveSecond = canDropSecond && isOverSecond;

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
    <div className="container p-labelsControls h-full">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5 border-2 border-gray-300 rounded-md p-4 mb-3">
        {images.length > 0 ? images.map((labeledImage) => {
          return (
            <ImageComponent
              key={labeledImage.boxId}
              labeledImage={labeledImage}
            />
          );
        }) : <p className="w-full text-center text-gray-500 col-span-full">No images available. Click an identified object to populate.</p>}
      </div>
      <div className="flex justify-between pb-40 h-full">
        <div className="w-1/2 mr-2">
          <h2>Negative Label</h2>

          <div
            ref={drop}
            style={{
              ...style,
              backgroundColor: getBackgroundColor(canDrop, isOver),
              height: '100%',
            }}
            className="relative"
            data-testid="dustbin"
          >
            <div className="absolute top-2 left-2">
              {isActive ? "Release to drop" : "Drag a box here"}
            </div>
            <div className="relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-3 gap-2.5 rounded-md p-4 mb-3 place-items-start">
                {imagesToNegativeLabel.map((labeledImage) => {
                  return (
                    <ImageComponent
                      key={labeledImage.boxId}
                      labeledImage={labeledImage}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="w-1/2 ml-2">
          <h2>Positive Label</h2>
          <div
            ref={dropSecond}
            style={{
              ...style,
              backgroundColor: getBackgroundColor(canDropSecond, isOverSecond),
              height: '100%',
            }}
            className="relative"
            data-testid="dustbin"
          >
            <div className="absolute top-2 left-2">
              {isActive ? "Release to drop" : "Drag a box here"}
            </div>
            <div className="relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-3 gap-2.5 rounded-md p-4 mb-3 place-items-start">
                {imagesToLabel.map((labeledImage) => {
                  return (
                    <ImageComponent
                      key={labeledImage.boxId}
                      labeledImage={labeledImage}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelingControls;
