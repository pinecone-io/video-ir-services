import React, { CSSProperties, useEffect, useState } from "react"
import { useDrag, useDrop } from "react-dnd"
import { queryBox } from "../services/boxService"
import { labelBoxes } from "../services/labelBoxesService"
import { negativeLabel } from "../services/negativeLabelService"
import { ItemTypes } from "./ItemTypes"

interface LabelingControlsProps {
  selectedBox: string;
  setSelectedBoxes: React.Dispatch<React.SetStateAction<LabeledImage[]>>;
  refreshImages: () => void;
  progressRate: number;
  handleGotSimilarResults: () => void;
}

type ImageProps = {
  labeledImage: LabeledImage;
};

export type LabeledImage = {
  boxId: string;
  path: string;
  label: string;
  category: string;
  frameIndex: string;
  score: number;
};

interface DropdownOption {
  value: string | null;
  label: string;
}

interface DropdownOptions {
  options: Array<DropdownOption>;
  onClick: (val: string | null) => void;
}

const DropDown: React.FC<DropdownOptions> = ({ options, onClick }) => {
  const [dropdownVisible, setDropdownVisible] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState<string>("Filter")

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible)
  }

  const onSelect = (val: DropdownOption) => {
    setSelectedLabel(val.label)
    onClick(val.value)
    toggleDropdown()
  }

  return (
    <div className="relative inline-block text-left">
      <button
        id="dropdownDefaultButton"
        data-dropdown-toggle="dropdown"
        className="text-black  font-medium rounded-[5px] text-sm py-[15.5px] text-center inline-flex justify-center items-center border-1 border-black h-[50px] w-[114px]"
        type="button"
        onClick={toggleDropdown}
      >
        {" "}
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mr-[5px]"
        >
          <g clipPath="url(#clip0_160_100163)">
            <path
              d="M7.58333 13.25H10.4167V11.8333H7.58333V13.25ZM2.625 4.75V6.16667H15.375V4.75H2.625ZM4.75 9.70833H13.25V8.29167H4.75V9.70833Z"
              fill="#01004B"
            />
          </g>
          <defs>
            <clipPath id="clip0_160_100163">
              <rect
                width="17"
                height="17"
                fill="white"
                transform="translate(0.5 0.5)"
              />
            </clipPath>
          </defs>
        </svg>
        {selectedLabel}
      </button>

      {dropdownVisible && (
        <div
          id="dropdown"
          className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
          style={{ zIndex: 9999 }}
        >
          <ul
            className="py-1 text-base leading-6 text-gray-700 ring-1 ring-black ring-opacity-5"
            aria-labelledby="dropdownDefaultButton"
          >
            {options.map((option) => {
              return (
                <li>
                  <a
                    onClick={() => onSelect(option)}
                    className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                  >
                    {option.label}
                  </a>
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
  }))

  const opacity = isDragging ? 0.4 : 1
  const [loaded, setLoaded] = useState(false)

  return (
    <div
      ref={drag}
      style={{ opacity, fontSize: "0.8em" }}
      data-testid={"box"}
      className="relative group inline-block bg-white shadow-md rounded-lg"
    >
      {/* Grid container */}
      <div className="flex flex-col">
        <div className="mb-[21px]">
          {/* Image */}
          {!loaded && (
            <div className="animate-pulse min-w-[192px] w-full h-[127px] rounded-t-xl10 bg-gray-300" />
          )}
          <img
            src={labeledImage.path}
            alt={labeledImage.label || "no label"}
            className={`min-w-[192px] w-full h-[127px] rounded-t-xl10 ${loaded ? "" : "hidden"
              }`}
            onLoad={() => setLoaded(true)}
          />
        </div>
        <div className="flex flex-wrap px-[17px] pb-[27px]">
          {/* Label */}
          <div className="text-center text-darkLabel font-xs capitalize mb-[7px] flex flex-wrap">
            <div className="bg-gray-200 py-[5px] px-[10px] rounded-[8px]">
              {labeledImage.label || "no label"}
            </div>
          </div>
          {/* Category */}
          <div className="text-center text-darkLabel font-xxs capitalize mb-[7px] ml-[5px]  flex flex-wrap">
            <div className="bg-gray-200 py-[5px] px-[10px] rounded-[8px]">
              {labeledImage.category}
            </div>
          </div>
          {/* Frame Index */}
          <div className="text-center text-darkLabel font-xs capitalize mb-[7px] ml-[5px]  flex flex-wrap">
            <div className="bg-gray-200 py-[5px] px-[10px] rounded-[8px]">
              {labeledImage.frameIndex}
            </div>
          </div>
          {/* Score */}
          <div className="text-center text-darkLabel font-xs capitalize mb-[7px]  flex flex-wrap">
            <div className="bg-gray-200 py-[5px] px-[10px] rounded-[8px]">
              {(labeledImage.score * 100).toFixed(2) + "%"}
            </div>
          </div>
        </div>
      </div>
      {/* Semi-transparent layer */}
      <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-30 opacity-0  cursor-pointer"></div>
    </div>
  )
}

const deepCopy = (obj: unknown) => {
  return JSON.parse(JSON.stringify(obj))
}

const LabelingControls: React.FC<LabelingControlsProps> = ({
  selectedBox,
  setSelectedBoxes,
  refreshImages,
  progressRate,
  handleGotSimilarResults
}) => {
  //tailwind 10px padding
  const [images, setImages] = useState<Array<LabeledImage>>([])

  const [imagesToLabel, setImagesToLabel] = useState<Array<LabeledImage>>([])
  const [searchingForLabel, setSearchingForLabel] = useState<boolean>(false)


  const [imagesToNegativeLabel, setImagesToNegativeLabel] = useState<
    Array<LabeledImage>
  >([])

  const [labelValue, setLabelValue] = useState<string>("")
  const [labeling, setLabeling] = useState<boolean>(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isGood, setIsGood] = useState<boolean>(false)

  const handleLabel = async (
    boxId: string,
    setLabelFunction: React.Dispatch<React.SetStateAction<LabeledImage[]>>
  ) => {
    setSearchingForLabel(true)
    const similarResult = await queryBox(boxId, true)
    const similar: LabeledImage[] = await similarResult?.json()
    const similarBoxIds = similar.map((image) => image.boxId)

    return new Promise((resolve) => {
      setLabelFunction((prev) => {
        const image = images.find((img) => img.boxId === boxId)
        const similarImages = images.filter((img) =>
          similarBoxIds.includes(img.boxId)
        )
        if (!image) return prev

        const imageCopy = deepCopy(image)
        const similarImagesCopy = deepCopy(similarImages)
        setImages((prevImages) =>
          prevImages.filter(
            (img) => ![boxId, ...similarBoxIds].includes(img.boxId)
          )
        )
        setSearchingForLabel(false)
        return [...prev, imageCopy, ...similarImagesCopy]
      })
      resolve(null)
    })
  }

  const addToLabel = async (boxId: string) => {
    await handleLabel(boxId, setImagesToLabel)
  }

  const addToNegativeLabel = async (boxId: string) => {
    await handleLabel(boxId, setImagesToNegativeLabel)
  }

  useEffect(() => {
    setImagesToLabel([])
    setImagesToNegativeLabel([])
    setImages([])
    //Async function to queryBoxImages
    const getBoxImages = async () => {
      if (!selectedBox) return
      const response = await queryBox(selectedBox)
      const result = await response?.json()

      setIsGood(response.ok)
      setSelectedBoxes(result)
      setImages(result)
      handleGotSimilarResults()
    }
    getBoxImages()
  }, [selectedBox, setSelectedBoxes, handleGotSimilarResults])

  const submitLabel = async () => {
    setLabeling(true)
    await labelBoxes(
      labelValue,
      imagesToLabel.map((image) => image.boxId)
    )

    await negativeLabel(
      selectedBox,
      imagesToNegativeLabel.map((image) => image.boxId)
    )

    await refreshImages()
    setImagesToLabel([])
    setImagesToNegativeLabel([])
    setImages([])
    setLabeling(false)
  }

  const style: CSSProperties = {
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
  }

  const [{ canDrop, isOver }, drop] = useDrop(
    () => ({
      accept: ItemTypes.BOX,
      drop: (item: { name: string; labeledImage: { boxId: string } }) => {
        addToNegativeLabel(item.labeledImage.boxId)
        return { item }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [images]
  )

  const [{ canDrop: canDropSecond, isOver: isOverSecond }, dropSecond] =
    useDrop(
      () => ({
        accept: ItemTypes.BOX,
        drop: async (item: {
          name: string;
          labeledImage: { boxId: string };
        }) => {
          await addToLabel(item.labeledImage.boxId)
          return { item, name: "label" }
        },
        collect: (monitor) => ({
          isOver: monitor.isOver(),
          canDrop: monitor.canDrop(),
        }),
      }),
      [images]
    )

  const isActive = canDrop && isOver
  // const isActiveSecond = canDropSecond && isOverSecond;

  // eslint-disable-next-line no-shadow
  const getBackgroundColor = (canDrop: boolean, isActive: boolean) => {
    let backgroundColor = "#202A37"
    if (isActive) {
      backgroundColor = "#8CF1FF"
    } else if (canDrop) {
      backgroundColor = "#3B81F6"
    }
    return backgroundColor
  }

  const dropdownOptions = [
    {
      value: null,
      label: "No filter",
    },
    {
      value: "similar",
      label: "Similar",
    },
    {
      value: "similarToAverage",
      label: "Similar To Average",
    },
    {
      value: "sameLabel",
      label: "Same Label",
    },
  ]

  return (
    <div className="container p-labelsControls h-full">
      <div className="flex justify-center mt-[65px]">
        {progressRate !== 100 && (
          <div className="border-[0.5px] border-black border-opacity-[5%] bg-white formShadow pt-[36px] pb-[40px] pl-[25px] pr-[37px] mr-[23px]">
            <div className="flex w-full items-center justify-center">
              <div className="text-cta-500 font-semibold text-base16 mr-[15px]">
                Images Download
              </div>
              <div className="w-[406px] h-[15px] bg-gray-400 rounded-full">
                <div
                  className="bg-cta-100 h-[15px] p-0.5 leading-none rounded-full"
                  style={{ width: progressRate + "%" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div
          className={`${isGood ? "bgGradientLabel min-h-[70px]" : "bgGradient"
            } w-[606px] pt-[14px] pb-[23px] px-[16px] flex `}
        >
          <div className="mr-[12px]">
            {isGood ? (
              <svg
                width="18"
                height="14"
                viewBox="0 0 18 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.06216 10.5518L2.23965 6.72935L0.937988 8.02185L6.06216 13.146L17.0622 2.14602L15.7697 0.853516L6.06216 10.5518Z"
                  fill="#15B077"
                />
              </svg>
            ) : (
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.0835 6.41683H11.9168V8.25016H10.0835V6.41683ZM10.0835 10.0835H11.9168V15.5835H10.0835V10.0835ZM11.0002 1.8335C5.94016 1.8335 1.8335 5.94016 1.8335 11.0002C1.8335 16.0602 5.94016 20.1668 11.0002 20.1668C16.0602 20.1668 20.1668 16.0602 20.1668 11.0002C20.1668 5.94016 16.0602 1.8335 11.0002 1.8335ZM11.0002 18.3335C6.95766 18.3335 3.66683 15.0427 3.66683 11.0002C3.66683 6.95766 6.95766 3.66683 11.0002 3.66683C15.0427 3.66683 18.3335 6.95766 18.3335 11.0002C18.3335 15.0427 15.0427 18.3335 11.0002 18.3335Z"
                  fill="#1B17F5"
                />
              </svg>
            )}
          </div>
          <p
            className={"text-sm14 font-normal text-cta-500 max-w-[500px] h-min"}
          >
            {isGood
              ? "An object has been detected in the video. You can now proceed to view additional details."
              : "When you select an object on the video, a request to load object details will be sent. Please wait while the information is retrieved. This process may take some time."}
          </p>
        </div>
      </div>
      <h1 className="m-auto text-lg24 text-cta-500 font-bold text-center mb-[22px] pt-[44px]">
        Video Image Recognition
      </h1>
      <div className="mb-mx40 flex items-center justify-center">
        <div className="relative mr-3">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute z-30 left-[20px] bottom-[14px]"
          >
            <path
              d="M15 15.9999L11 19.9999H21V15.9999H15ZM12.06 7.1899L3 16.2499V19.9999H6.75L15.81 10.9399L12.06 7.1899ZM5.92 17.9999H5V17.0799L12.06 9.9999L13 10.9399L5.92 17.9999ZM18.71 8.0399C19.1 7.6499 19.1 6.9999 18.71 6.6299L16.37 4.2899C16.1825 4.10389 15.9291 3.99951 15.665 3.99951C15.4009 3.99951 15.1475 4.10389 14.96 4.2899L13.13 6.11989L16.88 9.86989L18.71 8.0399Z"
              fill="#01004B"
            />
          </svg>
          <div className="relative">

            <input
              type="text"
              className={`placeholder-gray-600 border-xs4 border-cta-300 rounded-lg min-w-[771px] h-[50px] bg-white text-gray-600 py-[16px] pl-[57px] pr-[15px] ${labeling ? "pl-12" : ""}`}
              placeholder="Name selected object with label..."
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              disabled={labeling}
            />
            {labeling && (
              <svg
                className="absolute right-4 top-1/3 transform -translate-y-1/3 animate-rotate h-5 w-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
          </div>
        </div>
        <button
          className={`ml-2 bg-cta-100 font-bold text-base16 text-white py-[15.5px] px-[29px] rounded-[5px] h-[50px] ${labeling ? "opacity-50 cursor-not-allowed" : ""
            }`}
          onClick={() => {
            submitLabel()
          }}
        >
          Submit
        </button>
        <div className="ml-[14px]">
          <DropDown
            options={dropdownOptions}
            onClick={(val) => setSelectedCategory(val)}
          />
        </div>
      </div>

      <div
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 border-[0.5px] bg-gray-200 border-black border-opacity-[5%] rounded-md py-[40px] px-[110px] mb-[53px] ${searchingForLabel ? "animate-pulse" : ""}`}
        style={{ maxHeight: "40vh", overflow: "auto" }}
      >
        {images.length > 0 ? (
          images
            .filter((labeledImage) => {
              if (!selectedCategory) {
                return true
              } else {
                return labeledImage.category === selectedCategory
              }
            })
            .map((labeledImage) => {
              return (
                <ImageComponent
                  key={labeledImage.boxId}
                  labeledImage={labeledImage}
                />
              )
            })
        ) : (
          <p className="w-full text-center text-gray-500 col-span-full">
            No images available. Click an identified object to populate.
          </p>
        )}
      </div>
      <div className="flex justify-between pb-40 h-full">
        <div className="w-1/2 mr-[33px]">
          <h2 className="mb-[17px] text-center text-base16 text-cta-500 font-semibold">
            Negative Label
          </h2>

          <div
            ref={drop}
            style={{
              ...style,
              backgroundColor: getBackgroundColor(canDrop, isOver),
              minHeight: "1005px",
            }}
            className="relative"
            data-testid="dustbin"
          >
            <div className="absolute top-[40px] left-[50%] translate-x-[-50%] text-sm14 font-bold">
              {isActive ? "Release to drop" : "Drag a box here"}
            </div>
            <div className="relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-3 gap-2.5 rounded-md p-1 mb-3 place-items-start">
                {imagesToNegativeLabel.map((labeledImage, index) => {
                  return (
                    <ImageComponent
                      key={`negative-${labeledImage.boxId}-${index}`}
                      labeledImage={labeledImage}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="w-1/2">
          <h2 className="mb-[17px] text-center text-base16 text-cta-500 font-semibold">
            Positive Label
          </h2>
          <div
            ref={dropSecond}
            style={{
              ...style,
              backgroundColor: getBackgroundColor(canDropSecond, isOverSecond),
              minHeight: "1005px",
            }}
            className="relative"
            data-testid="dustbin"
          >
            <div className="absolute top-[40px] left-[50%] translate-x-[-50%] text-sm14 font-bold">
              {isActive ? "Release to drop" : "Drag a box here"}
            </div>
            <div className="relative">
              <div className={"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-3 gap-2.5 rounded-md p-1 mb-3 place-items-start justify-items-start"}>
                {imagesToLabel.map((labeledImage, index) => {
                  return (
                    <ImageComponent
                      key={`positive-${labeledImage.boxId}-${index}`}
                      labeledImage={labeledImage}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LabelingControls
