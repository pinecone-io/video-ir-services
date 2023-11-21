import { ModalProps } from "../types/Modal";

export const Modal: React.FC<ModalProps> = ({
  title,
  paragraph,
  status,
  onClose,
  button,
  buttonText,
}) => {
  return (
    <div className="modal-overlay fixed top-0 left-0 w-full h-full flex flex-col justify-center items-center bg-black bg-opacity-[41%]">
      <div className={`w-[584px] h-[${status ? "326px" : "416px"}]`}>
        <div className="bg-white h-full w-full rounded-[4px] flex flex-col">
          <div className="h-[80px] p-[33px] flex items-center justify-end">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              onClick={onClose}
              className="cursor-pointer"
            >
              <path
                d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z"
                fill="#121142"
              />
            </svg>
          </div>
          <div className="flex flex-col items-center justify-center pl-[32px] pr-[38px]">
            {status ? (
              <>
                <svg
                  width="56"
                  height="56"
                  viewBox="0 0 56 56"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="rounded-full mb-[24px]"
                >
                  <rect
                    width="56"
                    height="56"
                    rx="4"
                    fill="black"
                    fillOpacity="0.04"
                  />
                  <path
                    d="M25.3292 31.2291L21.8542 27.7541L20.6709 28.9291L25.3292 33.5875L35.3292 23.5875L34.1542 22.4125L25.3292 31.2291Z"
                    fill="#15B077"
                  />
                </svg>
              </>
            ) : (
              <>
                <img
                  src="/public/images/rotating_logo.svg"
                  alt="Pinecone Logo"
                  className="slow-rotate animate-slowRotate mb-[26px]"
                />
              </>
            )}
            <h2 className="mb-[8px] text-center font-semibold text-lg24 text-cta-200">
              {title}
            </h2>
            <p
              className={`${button ? "pb-[48px]" : "pb-[80px]"
                } text-cta-200 font-normal text-base16 text-center`}
            >
              {paragraph}
            </p>
            {button && (
              <div className="pb-[32px] w-full flex items-center justify-end">
                <button
                  className="py-[8px] px-[22px] text-base15 font-semibold text-white bg-cta-100 rounded-[4px] cursor-pointer"
                  onClick={onClose}
                >
                  {buttonText}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
