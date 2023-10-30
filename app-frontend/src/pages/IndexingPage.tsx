import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import Loading from "../components/Loading";
import { download } from "../services/downloadService.ts";
import { trackProgress } from "../services/trackProgress.ts";

type TFormInput = {
  fps: number;
  youtubeUrl: string;
  name: string;
};

const IndexingPage: React.FC = () => {
  const [serverError, setServerError] = useState();
  const [progressMessages, setProgressMessages] = useState("");

  useEffect(() => {
    trackProgress((evt) => {
      const response = evt.event.target.responseText;
      setProgressMessages(response);
    });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = useForm<TFormInput>({
    defaultValues: {
      youtubeUrl: "https://www.youtube.com/watch?v=PJ5xXXcfuTc",
      name: "highway-surveillance",
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

          <div className="p-4 mb-4 text-sm mt-3 text-white rounded-lg bg-primary-800 h-[300px] whitespace-pre-line overflow-auto">
            <b>Progress console</b> <br />
            {`${progressMessages}`}
          </div>
        </form>
      </div>
    </div>
  );
};

export default IndexingPage;
