import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-black w-full">
      <header className="border-b-1 border-color-primary-300 p-heading mb-mb42">
        <div className="flex">
          <Link to={"/"}>
            <img src="images/pinecone_logo.png" alt="Pinecone" />
          </Link>

          <h1 className="m-auto text-lg30 text-primary-100 font-bold">
            Video Image Recognition
          </h1>

          <NavLink
            to="/indexing"
            className={({ isActive }) =>
              `opacity-80 flex text-base15 font-semibold items-center ${
                isActive ? "text-primary-400" : ""
              }`
            }
          >
            Indexing
          </NavLink>

          <NavLink
            to={"/labelling"}
            className={({ isActive }) =>
              `ml-3 mr-3 opacity-80 flex text-base15 font-semibold items-center ${
                isActive ? "text-primary-400" : ""
              }`
            }
          >
            Labelling
          </NavLink>

          <a
            href="https://www.pinecone.io/"
            target="_blank"
            className="opacity-80 flex text-base15 font-semibold items-center"
          >
            About Us
          </a>
        </div>
      </header>
      <Outlet />
    </div>
  );
};

export default Layout;
