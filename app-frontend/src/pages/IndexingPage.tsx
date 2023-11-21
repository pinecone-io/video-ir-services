import React, { useEffect, useRef, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import Loading from "../components/Loading";
import { download } from "../services/downloadService.ts";
import { socket } from "../utils/socket";
import { useFps } from "../hooks/fpsHook.ts";
import Dataflow, {
  DownloaderInstance,
  IndexerInstance,
} from "../components/Dataflow.tsx";
import { Modal } from "../components/Modal.tsx";

type TFormInput = {
  fps: number;
  youtubeUrl: string;
  name: string;
  chunkDuration: number;
  videoLimit: number;
};

type LogLine = { ts: Date; message: string };

const IndexingPage: React.FC = () => {
  const [started, setStarted] = useState(false);
  const [serverError, setServerError] = useState();
  const [progress, setProgress] = useState(0);
  const [filesToProcess, setFileToProcess] = useState(0);
  const [processedFiles, setProcessedFiles] = useState(0);
  const [numberOfObjects, setNumberOfObjects] = useState(0);
  const [numberOfEmbeddings, setNumberOfEmbeddings] = useState(0);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [showModal, setShowModal] = useState(false);
  const [completed, setCompleted] = useState({
    numberOfFilesProcessed: 0,
    executionTime: "",
    status: false,
  });
  const { FPS, setFps } = useFps();
  const resetProgress = (): void => {
    setProgress(0);
    setNumberOfObjects(0);
    setFileToProcess(0);
    setProcessedFiles(0);
    setCompleted({
      numberOfFilesProcessed: 0,
      executionTime: "",
      status: false,
    });
    setLogs([]);
    setIndexers({});
    setDownloaders({});
    setStarted(false);
  };
  const [indexers, setIndexers] = useState<{ [key: string]: IndexerInstance }>(
    {}
  );
  const [downloaders, setDownloaders] = useState<{
    [key: string]: DownloaderInstance;
  }>({});

  const handleFilesToBeProcessedChanged = (data: {
    numberOfFilesToProcess: number;
  }): void => {
    const { numberOfFilesToProcess } = data;
    setFileToProcess(numberOfFilesToProcess);
  };

  const handleProcessedFilesChanged = (data: {
    progress: { val: number };
    numberOfFilesProcessed: number;
    executionTime?: string;
  }): void => {
    const { progress, numberOfFilesProcessed } = data;
    setProcessedFiles(numberOfFilesProcessed);
    setProgress(progress.val);
  };

  const handleCompleted = (data: {
    numberOfFilesProcessed: number;
    executionTime: string;
    status: boolean;
  }): void => {
    setIndexers({});
    setCompleted(data);
    setShowModal(true);
    setStarted(false);
  };

  const handleLogUpdated = (data: LogLine): void => {
    setLogs([...logs, data]);
  };

  const handleNumberOfObjects = (data: number): void => {
    setNumberOfObjects(data);
  };

  const handleNumberOfEmbeddings = (data: number): void => {
    setNumberOfEmbeddings(data);
  };

  const handleDownloaderInstancesUpdated = (
    data: React.SetStateAction<{ [key: string]: DownloaderInstance }>
  ): void => {
    setDownloaders(data);
  };

  const handleIndexerInstancesUpdated = (
    data: React.SetStateAction<{ [key: string]: IndexerInstance }>
  ): void => {
    setIndexers(data);
  };

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      console.log("Socket disconnected");
      setIsConnected(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    socket.on("instancesUpdated", handleIndexerInstancesUpdated);

    socket.on("complete", handleCompleted);

    socket.on("filesToProcessChanged", handleFilesToBeProcessedChanged);
    socket.on("processedFilesChanged", handleProcessedFilesChanged);
    socket.on("logUpdated", handleLogUpdated);
    socket.on("numberOfObjectsUpdated", handleNumberOfObjects);
    socket.on("numberOfEmbeddingsUpdated", handleNumberOfEmbeddings);
    socket.on("downloaderInstancesUpdated", handleDownloaderInstancesUpdated);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("filesToProcessChanged", handleFilesToBeProcessedChanged);
      socket.off("processedFilesChanged", handleProcessedFilesChanged);
      socket.off("logUpdated", handleLogUpdated);
      socket.off("complete", handleCompleted);
      socket.off("numberOfObjectsUpdated", handleNumberOfObjects);
      socket.off("numberOfEmbeddingsUpdated", handleNumberOfEmbeddings);
      socket.off(
        "downloaderInstancesUpdated",
        handleDownloaderInstancesUpdated
      );
      socket.off("instancesUpdated", handleIndexerInstancesUpdated);
    };
  });

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = useForm<TFormInput>({
    defaultValues: {
      youtubeUrl: "https://www.youtube.com/watch?v=ADs8tvU2xDc",
      name: "car-race",
      fps: FPS,
      chunkDuration: 5,
    },
  });

  const onSubmit: SubmitHandler<TFormInput> = (data) => {
    return new Promise((resolve) => {
      resetProgress();
      setStarted(true);
      setShowModal(true);
      setFps(data.fps);
      resolve(true);
      download(
        data.youtubeUrl,
        data.name,
        data.fps,
        data.chunkDuration,
        data.videoLimit
      )
        .catch((e) => setServerError(e.toString()))
        .finally(() => resolve(true));
    });
  };

  const endOfMessages = useRef<HTMLTableCellElement | null>(null);
  const logsContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop =
        logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  console.log(started, completed)

  return (
    <div className="min-h-screen text-darkLabel w-full">
      <div className="flex flex-col bg-gray-200 items-center flex-wrap justify-center pb-[35px] mb-[53px]">
        <h1 className="m-auto text-lg30 text-primary-700 font-bold text-center mb-[55px] pt-[53px]">
          Video Image Recognition
        </h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={`border-[0.5px] border-black border-opacity-[5%] bg-white formShadow relative pl-[36px] pr-[38px] pt-[62px] mb-[27px]`}>
            <div className="flex flex-col mb-[27px]">
              <label
                htmlFor="youtubeUrl"
                className="mb-[5px] pl-[12px] text-base16 font-semibold text-primary-700"
              >
                Youtube Url:
              </label>
              <input
                type="text"
                id="youtubeUrl"
                {...register("youtubeUrl", { required: true })}
                className="border border-cta-300 w-[646px] text-gray-600 focus:border-primary-400 bg-white text-sm14 rounded-lg py-[16px] px-[12px] inline-block grow"
              />
            </div>
            <div className="flex mb-[36px]">
              <div className="flex flex-col mr-[20px]">
                <label
                  htmlFor="name"
                  className="mb-[5px] pl-[12px] text-base16 font-semibold text-primary-700"
                >
                  Name:
                </label>
                <input
                  type="text"
                  id="name"
                  {...register("name", { required: true })}
                  className="border border-cta-300 w-[314px] text-primary-600 focus:border-primary-400 bg-white text-base16 rounded-lg py-[16px] px-[12px]"
                />
              </div>
              <div className="flex flex-col">
                <label
                  htmlFor="fps"
                  className="mb-[5px] pl-[12px] text-base16 font-semibold text-primary-700"
                >
                  FPS:
                </label>
                <input
                  type="number"
                  min={1}
                  id="fps"
                  {...register("fps", { required: true })}
                  className="border border-cta-300 w-[314px] text-primary-600 focus:border-primary-400 bg-white text-sm14 rounded-lg py-[16px] px-[12px]"
                  required
                />
              </div>
            </div>
            <div className="flex mb-[30px]">
              <div className="flex flex-col mr-[18px]">
                <label
                  htmlFor="chunkDuration"
                  className="mb-[5px] pl-[12px] text-base16 font-semibold text-primary-700"
                >
                  Chunk Duration:
                </label>
                <input
                  type="number"
                  min={1}
                  id="chunkDuration"
                  {...register("chunkDuration", { required: true })}
                  className="border border-cta-300 w-[314px] text-primary-600 focus:border-primary-400 bg-white text-sm14 rounded-lg py-[16px] px-[12px]"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label
                  htmlFor="videoLimit"
                  className="mb-[5px] pl-[12px] text-base16 font-semibold text-primary-700"
                >
                  Video Limit:
                </label>
                <input
                  type="number"
                  min={1}
                  id="videoLimit"
                  {...register("videoLimit")}
                  className="border border-cta-300 w-[314px] text-primary-600 focus:border-primary-400 bg-white text-sm14 rounded-lg py-[16px] px-[12px]"
                />
              </div>
            </div>
            <div className="flex bgGradient w-[650px] px-[16px] py-[14px] rounded-[4px] mb-[26px]">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mr-[14px]"
              >
                <path
                  d="M9.0835 5.41671H10.9168V7.25004H9.0835V5.41671ZM9.0835 9.08337H10.9168V14.5834H9.0835V9.08337ZM10.0002 0.833374C4.94016 0.833374 0.833496 4.94004 0.833496 10C0.833496 15.06 4.94016 19.1667 10.0002 19.1667C15.0602 19.1667 19.1668 15.06 19.1668 10C19.1668 4.94004 15.0602 0.833374 10.0002 0.833374ZM10.0002 17.3334C5.95766 17.3334 2.66683 14.0425 2.66683 10C2.66683 5.95754 5.95766 2.66671 10.0002 2.66671C14.0427 2.66671 17.3335 5.95754 17.3335 10C17.3335 14.0425 14.0427 17.3334 10.0002 17.3334Z"
                  fill="#1B17F5"
                />
              </svg>
              <p className="text-cta-500 text-sm14 font-normal">
                Please enter the required data in the provided fields. Your
                video will be processed after submission, and the process may
                take some time.
              </p>
            </div>
            <div className="pt-[5px] absolute left-[15px] top-[15px]">
              {isConnected ? (
                <span className="flex w-3 h-3 bg-green-200 rounded-full"></span>
              ) : (
                <span className="flex w-3 h-3 bg-red3-200 rounded-full"></span>
              )}
            </div>
            <button
              disabled={!isValid || isSubmitting}
              type="submit"
              className="text-white block bg-cta-100 disabled:bg-blue-900 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full px-5 py-2.5 text-center mb-[67px]"
            >
              {isSubmitting && <Loading />}
              Submit
            </button>
            {serverError && (
              <div className="p-4 mt-3 text-sm text-red-800 rounded-lg bg-red-50">
                <span className="font-medium">Server Error: </span>{" "}
                {serverError}
              </div>
            )}
          </div>

          {(started || completed.status) && (
            <>
              <div className="border-[0.5px] border-black border-opacity-[5%] bg-white formShadow px-[37px] pt-[36px] pb-[40px] mb-[30px]">
                <div className="w-full flex items-center justify-between">
                  <p className="text-cta-500 font-semibold text-base16">
                    Video Processing
                  </p>
                  <div className="w-[504px] h-[15px] bg-gray-400 rounded-full">
                    <div
                      className="bg-cta-100 h-[15px] rounded-full"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="px-[38px] pt-[22px] pb-[28px] mb-[35px] text-base18 font-medium border-[0.5px] border-black border-opacity-[5%] bg-white formShadow">
                <table style={{ width: "100%" }}>
                  <tbody>
                    <tr className="border-b-[0.4px] border-primary-900">
                      <td>Files to process</td>
                      <td className="text-right">{filesToProcess}</td>
                    </tr>
                    <tr className="border-b-[0.4px] border-primary-900">
                      <td>Processed files</td>
                      <td className="text-right">{processedFiles}</td>
                    </tr>
                    <tr className="border-b-[0.4px] border-primary-900">
                      <td>Total files</td>
                      <td className="text-right">
                        {processedFiles + filesToProcess}
                      </td>
                    </tr>
                    <tr className="border-b-[0.4px] border-primary-900">
                      <td>Objects detected</td>
                      <td className="text-right">{numberOfObjects}</td>
                    </tr>
                    <tr>
                      <td>Embeddings</td>
                      <td className="text-right">{numberOfEmbeddings}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {(started || completed.status) && (
            <div className="py-4 px-[34px] mb-4 text-base18 font-normal mt-3 text-gray-500 border-[0.5px] roundend-[5px] border-black border-opacity-[5%] bg-white formShadow h-[137px] whitespace-pre-line overflow-auto">
              <div>
                {completed.status
                  ? "Completed!"
                  : started
                    ? "Processing..."
                    : ""}{" "}
                {(started || completed.status) && (
                  <>
                    {completed.numberOfFilesProcessed > 0 &&
                      `${completed.numberOfFilesProcessed} files processed`}{" "}
                    {completed.executionTime && `in ${completed.executionTime}`}
                  </>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
      {(started || completed.status) && (<div
        ref={logsContainerRef}
        className={`mx-auto px-[62px] pt-[56px] pb-[16px] mb-[50px] text-sm text-white rounded-lg bg-primary-800 ${!started ? "h-[120px]" : "h-[120px]"
          } whitespace-pre-line overflow-auto w-4/5`}
      >
        <div
          style={{
            overflow: "auto",
            width: "100%",
            fontFamily: "Courier New, monospace",
          }}
        >
          <table style={{ width: "100%" }}>
            <tbody>
              {logs.map((entry, index) => {
                return (
                  <tr key={index}>
                    <td>{entry.message}</td>
                  </tr>
                );
              })}
              <tr>
                <td ref={endOfMessages}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>)}

      <div style={{ height: "100vh", width: "100%", top: "-200px" }}>
        <Dataflow
          indexerInstances={Object.values(indexers)}
          downloaderInstances={Object.values(downloaders)}
        />
      </div>
      <footer className="text-center text-black p-smallFooter  mb-[35px]">
        <p className="p-2">All Rights Reserved by Pinecone</p>
      </footer>
      {showModal && (
        <Modal
          title={completed.status ? "Processing Completed" : "Processing Video"}
          paragraph={
            completed.status
              ? `Your video has been successfully processed. You can now view the results.`
              : "Your video is currently being processed. This may take some time. You can still view and label the parts of the video that have been processed on the labeling page. Thank you for your patience."
          }
          button={completed.status ? false : true}
          buttonText="Okay"
          status={completed.status}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default IndexingPage;
