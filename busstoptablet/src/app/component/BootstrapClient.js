"use client";
import { useEffect } from "react";

export default function BootstrapClient() {
  useEffect(() => {
    require("bootstrap/dist/js/bootstrap.bundle.min.js"); // ✅ Load Bootstrap JS
  }, []);

  return null; // ✅ No UI needed, just loads Bootstrap JS
}