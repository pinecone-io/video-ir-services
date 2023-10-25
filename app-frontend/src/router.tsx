import VideoPage from "./pages/VideoPage";
import IndexingPage from "./pages/IndexingPage";
import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/Layout";

const router = createBrowserRouter([
  {
    element: <Layout/>,
    children: [
      {
        path: "indexing",
        element: <IndexingPage />,
      },
      {
        path: "*",
        element: <VideoPage />,
      },
    ],
  },
]);

export default router;
