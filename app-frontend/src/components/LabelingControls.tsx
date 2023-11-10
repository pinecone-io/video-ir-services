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

interface DropdownOption {
  value: string | null
  label: string
}

interface DropdownOptions {
  options: Array<DropdownOption>;
  onClick: (val: string | null) => void
}


const DropDown: React.FC<DropdownOptions> = ({ options, onClick }) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string>("Filter");

  const onSelect = (val: DropdownOption) => {
    setSelectedLabel(val.label)
    onClick(val.value)
    toggleDropdown()
  }

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };



  return (
    <div className="relative inline-block text-left">
      <button id="dropdownDefaultButton" data-dropdown-toggle="dropdown" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" type="button" onClick={toggleDropdown}>{selectedLabel}<svg className="w-2.5 h-2.5 ml-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
      </svg>
      </button>

      {dropdownVisible && (
        <div id="dropdown" className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5" style={{ zIndex: 9999 }}>
          <ul className="py-1 text-base leading-6 text-gray-700 ring-1 ring-black ring-opacity-5" aria-labelledby="dropdownDefaultButton">
            {options.map(option => {
              return (
                <li>
                  <a onClick={() => onSelect(option)} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option.label}</a>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}


const ImageComponent: React.FC<ImageProps> = ({ labeledImage }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.BOX,
    item: { name, labeledImage },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
      handlerId: monitor.getHandlerId(),
    }),
  }));

  const opacity = isDragging ? 0.4 : 1;
  return (
    <div
      ref={drag}

      style={{ opacity, fontSize: '0.8em' }}
      data-testid={`box`}
      className="relative group inline-block bg-white shadow-md rounded-lg p-4"
    >
      {/* Grid container */}
      <div className="grid grid-flow-row auto-rows-max md:grid-cols-3 gap-1 flex-wrap">
        {/* Label */}
        <div className="text-center text-darkLabel font-xs capitalize bg-white bg-opacity-50 flex flex-wrap">
          <div className="bg-gray-200 p-1 rounded">
            {labeledImage.label || "no label"}
          </div>
        </div>
        {/* Category */}
        <div className="text-center text-darkLabel font-xxs capitalize bg-white bg-opacity-50 flex flex-wrap">
          <div className="bg-gray-200 p-1 rounded">
            {labeledImage.category}
          </div>
        </div>
        {/* Frame Index */}
        <div className="text-center text-darkLabel font-xs capitalize bg-white bg-opacity-50 flex flex-wrap">
          <div className="bg-gray-200 p-1 rounded">
            {labeledImage.frameIndex}
          </div>
        </div>
        {/* Score */}
        <div className="text-center text-darkLabel font-xs capitalize bg-white bg-opacity-50 flex flex-wrap">
          <div className="bg-gray-200 p-1 rounded">
            {(labeledImage.score * 100).toFixed(2) + '%'}
          </div>
        </div>
      </div>
      {/* Image */}
      <img
        src={labeledImage.path}
        alt={labeledImage.label || "no label"}
        className="w-imageWidth h-imageHeight rounded-xl10 mt-4"
      />
      {/* Semi-transparent layer */}
      <div
        className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-30 opacity-0  cursor-pointer"
      >
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
  const [labeling, setLabeling] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

      setSelectedBoxes(result)
      setImages(result);
    };
    getBoxImages();
  }, [selectedBox, setSelectedBoxes]);

  const submitLabel = async () => {
    setLabeling(true);
    await labelBoxes(
      labelValue,
      imagesToLabel.map((image) => image.boxId)
    );



    await negativeLabel(selectedBox, imagesToNegativeLabel.map((image) => image.boxId));

    await refreshImages();
    setImagesToLabel([]);
    setImagesToNegativeLabel([])
    setImages([]);
    setLabeling(false);
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

  const dropdownOptions = [
    {
      value: null,
      label: 'No filter'
    },
    {
      value: 'similar',
      label: 'Similar'
    },
    {
      value: 'similarToAverage',
      label: 'Similar To Average'
    },
    {
      value: 'sameLabel',
      label: 'Same Label'
    }
  ]

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
          className={`ml-2 bg-primary-400 text-base16 text-white p-submitBtn rounded-xl10 ${labeling ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => {
            submitLabel();
          }}
        >
          Submit
        </button>
        <div className="ml-2">
          <DropDown options={dropdownOptions} onClick={(val) => setSelectedCategory(val)} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 border-2 border-gray-300 rounded-md p-4 mb-3" style={{ maxHeight: '40vh', overflow: 'auto' }}>
        {images.length > 0 ? images.filter((labeledImage) => {

          if (!selectedCategory) {
            return true
          } else {
            return labeledImage.category === selectedCategory
          }
        }).map((labeledImage) => {
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
                {imagesToNegativeLabel.map((labeledImage, index) => {
                  return (
                    <ImageComponent
                      key={`negative-${labeledImage.boxId}-${index}`}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-3 gap-2.5 rounded-md p-4 mb-3 place-items-start justify-items-start">
                {imagesToLabel.map((labeledImage, index) => {
                  return (
                    <ImageComponent
                      key={`positive-${labeledImage.boxId}-${index}`}
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
