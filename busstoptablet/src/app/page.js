"use client";
import Head from "next/head";
import LocationButton from "./component/LocationButton";
import "bootstrap/dist/css/bootstrap.min.css"; // ✅ Import Bootstrap CS
import Link from "next/link";
import { useEffect } from "react";

{/* <Link href="/busTiming">
  <a className="nav-link">Bus Timing</a>
</Link>; */}

export default function Home() {
  useEffect(() => {
    const interval = setInterval(() => {
      // Reload the page
      window.location.reload();
    }, 300000); // Refresh every 30 seconds (adjust as needed)

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);
  return (
    <div>
      <Head>
        <title>Bus Stop Tablet</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
        />
      </Head>

      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <a className="navbar-brand" href="page.js">
          When Come?
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav">
            <li className="nav-item">
              <a href="/busTiming">Bus Timing</a>
            </li>
          </ul>
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <a className="nav-link" href="#">
                Login
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <h1 className="text-center mt-4">Bus Coming?</h1>
      <div className="container d-flex justify-content-center align-items-center">
        <div className="row">
            <div className="col text-center">
            <LocationButton />
            </div>
            </div>
        </div>
    </div>
  );
}
