import React, { useEffect, useRef, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import Loading from "../components/Loading";
import { download } from "../services/downloadService.ts";
import { socket } from "../utils/socket";
import { useFps } from "../hooks/fpsHook.ts";
import Dataflow, { DownloaderInstance, IndexerInstance } from "../components/Dataflow.tsx";
// import { Index } from '@pinecone-database/pinecone';

type TFormInput = {
  fps: number;
  youtubeUrl: string;
  name: string;
  chunkDuration: number;
  videoLimit: number;
};

type LogLine = { ts: Date; message: string }

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
  const [completed, setCompleted] = useState({ numberOfFilesProcessed: 0, executionTime: '', status: false })
  const { FPS, setFps } = useFps()
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
    // setDownloaders({})
    setIndexers({})
    setDownloaders({})
    setStarted(false)
  }
  const [indexers, setIndexers] = useState<{ [key: string]: IndexerInstance }>({});
  const [downloaders, setDownloaders] = useState<{ [key: string]: DownloaderInstance }>({});
  // const [downloaders, setDownloaders] = useState<{ [key: string]: boolean }>({});
  const [showLogs, setShowLogs] = useState(true);

  const handleFilesToBeProcessedChanged = (data: { numberOfFilesToProcess: number }): void => {
    const { numberOfFilesToProcess } = data
    setFileToProcess(numberOfFilesToProcess)
  }

  const handleProcessedFilesChanged = (data: { progress: { val: number }, numberOfFilesProcessed: number, executionTime?: string }): void => {
    const { progress, numberOfFilesProcessed } = data
    setProcessedFiles(numberOfFilesProcessed)
    setProgress(progress.val)
  }

  const handleCompleted = (data: { numberOfFilesProcessed: number, executionTime: string, status: boolean }): void => {
    setIndexers({})
    setCompleted(data)
  }

  const handleLogUpdated = (data: LogLine): void => {

    // const line = data.message

    // const pod = line.split(":")[0]
    // const isIndexer = line.includes("indexer")
    // const isDownloader = line.includes("downloader")
    // if (isIndexer) {
    //   setIndexers(prevIndexers => ({ ...prevIndexers, [pod]: true }));
    // }
    // if (isDownloader) {
    //   setDownloaders(prevDownloaders => ({ ...prevDownloaders, [pod]: true }));
    // }

    setLogs([...logs, data])
  }

  const handleNumberOfObjects = (data: number): void => {
    setNumberOfObjects(data)
  }

  const handleNumberOfEmbeddings = (data: number): void => {
    setNumberOfEmbeddings(data)
  }

  const handleDownloaderInstancesUpdated = (data): void => {
    console.log("data", data);
    setDownloaders(data);
  }

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      console.log("Socket disconnected")
      setIsConnected(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    socket.on("instancesUpdated", (data): void => {
      // console.log("data", data);
      setIndexers(data);
    });

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
      socket.off("downloaderInstancesUpdated", handleDownloaderInstancesUpdated);
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
  // useEffect(() => {
  //   if (endOfMessages.current) {
  //     endOfMessages.current.scrollIntoView({ behavior: "smooth" });
  //   }
  // }, [logs]);

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);



  return (
    <div className="min-h-screen text-darkLabel w-full">
      <div className="flex flex-col bg-gray-200 items-center flex-wrap justify-center ">
        <h1 className="m-auto text-lg30 text-primary-100 font-bold text-center mb-[32px] pt-[55px]">
          Video Image Recognition
        </h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col mb-[27px]">
            <label
              htmlFor="youtubeUrl"
              className="mb-[10px] pl-[12px] text-base16 font-semibold"
            >
              Youtube Url:
            </label>
            <input
              type="text"
              id="youtubeUrl"
              {...register("youtubeUrl", { required: true })}
              className="border border-darkLabel w-[705px] focus:border-primary-400 bg-white text-sm14 rounded-lg py-[16px] px-[12px] inline-block grow"
            />
          </div>
          <div className="flex mb-[36px]">
            <div className="flex flex-col mr-[20px]">
              <label
                htmlFor="name"
                className="mb-[10px] pl-[12px] text-base16 font-semibold"
              >
                Name:
              </label>
              <input
                type="text"
                id="name"
                {...register("name", { required: true })}
                className="border border-darkLabel w-[343px] focus:border-primary-400 bg-white text-base16 rounded-lg py-[16px] px-[12px]"
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="fps"
                className="mb-[10px] pl-[12px] text-base16 font-semibold"
              >
                FPS:
              </label>
              <input
                type="number"
                min={1}
                id="fps"
                {...register("fps", { required: true })}
                className="border border-darkLabel w-[343px] focus:border-primary-400 bg-white text-sm14 rounded-lg py-[16px] px-[12px]"
                required
              />
            </div>
          </div>
          <div className="flex">
            <div className="flex flex-col mr-[20px]">
              <label
                htmlFor="chunkDuration"
                className="mb-[10px] pl-[12px] text-base16 font-semibold"
              >
                Chunk Duration:
              </label>
              <input
                type="number"
                min={1}
                id="chunkDuration"
                {...register("chunkDuration", { required: true })}
                className="border border-darkLabel w-[343px] focus:border-primary-400 bg-white text-sm14 rounded-lg py-[16px] px-[12px] "
                required
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="videoLimit"
                className="mb-[10px] pl-[12px] text-base16 font-semibold"
              >
                Video Limit:
              </label>
              <input
                type="number"
                min={1}
                id="videoLimit"
                {...register("videoLimit")}
                className="border border-darkLabel w-[343px] focus:border-primary-400 bg-white text-sm14 rounded-lg py-[16px] px-[12px]"
              />
            </div>
          </div>
          <div className="pt-[5px]">
            {isConnected ? (
              <span className="flex w-3 h-3 bg-green-200 rounded-full"></span>
            ) : (
              <span className="flex w-3 h-3 bg-red3-200 rounded-full"></span>
            )}
          </div>
          <button
            disabled={!isValid || isSubmitting}
            type="submit"
            className="mt-[47px] text-white block bg-cta-100 disabled:bg-blue-900 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full px-5 py-2.5 text-center mb-[61px]"
          >
            {isSubmitting && <Loading />}
            Submit
          </button>
          {serverError && (
            <div className="p-4 mt-3 text-sm text-red-800 rounded-lg bg-red-50">
              <span className="font-medium">Server Error: </span> {serverError}
            </div>
          )}

          {(started || completed.status) && (
            <>
              <div className="w-full flex items-center justify-center mb-[45px]">
                <div className="w-[427px] h-[15px] bg-gray-200 rounded-full">
                  <div
                    className="bg-cta-100 h-[15px] text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="pl-[32px] pr-[43px] py-[22px] mb-[37px] text-base18 font-medium mt-3 text-darkLabel rounded-[10px] border-[0.5px] border-black border-opacity-5 bg-white">
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
            <div className="py-4 px-[34px] mb-4 text-base18 font-normal mt-3 text-gray-500 rounded-[10px] border-[0.5px] border-black border-opacity-5 bg-white h-[100px] whitespace-pre-line overflow-auto">
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
      {showLogs && (
        <div ref={logsContainerRef}
          className={`mx-auto px-[15px] pt-[56px] pb-[13px] mt-[17px] mb-[30px] text-sm text-white rounded-lg bg-primary-800 h-[100px] whitespace-pre-line overflow-auto w-4/5`}>
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
        </div>
      )}

      <div style={{ height: "100vh", width: "100%" }}>
        <Dataflow indexerInstances={Object.values(indexers)} downloaderInstances={Object.values(downloaders)} />
      </div>
      <footer className="text-center text-black p-smallFooter  mb-[35px]">
        <p className="p-2">All Rights Reserved by Pinecone</p>
      </footer>
    </div>
  );
};

export default IndexingPage;
