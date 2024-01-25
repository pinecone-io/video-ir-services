import React from "react"
import { Link, NavLink, Outlet } from "react-router-dom"

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-black w-full">
      <header className="border-b-1 border-black border-opacity-10 p-heading">
        <div className="flex justify-between">
          <Link to={"/"}>
            <img src="images/pinecone_logo.png" alt="Pinecone" />
          </Link>

          <div className="flex items-center">
            <NavLink
              to="/indexing"
              className={({ isActive }) =>
                `opacity-80 flex text-sm14 hover:text-cta-100 font-normal items-center ${
                  isActive ? "text-cta-100" : "text-darkLabel"
                }`
              }
            >
              Indexing
            </NavLink>

            <NavLink
              to={"/labelling"}
              className={({ isActive }) =>
                `ml-[40px] mr-[40px] flex text-sm14 hover:text-cta-100 font-normal items-center ${
                  isActive ? "text-cta-100" : "text-darkLabel"
                }`
              }
            >
              Labelling
            </NavLink>

            <a
              href="https://www.pinecone.io/"
              target="_blank"
              className=" flex text-sm14 hover:text-cta-100 text-darkLabel font-normal items-center"
            >
              About Us
            </a>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  )
}

export default Layout
