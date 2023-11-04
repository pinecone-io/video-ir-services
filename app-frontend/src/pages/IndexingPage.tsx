import React, { useEffect, useRef, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import Loading from "../components/Loading";
import { download } from "../services/downloadService.ts";
import { socket } from '../utils/socket'

type TFormInput = {
  fps: number;
  youtubeUrl: string;
  name: string;
};

type LogLine = { ts: Date, message: string }

const IndexingPage: React.FC = () => {
  const [serverError, setServerError] = useState();
  const [progress, setProgress] = useState(0);
  const [filesToProcess, setFileToProcess] = useState(0);
  const [processedFiles, setProcessedFiles] = useState(0);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [isConnected, setIsConnected] = useState(socket.connected);
  // replace with your server URL

  const handleFilesToBeProcessedChanged = (data: { numberOfFilesToProcess: number }): void => {
    const { numberOfFilesToProcess } = data
    setFileToProcess(numberOfFilesToProcess)
  }

  const handleProcessedFilesChanged = (data: { progress: { val: number }, numberOfFilesProcessed: number }): void => {
    const { progress, numberOfFilesProcessed } = data
    setProcessedFiles(numberOfFilesProcessed)
    setProgress(progress.val)
  }

  const handleLogUpdated = (data: LogLine): void => {
    setLogs([...logs, data])
  }

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.on('instancesUpdated', (data): void => {
      console.log('data', data)
    })

    socket.on('filesToProcessChanged', handleFilesToBeProcessedChanged)
    socket.on('processedFilesChanged', handleProcessedFilesChanged)
    socket.on('logUpdated', handleLogUpdated)

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('filesToProcessChanged', handleFilesToBeProcessedChanged)
      socket.off('processedFilesChanged', handleProcessedFilesChanged)
      socket.off('logUpdated', handleLogUpdated)
    }
  });

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = useForm<TFormInput>({
    defaultValues: {
      youtubeUrl: "https://www.youtube.com/watch?v=ADs8tvU2xDc",
      name: "car-race",
      fps: 1,
    },
  });

  const onSubmit: SubmitHandler<TFormInput> = (data) => {
    return new Promise((resolve) => {
      download(data.youtubeUrl, data.name, data.fps)
        .catch((e) => setServerError(e.toString()))
        .finally(() => resolve(true));
    });
  };

  const endOfMessages = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    if (endOfMessages.current) {
      endOfMessages.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="min-h-screen bg-white text-primary-100 w-full">
      <div className="flex flex-wrap justify-center">
        <form className="w-[30%]" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex center">
            <label
              htmlFor="youtubeUrl"
              className="w-[85px] text-sm font-medium mr-3 inline-flex self-center"
            >
              Youtube Url:
            </label>
            <input
              type="text"
              id="youtubeUrl"
              {...register("youtubeUrl", { required: true })}
              className="border focus:border-primary-400 bg-white text-sm rounded-lg p-2.5 inline-block grow"
            />
          </div>
          <div className="flex center mt-3">
            <label
              htmlFor="name"
              className="w-[85px] text-sm font-medium mr-3 inline-flex self-center"
            >
              Name:
            </label>
            <input
              type="text"
              id="name"
              {...register("name", { required: true })}
              className="border focus:border-primary-400 bg-white text-sm rounded-lg p-2.5 inline-block grow"
            />
          </div>
          <div className="flex center mt-3">
            <label
              htmlFor="fps"
              className="w-[85px] text-sm font-medium mr-3 inline-flex self-center"
            >
              FPS:
            </label>
            <input
              type="number"
              min={1}
              id="fps"
              {...register("fps", { required: true })}
              className="border focus:border-primary-400 bg-white text-sm rounded-lg p-2.5 inline-block grow"
              required
            />
          </div>
          <button
            disabled={!isValid || isSubmitting}
            type="submit"
            className="m-auto mt-3 text-white block bg-blue-700 disabled:bg-blue-900 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center"
          >
            {isSubmitting && <Loading />}
            Submit
          </button>
          {serverError && (
            <div className="p-4 mt-3 text-sm text-red-800 rounded-lg bg-red-50">
              <span className="font-medium">Server Error: </span> {serverError}
            </div>
          )}


          <div className="w-full bg-gray-200 rounded-full dark:bg-gray-700 mt-3">
            <div className="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style={{ "width": `${progress}%` }}>{progress}%</div>
          </div>

          <div className="p-4 mb-4 text-sm mt-3 text-white rounded-lg bg-primary-800 h-[100px] whitespace-pre-line overflow-auto">
            <table style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ width: '90%' }}><b>Files to process</b></td>
                  <td>{filesToProcess}</td>
                </tr>
                <tr>
                  <td style={{ width: '90%' }}><b>Processed files</b></td>
                  <td>{processedFiles}</td>
                </tr>
                <tr>
                  <td style={{ width: '90%' }}><b>Total files</b></td>
                  <td>{processedFiles + filesToProcess}</td>
                </tr>
              </tbody>
            </table>
          </div>


        </form>
      </div>
      <div className="p-4 m-10 mr-40 text-sm mt-3 text-white rounded-lg bg-primary-800 h-[400px] whitespace-pre-line overflow-auto w-4/5" >
        <div style={{ overflow: 'auto', width: '100%', fontFamily: 'Courier New, monospace' }}>
          <table style={{ width: '100%' }}>
            <tbody>
              {logs.map((entry, index) => {
                return (
                  <tr key={index}>

                    <td>{entry.message}</td>
                  </tr>
                )
              })}
              <tr>
                <td ref={endOfMessages}>

                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default IndexingPage;
