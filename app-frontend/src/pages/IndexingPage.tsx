import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import Loading from "../components/Loading";
import { download } from "../services/downloadService.ts";
import io from "socket.io-client";

type TFormInput = {
  fps: number;
  youtubeUrl: string;
  name: string;
};

const IndexingPage: React.FC = () => {
  const [serverError, setServerError] = useState();
  const [progress, setProgress] = useState(0);
  const [filesToProcess, setFileToProcess] = useState(0);
  const [processedFiles, setProcessedFiles] = useState(0);
  const socket = io('/', {
    path: '/app-sockets/socket',
    reconnection: false,
    secure: true,
    transports: ['websocket'],
  }); // replace with your server URL

  useEffect(() => {

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('instancesUpdated', (data): void => {
      console.log('data', data)
    })

    socket.on('filesToProcessChanged', (data): void => {
      const { numberOfFilesToProcess } = data
      setFileToProcess(numberOfFilesToProcess)

    })

    socket.on('processedFilesChanged', (data): void => {
      const { progress, numberOfFilesProcessed } = data
      setProcessedFiles(numberOfFilesProcessed)
      setProgress(progress.val)
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  }, [socket]);

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
    </div>
  );
};

export default IndexingPage;
